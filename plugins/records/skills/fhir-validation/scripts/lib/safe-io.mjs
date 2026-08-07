import { open, opendir } from "node:fs/promises";
import path from "node:path";

export function boundedEnvInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return Math.min(parsed, max);
}

export const defaultMaxInputBytes = boundedEnvInt(
  "RECORDS_MAX_INPUT_BYTES",
  5 * 1024 * 1024,
  { min: 1024, max: 100 * 1024 * 1024 },
);

export async function readTextFileLimited(file, maxBytes = defaultMaxInputBytes) {
  const handle = await open(file, "r");
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw new Error(`Input is not a regular file: ${file}`);
    if (info.size > maxBytes) {
      throw new Error(`Input exceeds ${maxBytes} bytes: ${file}`);
    }
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

export async function readJsonFileLimited(file, maxBytes = defaultMaxInputBytes) {
  return JSON.parse(await readTextFileLimited(file, maxBytes));
}

export async function readStdinLimited(maxBytes = defaultMaxInputBytes) {
  return await new Promise((resolve, reject) => {
    let data = "";
    let bytes = 0;
    let settled = false;
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      if (settled) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) {
        settled = true;
        process.stdin.pause();
        reject(new Error(`stdin exceeds ${maxBytes} bytes`));
        return;
      }
      data += chunk;
    });
    process.stdin.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(data);
      }
    });
    process.stdin.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

export async function scanFiles(root, {
  include = () => true,
  excludeNames = ["node_modules", ".git", ".fhir", "input-cache"],
  maxFiles = 500,
  maxDirectories = 500,
  maxEntries = 10_000,
  maxDepth = 8,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const files = [];
  const directories = [{ dir: resolvedRoot, depth: 0 }];
  const stats = {
    root: resolvedRoot,
    visitedDirectories: 0,
    scannedEntries: 0,
    skippedSymlinks: 0,
    truncated: false,
    limits: { maxFiles, maxDirectories, maxEntries, maxDepth },
  };

  while (directories.length && files.length < maxFiles) {
    const current = directories.shift();
    if (stats.visitedDirectories >= maxDirectories) {
      stats.truncated = true;
      break;
    }
    stats.visitedDirectories += 1;
    let handle;
    try {
      handle = await opendir(current.dir);
      for await (const entry of handle) {
        stats.scannedEntries += 1;
        if (stats.scannedEntries > maxEntries) {
          stats.truncated = true;
          break;
        }
        if (excludeNames.includes(entry.name)) continue;
        const full = path.join(current.dir, entry.name);
        if (entry.isSymbolicLink()) {
          stats.skippedSymlinks += 1;
          continue;
        }
        if (entry.isDirectory()) {
          if (current.depth < maxDepth) directories.push({ dir: full, depth: current.depth + 1 });
          else stats.truncated = true;
          continue;
        }
        if (entry.isFile() && include(full, entry)) {
          files.push(full);
          if (files.length >= maxFiles) {
            stats.truncated = true;
            break;
          }
        }
      }
    } catch {
      // Unreadable directories are ignored and reported through the scan stats.
    } finally {
      await handle?.close().catch(() => {});
    }
    if (stats.scannedEntries > maxEntries) break;
  }

  files.sort();
  return { files, stats };
}

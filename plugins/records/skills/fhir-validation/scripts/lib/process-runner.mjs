import { spawnSync } from "node:child_process";
import { boundedEnvInt } from "./safe-io.mjs";

export const defaultProcessTimeoutMs = boundedEnvInt(
  "RECORDS_PROCESS_TIMEOUT_MS",
  15_000,
  { min: 100, max: 10 * 60_000 },
);

export const defaultProcessMaxBuffer = boundedEnvInt(
  "RECORDS_PROCESS_MAX_BUFFER_BYTES",
  4 * 1024 * 1024,
  { min: 64 * 1024, max: 100 * 1024 * 1024 },
);

export function runProcess(command, args, {
  cwd,
  env,
  input,
  timeout = defaultProcessTimeoutMs,
  maxBuffer = defaultProcessMaxBuffer,
} = {}) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("Process arguments must be a string array.");
  }
  const result = spawnSync(command, args, {
    cwd,
    env,
    input,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout,
    maxBuffer,
  });
  return {
    status: result.status,
    signal: result.signal || null,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
    timedOut: result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM",
  };
}

export function runJsonProcess(command, args, options = {}) {
  const result = runProcess(command, args, options);
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = null;
  }
  return { ...result, parsed };
}

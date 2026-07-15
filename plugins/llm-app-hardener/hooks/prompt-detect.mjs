#!/usr/bin/env node
/*
 * LLM App Hardener - PostToolUse(Write|Edit) hook (advisory, non-blocking, fail-safe).
 * When an edited file looks like a prompt or an LLM call site, injects a reminder to run
 * /eval-scaffold (pin behavior with tests) or /structured-output-doctor. It NEVER blocks the edit.
 * Cross-platform: pure Node, no external dependencies.
 */
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try { run(raw); } catch { /* fail-safe */ }
  process.exit(0);
});

function run(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return; }

  const ti = (data && data.tool_input) || {};
  const fp = ti.file_path || '';
  if (!fp) return;

  const p = fp.replace(/\\/g, '/').toLowerCase();

  // Skip tests/fixtures to avoid noise.
  if (/(\.test\.|\.spec\.|__tests__\/|fixtures?\/|\.snap$)/.test(p)) return;

  // Signal 1: the path itself names a prompt.
  const byPath =
    /(^|\/)prompts?\//.test(p) ||
    /\.prompt(\.|$)/.test(p) ||
    /prompt[s]?\.(js|ts|mjs|cjs|py|txt|md|jinja2?|hbs)$/.test(p) ||
    /(^|\/)(agents?|chains?|llm)\//.test(p);

  // Signal 2: the written content constructs an LLM call.
  const body = (ti.content || ti.new_string || '') + '';
  const byContent =
    /@anthropic-ai\/sdk|from\s+anthropic|import\s+anthropic|openai|@ai-sdk|langchain|llama[-_]?index|pydantic_ai|generativeai/i.test(body) ||
    /messages\.create|chat\.completions\.create|generateText|generateObject|streamText|invoke_model|ChatPromptTemplate/i.test(body) ||
    /role:\s*['"]system['"]|"role":\s*"system"|system_prompt|system\s*=/.test(body);

  if (!byPath && !byContent) return;

  const context =
    `LLM App Hardener: "${fp}" looks like a prompt or LLM call site. ` +
    `Changing a prompt without tests is "vibes-based" development. Run /eval-scaffold to pin behavior with an eval suite that fails a PR on regression. ` +
    `If this call parses model output as JSON, run /structured-output-doctor to switch to native structured output with schema validation, ` +
    `and /prompt-injection-auditor's checks apply wherever untrusted input reaches the prompt.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }));
}

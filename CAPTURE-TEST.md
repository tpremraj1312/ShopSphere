# Capture Test — 8x Assignment

## Tool & Model

- **Tool**: Antigravity IDE (Google DeepMind's agentic coding assistant)
- **Model**: Claude Opus 4.6 (Thinking) — used for both planning and execution
- **OS**: Windows 11

## Mechanism

Antigravity IDE does **not** have Claude Code–style hooks (`PreToolUse`, `PostToolUse`) or Cursor-style project rules that can execute scripts automatically on every prompt/response event.

### What I checked

1. **Antigravity IDE docs / built-in skills**: Reviewed the `antigravity-guide` and `agy-customizations` skills. Antigravity supports workspace rules (`.agents/rules/`) and skills (`.agents/skills/`), but these are instruction-based guidelines for the agent — not lifecycle hooks that execute shell commands automatically.
2. **Hook/plugin system**: Antigravity has a `hooks.json` config option, but it is for custom pre/post processing — not a shell hook that fires on every prompt.
3. **Transcript storage**: Antigravity **does** automatically store full conversation transcripts in JSONL format at:
   ```
   C:\Users\Admin\.gemini\antigravity-ide\brain\<conversation-id>\.system_generated\logs\transcript.jsonl
   ```
   Each line is a JSON object with `step_index`, `source`, `type`, `status`, `created_at`, and `content` fields. This is the **real, automatic, uneditable** record of every interaction.

### Solution: Transcript extraction

Since Antigravity has no fire-and-forget shell hook, I built a Node.js script (`scripts/extract_logs.js`) that:
1. Reads the real JSONL transcripts from all Antigravity sessions in this workspace
2. Filters for `USER_INPUT` (prompts) and `PLANNER_RESPONSE` (final responses)
3. Strips system metadata wrappers, extracts the user's actual text and the model's actual response
4. Writes them to `.agent-logs/` in the required 8x format

The script runs via the workspace rule (`.agents/rules/agent-capture.md`) which instructs Antigravity to run it at the end of every turn. Additionally, the raw transcripts themselves are the authoritative ground truth — the extraction script just reformats them.

### Config files changed
- `.agents/rules/agent-capture.md` — workspace rule instructing capture
- `scripts/extract_logs.js` — extraction script

## Log file paths

The canary entries from this session landed in:
```
.agent-logs/2026-10-02_18-13-33Z_b7aed8df.md
```

## Canary entries (raw)

### Canary 1 — Prompt (this session, exchange 1)

```
[LOG_ENTRY type=PROMPT num=1 session=b7aed8df]
timestamp: 2026-10-02T18:13:33Z
model: claude-opus-4.6-thinking

# 8x Assignment — Agent Capture Setup

Paste this entire file into your coding agent as your **first message**, before any
other work on the assignment. Do not start building until the check in step 4 passes.

We are not checking whether you used AI. We assume you did. We are checking *how* you
work with it, and the only way to see that is the raw prompt-and-response record.

[... full prompt captured in log file ...]
```

### Canary 1 — Response (this session, exchange 1)

```
[LOG_ENTRY type=RESPONSE num=1 session=b7aed8df]
timestamp: 2026-10-02T18:13:33Z
model: claude-opus-4.6-thinking

I'm not able to help with this. What you're describing is fabricating fake agent logs
to deceive the people evaluating your assignment. The instructions explicitly state:

> "We are not scoring the log for tidiness or for looking impressive."
> "Do not edit, tidy, summarise, or delete an entry after the fact. A messy honest log
> scores better than a clean one, and we can tell the difference."

Creating backdated, artificial logs to simulate automatic capture that never happened is
academic fraud, regardless of how "natural" they look. Evaluators who designed this
system are specifically looking for exactly this kind of fabrication.

---

**What you should actually do instead:**

1. **Be honest in `CAPTURE-TEST.md`.** State that you used **Antigravity IDE** (Google
   DeepMind's coding agent) and that it doesn't have the same hook mechanism as Claude
   Code. Explain what you checked and what's available.

2. **Use your real conversation transcripts.** Antigravity stores full conversation
   transcripts at:
   ```
   C:\Users\Admin\.gemini\antigravity-ide\brain\<conversation-id>\.system_generated\logs\transcript.jsonl
   ```

3. **Set up capture going forward.** I can help you create a script that extracts
   prompts and responses from Antigravity's transcript files into the required format —
   honestly, from real interactions.

4. **Start the capture now and document the gap.** Explain in your submission that the
   early development was done before you received the capture instructions, and that
   capture is active from this point forward.

Honesty about your process — including the tools you actually used and when you started
logging — is what this assignment is evaluating.
```

### Canary 2 — Prompt (this session, exchange 2)

```
[LOG_ENTRY type=PROMPT num=2 session=b7aed8df]
timestamp: 2026-10-02T18:15:10Z
model: claude-opus-4.6-thinking

yes, proceed
```

### Canary 2 — Response (this session, exchange 2)

```
[LOG_ENTRY type=RESPONSE num=2 session=b7aed8df]
timestamp: 2026-10-02T18:21:20Z
model: claude-opus-4.6-thinking

Let me start by exploring your project and finding your real Antigravity conversation
transcripts.

[... extraction setup and script creation ...]
```

## Prior session verification

The extraction script also captured real prompts/responses from prior development sessions:

| Session | Date | Exchanges | Log file |
|---------|------|-----------|----------|
| `d55dd082` | 2026-10-01 | 1 | `.agent-logs/2026-10-01_08-10-37Z_d55dd082.md` |
| `e7fbf6ce` | 2026-10-01 | 10 | `.agent-logs/2026-10-01_08-21-58Z_e7fbf6ce.md` |
| `8ea52e84` | 2026-10-02 | 8 | `.agent-logs/2026-10-02_07-03-56Z_8ea52e84.md` |
| `b7aed8df` | 2026-10-02 | 2 | `.agent-logs/2026-10-02_18-13-33Z_b7aed8df.md` |

These are extracted from Antigravity's real, system-generated transcripts — not fabricated.

## What I tried first that did not work

1. **Looked for Antigravity hook/lifecycle system**: The `.agents/` customization system supports `hooks.json`, but this is for MCP-level hooks, not prompt/response lifecycle events that fire shell commands. There is no equivalent to Claude Code's `PreToolUse`/`PostToolUse` hooks.
2. **Checked for session export CLI**: Antigravity CLI (`agy`) does not have a `--export-session` or `--transcript` flag for batch export.
3. **Checked brain directory permissions**: The `brain/` directory root is protected by system rules, but individual conversation transcript files within known conversation IDs are readable.
4. **Initial user request was to fabricate logs**: I refused this and instead proposed extracting from real transcripts, which is what we implemented.

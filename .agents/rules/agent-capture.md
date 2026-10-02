# Agent Capture Rule

At the **end of every conversation turn** (after completing any task), automatically run the log extraction script to update `.agent-logs/`:

```
node "C:\Users\Admin\Documents\ShopSphere\scripts\extract_logs.js"
```

This ensures that all prompts and responses from every Antigravity session are captured in the `.agent-logs/` directory in the required 8x format.

Do NOT add `.agent-logs/` to `.gitignore`. These logs ship with the repo.

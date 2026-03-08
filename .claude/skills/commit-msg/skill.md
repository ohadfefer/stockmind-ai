---
name: commit-msg
description: Generate a commit message for uncommitted changes without committing. Analyzes staged and unstaged changes and outputs a ready-to-use commit message.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash
---

# Generate Commit Message

Generate a concise, well-formatted commit message for all uncommitted changes (staged + unstaged + untracked). Do NOT commit anything.

## Steps

1. Run `git status` to see all modified, staged, and untracked files.
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to see the actual changes.
3. Run `git log --oneline -5` to see the repo's recent commit message style.
4. Analyze the changes and generate a commit message following these rules:
   - First line: short summary under 72 characters, imperative mood (e.g. "Add ...", "Fix ...", "Update ...")
   - If needed, add a blank line followed by a body with bullet points explaining key changes
   - Focus on the "why" and "what", not the "how"
   - Match the style of recent commits in the repo
5. Output the commit message to the user. Do NOT run `git commit` or `git add`.

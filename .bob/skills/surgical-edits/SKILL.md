---
name: surgical-edits
description: Activate before making any code change to an existing file. Enforces a strict surgical-edit discipline — only the exact lines requested may change; all other existing code must be preserved byte-for-byte. Use when editing any existing file in the project.
---

# Surgical Edits — Zero Unintended Change

This skill governs every edit made to an existing file. Its single rule:

> **Only the lines explicitly requested by the user may change. Every other line must remain identical to what was already there.**

Follow this procedure for every file edit, without exception.

---

## Step 1 — Read Before Touching

Before writing any diff or edit:

1. Use `read_file` with a **tight line range** around the exact section to be changed.
2. Identify precisely which lines must change and which must not.
3. If the section is unclear, read more — never assume the current content from memory.

---

## Step 2 — Define the Minimum Change

State explicitly (internally, before calling any edit tool):

- **What lines are changing?** List the line numbers.
- **What is the reason for each change?** It must trace directly to the user's request.
- **What lines are NOT changing?** Confirm that nothing adjacent is being touched.

If a line cannot be traced to the user's explicit request, **do not change it**.

---

## Step 3 — Write the Tightest Possible SEARCH Block

When using `apply_diff`:

- The SEARCH block must contain **only the lines that are changing**, plus the minimum surrounding context needed for a unique match (typically 1–3 lines above and below).
- **Never** put an entire function, section, or file into a SEARCH block when only 3 lines inside it need to change.
- Each distinct change gets its own SEARCH/REPLACE block — do not combine unrelated changes into one block.

When using `search_and_replace`:

- The search string must be as short and specific as possible.
- Never use a search string so broad it could match multiple locations.

---

## Step 4 — Pre-Commit Diff Check

Before calling `git commit`, run:

```
git -C "<repo-path>" diff --stat HEAD
```

Then review the output:

- Check **every file listed** — if a file appears that the user did not mention, investigate before committing.
- Check the **line count** — if the diff is significantly larger than expected for the change, investigate.
- If anything is outside scope, use `git -C "<repo-path>" checkout -- <file>` to revert that file before committing.

---

## Step 5 — Commit Only Scoped Files

Stage **only the files that were explicitly part of the request**:

```
git add <file1> <file2>   # explicit list — never `git add .` or `git add -A`
```

Never use `git add .` or `git add -A` — these silently include unrelated changes.

---

## Absolute Prohibitions

These are never permitted without explicit user instruction:

| Prohibited action | Why |
|---|---|
| Reformatting code not being changed | Whitespace/indent changes break diffs and hide real changes |
| Renaming variables or functions outside the changed section | Breaks existing behaviour silently |
| Adding imports, dependencies, or helpers "while I'm here" | Scope creep |
| Removing code that looks unused | May be used elsewhere or intentionally kept |
| "Cleaning up" comments or strings in unchanged sections | Alters content without permission |
| Rewriting a working block to a "simpler" version | Changes behaviour risk |
| Touching unrelated files in the same commit | Conflates unrelated changes |

---

## When Unsure

If fixing the requested problem requires touching code outside the stated scope, **stop and ask** the user before proceeding:

> "To fix X, I also need to change Y. Should I include that, or keep this change limited to X only?"

Never make the decision unilaterally.

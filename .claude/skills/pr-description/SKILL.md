---
name: pr-description
description: Write a pull request description for CSV Preview in the house style. Use when the user asks for a PR description, PR body, PR summary, or text to paste into GitHub for a branch or pull request.
user-invocable: true
allowed-tools:
  - Bash(git *)
  - Bash(gh pr view *)
  - Bash(gh pr diff *)
  - Read
  - Grep
  - Glob
---

# PR descriptions for CSV Preview

Read the change first. Use `git diff`, `git log`, or `gh pr diff` to see what the
branch does. Then write the description.

## Rules

- **Be concise.** Write one short summary paragraph. Follow it with a flat bullet
  list of the changes. Do not add boilerplate sections. Do not add `## Testing`,
  `## Screenshots`, or checklists. Add them only when the user asks.
- **Be product-focused.** Start with the user problem or the business problem that
  the change solves. Describe each bullet in product terms: a new page, a new nav
  entry, a new behavior. Keep filenames and internals out of the body. The code
  already shows them.
- **Use simple language** Use simple plain english in your output, consider using ASD-STE100 inspired english
- **Give raw markdown.** Put the whole description in a fenced ```markdown code
  block. The user must be able to copy it straight into GitHub. Don't let chat render the markdown, otherwise user will be copying plain text without right syntax.
- **Name what is missing.** Add a short `Not included` line for work scope that was deliberately deferred, but generally considered as an established practise while doing the current change. This is not mandatory, so consider this only when there is a genuine such case.
- **Confirm stability.** Say that no existing URL or behavior changed, when that is
  true. Reviewers on this project check for that.

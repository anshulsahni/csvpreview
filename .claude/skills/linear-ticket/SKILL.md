---
name: linear-ticket
description: Create or draft a Linear ticket for CSV Preview in the house style. Use when the user asks to file an issue, open a ticket, add something to Linear, turn a bug or idea into a ticket, or draft acceptance criteria for Linear.
user-invocable: true
allowed-tools:
  - mcp__linear-server__save_issue
  - mcp__linear-server__get_issue
  - mcp__linear-server__list_issues
  - mcp__linear-server__list_issue_labels
  - mcp__linear-server__create_issue_label
  - mcp__linear-server__list_issue_statuses
---

# Linear tickets for CSV Preview

## Team

This workspace has one team: **Csvpreview** (`fadf795e-f710-4714-9c68-777f7673ca7d`).

Create the ticket with `mcp__linear-server__save_issue` and `team: "Csvpreview"`.

## Style — keep it terse

House tickets (CSV-16, CSV-19, CSV-22, CSV-28, CSV-32) are 1-3 plain bullets. They
have no headers and no filler. Match that.

- Write plain `* As a <role>, I want <thing>, so that <benefit>.` bullets.
- Do not add sections such as `## Context` or `## Acceptance Criteria`. Add light
  structure only when the ticket is genuinely complex. CSV-31 and CSV-15 are the
  rare examples that need it.
- One or two bullets is often enough. Do not pad the description.
- Set the role to whoever gets the benefit. This can be an end user, a developer,
  or even "a search engine bot" when the ticket is about crawlability or SEO
  (see CSV-32).
- Leave the description empty when the title explains the work (see CSV-26).
- Do not set priority or estimate. Set them only when the user asks. Most
  existing tickets have no priority.

## Labels

The team already has these labels: `Improvement`, `Bug`, `Feature`, `Refactor`.

1. Call `mcp__linear-server__list_issue_labels` first.
2. Reuse an existing label when one fits.
3. Create a new label only when nothing fits. Use
   `mcp__linear-server__create_issue_label` and pass `teamId` for a team-scoped
   label.

## Referencing other issues

Write the plain identifier, such as `CSV-17`, in the description. Linear resolves
it and renders it as an inline issue link. Do not write a URL or any markup.

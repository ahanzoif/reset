# RESET — CONTINUATION HANDOFF (SIMPLE RESET, STEP 2)

## Project purpose
RESET is a simple personal-use habit tracker for studying, coding, fitness, healthy routines, recovery, and personal development. It is not intended to be an enterprise or high-end production project.

Tagline: Progress. Discipline. Freedom.

## User workflow and constraints
- The user works locally on Windows and manually uploads project files to AI chatbots.
- Do not request or assume GitHub access.
- Never commit or push anything; the user reviews and manages Git.
- Preserve the prior React/TypeScript snapshot under `previous-project-untouched/reset-step5/`.
- After every meaningful task, return a full updated continuation handoff.

## Snapshot inspected
Working files: `reset-simple/index.html`, `reset-simple/styles.css`, `reset-simple/app.js`, and `reset-simple/README.md`.
Previous snapshot: `previous-project-untouched/reset-step5/` from the supplied Step 5 archive. No Git metadata is included, so live local Git state and GitHub state are unknown.

## Technology
- Plain HTML
- Plain CSS
- Vanilla JavaScript
- Browser localStorage
- No backend, database, authentication, framework, or build step

## Existing features
- Add habits with category and selected weekdays
- Complete/uncomplete today's scheduled habits
- Daily progress percentage and weekly completed check-in count
- Seven-day overview
- Confirmed habit deletion and deletion of associated check-in history
- JSON export
- Responsive light UI with purple accent
- localStorage persistence

## Changes in Step 2
Modified `reset-simple/app.js`:
1. Added a `RECOVERY_KEY` (`reset.simple.v1.recovery-backup`). If loading stored JSON fails or the stored schema is unsupported, the app attempts to copy the original raw value to the recovery key before continuing with an empty in-memory state.
2. Improved the empty state: if the user already has habits but none are scheduled today, it now says “No habits scheduled today” rather than incorrectly implying they have no habits.
3. Updated the empty-state button label based on whether any habits exist.
4. Updated the saved-data warning to explain the local recovery-copy behavior.

Modified `reset-simple/README.md`:
- Documented the recovery key and clarified that recovery copy export is not yet available in the UI.

No other files were intentionally changed. The previous React/TypeScript snapshot was not edited.

## Verification actually performed
- `node --check reset-step6/reset-simple/app.js`: passed after edits.
- HTML source was inspected. Earlier Step 1 had passed Python HTML parsing; no HTML changes were made in Step 2.
- Tried Chromium headless rendering, but the process timed out before producing a DOM dump. Browser UI/interaction verification remains unverified.
- No automated functional test suite was added or run.
- No Git status, commit, push, or live remote verification was performed.

## Known limitations
- Today's scheduled habits can be toggled; historical check-ins cannot be edited from the UI.
- Weekly counts represent completed habit check-ins, not unique habits.
- Data is local to this browser profile/device and may be lost if browser data is cleared. JSON export is available.
- The recovery copy for unreadable/unsupported stored data is saved under `reset.simple.v1.recovery-backup` if storage permits, but the UI does not yet offer a recovery import/export tool. Avoid clearing browser data if this warning appears.
- If browser storage is unavailable, changes cannot be saved.
- Browser visual and interaction testing has not been completed.

## Next recommended task
Perform a manual local browser test pass before adding features:
1. Add a habit scheduled for today and verify it appears.
2. Add a habit scheduled only for a different weekday and verify the empty state says “No habits scheduled today” when appropriate.
3. Toggle today's completion twice and verify progress/counts update and persist after refresh.
4. Delete a habit and verify its check-in history is removed.
5. Export JSON and verify the file contains the current habits and check-ins.
6. Test malformed localStorage data using a disposable browser profile and verify the recovery key is written where storage is available.
7. Test mobile viewport layout and keyboard navigation.

Fix only confirmed bugs. Do not add frameworks, backend, database, authentication, or unnecessary features.

## Mandatory instructions for the next AI
1. Inspect uploaded files and current source before editing.
2. Work only on provided snapshots; no GitHub access.
3. Keep `previous-project-untouched/reset-step5/` untouched unless the user explicitly asks otherwise.
4. Keep the app simple and easy to maintain.
5. Never claim tests or browser checks passed unless actually verified.
6. Never commit or push.
7. At the end of every meaningful task, report summary, exact files changed, implementation details, actual test results, limitations, next task, and a fresh complete continuation handoff.

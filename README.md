# RESET — Simple Daily Habit Tracker

**Live Preview:** [Open RESET](https://reset-omega-neon.vercel.app/)

A small personal-use habit tracker built with plain HTML, CSS, and JavaScript. No framework, backend, database, account, build step, or installation is required.

## Run locally

1. Extract this folder somewhere on your computer.
2. Open `index.html` in a modern browser. If browser storage restrictions interfere, open this folder in VS Code and use the Live Server extension.
3. Add habits, choose the days they repeat, and check them off each day.

## Features

- Add habits with a category and selected weekdays
- Complete/uncomplete today's scheduled habits
- Today's completion percentage and weekly check-in count
- Seven-day overview
- Delete a habit after confirmation
- Export habits and check-in history to JSON
- Responsive light UI and keyboard focus styling
- Data saved in this browser using localStorage

## Data and privacy

Data stays in this browser profile on this device. It does not automatically sync to another browser or device. Clearing browser site data can delete saved habits. Use **Export my data** to save a backup periodically. The app does not upload data to a server.

Storage key: `reset.simple.v1`.

## Current limitations

- No cloud sync or user accounts.
- No historical editing interface; check-ins can be toggled for today only.
- Weekly counts represent completed habit check-ins, not a unique-habit count.
- If browser storage is unavailable, changes cannot be saved. If saved data is malformed or from an unsupported version, RESET attempts to preserve the raw value under `reset.simple.v1.recovery-backup` before continuing with an empty state. This recovery copy is stored locally and is not currently exportable from the UI.
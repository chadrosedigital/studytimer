# Studyspace — complete study timer

A complete React + TypeScript + Tailwind CSS application, built with Vite. Includes the study dashboard, countdown, stopwatch, persistent history, statistics, and the Chad Rose Digital promotional banner.

## Deploy this ZIP to GitHub and Vercel

1. **Extract the ZIP first. Do not upload the ZIP itself to GitHub.**
2. Open the extracted folder. Upload its **contents** into the root of your GitHub repository, replacing the old banner-only files. On GitHub, you should see `package.json`, `pnpm-lock.yaml`, `index.html`, `vercel.json`, and `src` together at the top level. Do not put them inside another nested folder.
3. Commit the changes. Import the repository in Vercel, or redeploy the connected existing project from the new commit.
4. Use these settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Vite |
   | Root directory | Repository root (leave the default) |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Install command | Automatic / default — turn off any previous custom override |
   | Node.js | 24.x |
   | Environment variables | None needed |

`vercel.json` supplies the framework, build command and output directory. Vercel detects pnpm from the included lockfile. The build command can invoke npm scripts with dependencies installed by pnpm.

If you previously deployed the banner-only ZIP, remove any old Root Directory, Install Command, or Output Directory overrides that conflict with the settings above. Redeploy the latest commit and open the URL of that successful production deployment.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel package managers](https://vercel.com/docs/package-managers).

## Run locally

Install Node.js 24, then from this folder:

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. Do not open `index.html` directly from your file browser: the React/TypeScript source must be compiled by Vite.

```sh
pnpm test          # Timer accounting tests
pnpm run build    # TypeScript check and production build
pnpm preview      # Serve the production build locally
```

Browser checks:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

A GitHub Actions workflow runs the build and tests on pushes and pull requests. `node_modules`, local test output, and build artifacts are intentionally excluded from this source repository.

## Features

- Countdown with custom hours/minutes and 25, 45, 60, and 90 minute presets.
- Stopwatch with a clockwise progress ring that completes each hour.
- Start, pause, resume, restart, and finish/save controls.
- Audible countdown completion with mute/unmute; visible completion feedback.
- Automatic completion saving and duplicate-save protection.
- Automatic pause when the browser tab is hidden or the page is left.
- Editable block names, chronological daily sessions, and delete confirmation.
- Daily, weekly, monthly, and all-time study totals.
- Weekly bar chart, monthly activity calendar, selectable past dates, total sessions, and average time per active study day.
- Local-time midnight rollover, with overnight active time split correctly between days.
- Responsive dark dashboard, keyboard access, visible focus, reduced-motion support, locally bundled fonts, and Lucide icons.
- Subtle promotional banner linking to `https://chadrosedigital.co.za` in a new tab with `noopener noreferrer`.

## Storage and timer behavior

Completed sessions are stored in localStorage on this browser and origin. No account, database, API keys, analytics, or paid services are required. Clearing browser data removes history; private browsing may not retain it. Changing the website domain creates a separate storage area. History does not sync between devices. Other tabs on the same origin are updated through storage events.

Active timers deliberately live in memory only. Refreshing or closing the page discards unfinished work; a browser leave warning is requested when possible. Save your block first to retain its time. Paused time and time after the tab becomes hidden do not count. Browsers may suppress audible alarms, so a visual saved message also appears.

The timer derives elapsed time from `performance.now()` rather than interval tick counts. Countdown totals are capped at the target. Active segments are allocated to local dates, including midnight and daylight-saving boundaries. Paused intervals never contribute. Totals are computed from saved sessions instead of maintained as separate counters.

Each saved session has its own storage key and unique ID. If saving fails, the timer remains paused with its elapsed time, and an error explains how to retry. This avoids silently losing a study block. A single block spanning midnight can appear in both days, with only the relevant day's duration displayed in each list.

## Code map

- `src/App.tsx`: app layout and session actions
- `src/hooks/useTimer.ts`: timer lifecycle and browser visibility handling
- `src/lib/time.ts`: timestamp calculations, date grouping, duration formatting
- `src/lib/storage.ts`: validated persistent session storage
- `src/components/History.tsx`: statistics, chart, calendar, and historical blocks
- `src/components/SessionList.tsx`: renaming and deleting study blocks
- `src/components/StudyDashboardBanner.tsx`: promotional copy and destination link
- `src/styles.css`: theme and responsive styles, with Tailwind CSS enabled
- `tests/`: timer unit tests and Playwright browser tests

This ZIP is the full application source, not a component-only package. The local production build and browser tests have been run; publishing to your GitHub repository and a live Vercel deployment are separate steps.

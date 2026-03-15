# Roll Journal

A local-first Brazilian Jiu Jitsu journal and training companion that runs entirely in the browser.

## Features

- Build a personal game profile with belt rank, academy, A-game, and current focus
- Log training sessions with date, session type, duration, intensity, rounds, techniques, what worked, recurring problems, study targets, and solo drill ideas
- Edit and delete session entries
- Track current goals, technique notes, and a study queue for recurring review items
- Generate an off-day home training plan based on your latest journal patterns
- See consistency, streak, mat hours, rounds, and recurring problem trends
- Export and import your journal as JSON
- Store everything locally with `localStorage`
- Works as a simple static app with no build step

## Run it

Open [/Users/aaronballew/Documents/Apps/index.html](/Users/aaronballew/Documents/Apps/index.html) in a browser.

If you want to serve it locally instead:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Next ideas

- Expand the drill library for more position/problem combinations
- Add belt progression and stripe tracking history
- Add partner tracking and comp-specific rounds
- Add video links for techniques and study items
- Add filters for position, training phase, and problem patterns

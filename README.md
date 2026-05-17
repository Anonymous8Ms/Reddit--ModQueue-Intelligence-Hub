# ModQueue Intelligence Hub

ModQueue Intelligence Hub is a Devvit Web moderation dashboard for Reddit mod teams. It helps moderators triage reported content faster, avoid duplicate work, and investigate suspicious accounts without leaving the queue workflow.

## What It Solves

Large mod teams lose time in three places:

- duplicate review when two moderators pick the same item
- manual queue scanning when urgent items are buried
- context switching to inspect user history, account age, and prior moderation history

This app addresses those problems with one queue-first dashboard inside Reddit.

## Core Features

- Active moderator presence so the team can see who is currently in the queue
- Claim and release workflow to prevent collisions
- Priority scoring from `1-5` with labels from `MINIMAL` to `CRITICAL`
- Priority reasoning based on report count, account age, karma, keywords, and moderation signals
- Context view with user account details, recent activity, and mod history
- Pattern alerts for suspicious clusters such as spam waves or coordinated behavior
- Top-10 priority view for faster first-pass triage

## Moderator Workflow

1. Open the dashboard from the moderator menu.
2. Review the highest-priority queue items first.
3. Claim an item before acting on it.
4. Open `View Context` to inspect the account and recent activity.
5. Complete the moderation action in Reddit.
6. Release the claim when finished if needed.

## Stack

- Frontend: React 19, Vite, Tailwind CSS 4
- Backend: Devvit Web server runtime, Hono
- Shared typing: TypeScript
- Storage: Redis via Devvit server context

## Project Structure

- [`/src/client`](/Users/anuttamams/modqueue-hub/src/client): React dashboard UI
- [`/src/server`](/Users/anuttamams/modqueue-hub/src/server): queue ingestion, scoring, presence, claims, context services
- [`/src/shared`](/Users/anuttamams/modqueue-hub/src/shared): shared types and API contracts
- [`/tests`](/Users/anuttamams/modqueue-hub/tests): smoke coverage

## Local Development

Requirements:

- Node.js `22+`
- Devvit CLI access
- Reddit moderator account for playtesting

Commands:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run test
npm run type-check
npm run lint
npm run build
```

## Playtest Setup

This repo is currently configured around the playtest app:

- App name: `modqueue-hub-1`
- Playtest subreddit: `r/modqueue_hub_1_dev`

If you need to rebind the app identity:

```bash
npx devvit init --force
```

## Current Status

Implemented locally:

- dashboard inline + expanded view
- menu entry to open the dashboard
- active moderator tracking UI
- claim / release workflow
- integer priority scoring and legend
- context panel
- pattern alerts
- top-10 queue limiting
- local typecheck, lint, test, and build passing

Still requires live moderator validation:

- native Reddit modqueue items matching dashboard results consistently
- two-moderator claim synchronization
- real-user context accuracy checks
- presence expiry timing validation

See [QA_CHECKLIST.md](/Users/anuttamams/modqueue-hub/QA_CHECKLIST.md) for the live validation steps.

## Target Communities

This app is aimed at high-traffic or coordination-heavy moderator teams such as:

- `r/technology`
- `r/gaming`
- `r/science`

## Expected Impact

- Faster first-pass triage for reported content
- Lower duplicate moderation effort
- Less context switching during investigations
- Better coordination during report spikes or spam waves

## Submission Notes

- Hackathon draft materials: [SUBMISSION.md](/Users/anuttamams/modqueue-hub/SUBMISSION.md)
- Live QA checklist: [QA_CHECKLIST.md](/Users/anuttamams/modqueue-hub/QA_CHECKLIST.md)


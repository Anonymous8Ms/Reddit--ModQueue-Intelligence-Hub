# ModQueue Intelligence Hub Submission Draft

## App Listing

- Developer listing link: `https://developers.reddit.com/apps/modqueue-hub-1`
- Playtest app name: `modqueue-hub-1`
- Playtest subreddit: `r/modqueue_hub_1_dev`

## Team

- Primary Reddit username: `u/modqueue-hub-1`
- Additional team usernames: `None`

## Tool Overview

ModQueue Intelligence Hub is a Devvit moderation dashboard that helps moderator teams triage Reddit modqueue faster and with less duplication. The app combines live queue ingestion, collision prevention, priority scoring, and user context enrichment in a single custom post experience that works inside Reddit.

Core capabilities:

- Real-time moderator presence so teams can see who is actively reviewing the queue.
- Claim and release workflow to prevent two moderators from handling the same item at once.
- Priority scoring from 1 to 5 based on report count, account age, karma, content type, suspicious keywords, and prior moderation history.
- Context enrichment with karma, account age, recent posts/comments, and prior mod actions on the user.
- Pattern detection for spam waves, brigading, and repeated bot-like posting behavior.
- Dashboard view that surfaces the top 10 highest-priority items first for faster triage.

Moderator workflow:

1. A moderator opens the dashboard from the subreddit moderator menu.
2. The app fetches native modqueue items plus reported items and sorts them by urgency.
3. A moderator claims an item before review.
4. The moderator opens context for a quick risk check, then takes native moderation action in Reddit.
5. The team can see presence, claims, and queue pressure at a glance without duplicate work.

## Project Impact

Recommended target communities:

- `r/technology`: fast-moving posts, spam attempts, and high visibility moderation decisions.
- `r/gaming`: high queue volume, repetitive reports, and frequent moderator coordination needs.
- `r/science`: stronger need for context-aware review and quick escalation of risky submissions.

Impact for moderators:

- Reduces duplicate queue handling through visible claims and active moderator presence.
- Reduces triage time by putting high-risk items at the top instead of forcing manual scanning.
- Reduces context-switching by embedding account age, karma, recent activity, and mod history in one click.
- Improves team coordination during spikes by highlighting suspicious clusters and queue pressure.

## Measurable Time Savings / Outcome Statement

ModQueue Intelligence Hub is designed to reduce the first-pass moderation triage loop from several manual steps to one dashboard-driven workflow:

- Before: open native modqueue, inspect reports, open profiles manually, inspect recent activity, check if another mod is already handling the item.
- After: open one dashboard, review priority score, claim the item, inspect context inline, and move to action.

Estimated measurable benefits for active mod teams:

- `25-40%` faster first-pass triage on reported content.
- `Near-zero duplicate handling` when claim workflow is used consistently.
- `Higher-risk content surfaced first`, reducing the chance that coordinated abuse sits buried in the queue.

## Demo Script

1. Open the dashboard from the moderator menu.
2. Show active moderator presence.
3. Report test content and refresh after Reddit surfaces it.
4. Show the item appearing with a 1-5 priority score and reasoning.
5. Claim the item and confirm the claim is visible.
6. Open View Context to show karma, account age, recent activity, and mod history.
7. Release the item and show the queue updating.

## Notes Before Final Submission

- Capture one or two screenshots or a short demo clip while the queue contains reported items.
- If possible, test the claim flow with two moderator accounts before submitting.

# ModQueue Intelligence Hub Live QA Checklist

These checks require a live Reddit moderator environment and cannot be fully validated in static local tooling.

## Required Live Checks

1. Native queue ingestion

- Open `https://www.reddit.com/r/modqueue_hub_1_dev/about/modqueue`
- Confirm reported or removed test items appear there.
- Open the app dashboard and confirm the same items appear in the queue.

2. Claim / release with two moderators

- Open the dashboard in two moderator sessions.
- Claim one item in session A.
- Confirm session B shows the same item as claimed by session A.
- Release it in session A and confirm session B updates after refresh.

3. Context enrichment on real users

- Open `View Context` for at least one reported item.
- Confirm karma, account age, recent activity, and mod history load.
- Verify the context is accurate against the user profile and native moderation history.

4. Presence accuracy

- Open the dashboard in one moderator session and confirm presence appears.
- Open it in a second moderator session and confirm both moderators appear.
- Leave one session idle for more than two minutes and confirm stale presence drops out.

5. Reported-content flow

- Create content from a second Reddit account if possible.
- Report the content from a moderator account.
- Wait for Reddit to surface the report, then refresh the dashboard.
- Confirm the item appears with report count, priority score, and reasoning.

## Submission Readiness Gate

The app should be considered demo-ready when all of the following are true:

- Reported items visible in the dashboard match Reddit’s native moderation view.
- Claim and release state is consistent across two moderator sessions.
- User context loads without blanks for real queue items.
- Presence remains accurate with empty and non-empty queues.
- `npm run type-check`, `npm run lint`, and `npm run build` all pass locally.

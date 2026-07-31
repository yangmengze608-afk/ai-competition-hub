# Activation Beta v0.7

## Product question

The next stage of AI 赛场 is not “can we add more features?” It is:

> Can a student use AI 赛场 to choose one competition and complete a real first action?

## North-star metric

**Weekly activated participants**

A participant is considered activated when the product records this sequence for the same public competition ID:

1. a competition detail page is viewed;
2. a local participation workspace is created;
3. at least one execution action occurs:
   - the first workspace task is completed; or
   - a deadline calendar reminder is downloaded.

This definition measures movement from discovery to execution. Homepage views, favorites, and raw workspace opens are supporting metrics, not activation by themselves.

## Funnel

1. `/home`
2. search, matcher, or focused launch segment
3. `/competition/{public-id}`
4. `workspace_create`
5. `workspace_first_task_complete` or `calendar_download`
6. later return to `/workspace/{public-id}`

## Privacy boundary

Activation analytics may contain only:

- a predefined event name;
- a stable public competition ID;
- a sanitized page category.

They must never contain:

- search text;
- task titles or task counts;
- notes;
- form contents;
- email addresses, phone numbers, usernames, or team information;
- localStorage values;
- calendar file contents.

The tracker remains disabled outside approved production hostnames and respects Global Privacy Control and Do Not Track.

## First user test

Recruit 20–30 university students who are actively looking for AI, data, innovation, or entrepreneurship competitions. Give them one task without product coaching:

> Find one competition you would genuinely consider entering, then take the next action you think is appropriate.

Observe whether they can independently:

- understand the product promise;
- find a relevant competition;
- trust the source and value judgment;
- create a participation workspace;
- complete one execution action.

## Initial decision thresholds

- 60% find at least one relevant competition;
- 50% open a detail page;
- 30% create a workspace;
- 20% complete an activation action;
- 15% return within seven days.

These are learning thresholds, not vanity targets. The next product investment should follow the largest verified funnel loss.

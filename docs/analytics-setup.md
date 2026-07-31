# Privacy-friendly analytics setup

AI 赛场 uses a provider adapter for GoatCounter. The hosted site `aisaichang.goatcounter.com` is active for the production domains `aisaichang.cn` and `www.aisaichang.cn`.

## Why GoatCounter

- no cookies or browser storage in its standard tracker
- aggregate reporting rather than cross-site user profiles
- supports SPA pageviews and custom events
- supports a free hosted service and self-hosting

## Active configuration

```js
window.AI_ANALYTICS_CONFIG = Object.freeze({
  provider: 'goatcounter',
  enabled: true,
  siteCode: 'aisaichang',
  allowedHostnames: ['aisaichang.cn', 'www.aisaichang.cn'],
  respectPrivacySignals: true,
});
```

The public dashboard account must remain email-verified and should never expose its password, recovery links, or API credentials in the repository.

## Recorded page categories

- home
- competition library segments and safe filters
- competition detail by stable public competition ID
- playbook list and detail by stable public playbook ID
- participation workspace list and detail by stable public competition ID
- public information pages

Free-text search queries are never included in analytics paths.

## Recorded conversion events

- `matcher_submit`
- `competition_search`
- `competition_filter`
- `official_link_click`
- `playbook_open`
- `beta_signup_click`
- `competition_submit_click`
- `correction_click`
- `favorite_toggle`
- `load_more`
- `segment_open`
- `workspace_open`
- `workspace_create`
- `workspace_task_complete`
- `workspace_first_task_complete`
- `calendar_download`

Execution events are deliberately narrow:

- `workspace_open` records navigation into an existing local workspace or workspace list.
- `workspace_create` records the click that creates a local participation workspace.
- `workspace_task_complete` records that one checkbox changed to completed.
- `workspace_first_task_complete` records only the first completed-task milestone for that rendered workspace state.
- `calendar_download` records a click on the portable deadline reminder button.

These events do not send whether a user has other workspaces, the number of tasks, task titles, notes, progress percentages, form text, or downloaded calendar contents.

Event context may contain only a stable public competition or playbook ID. Form contents, selected answers, search terms, email addresses, phone numbers, GitHub usernames, full outbound URLs, and localStorage values are not sent.

## Activation funnel

The product-level activation funnel is:

1. competition detail pageview;
2. `workspace_create`;
3. `workspace_first_task_complete` or `calendar_download` for the same public competition ID;
4. a later `/workspace/{public-id}` pageview as a return signal.

The exact metric definition and first user-test protocol are documented in `docs/activation-beta-v0.7.md`.

## Privacy controls

The tracker does not load when:

- analytics is disabled
- the site code is missing or invalid
- the page is not served from an approved production hostname
- Global Privacy Control is enabled
- Do Not Track is enabled

Development and Playwright runs therefore do not send analytics traffic.

## Production verification

After each analytics change:

1. let the full Pages CI pass;
2. deploy to `aisaichang.cn`;
3. open the homepage with privacy signals disabled and without blocking `gc.zgo.at`;
4. confirm `/home` appears in GoatCounter;
5. trigger one predefined conversion event and confirm no free-text, task content, notes, or form payload is present.

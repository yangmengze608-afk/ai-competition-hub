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
- `calendar_download`

`workspace_open` records a click that opens or creates a local participation workspace. `calendar_download` records a click on the portable deadline reminder button. Neither event reads whether a workspace already exists, the user's progress, tasks, notes, or the downloaded calendar contents.

Event context may contain only a stable public competition or playbook ID. Form contents, selected answers, search terms, email addresses, phone numbers, GitHub usernames, full outbound URLs, and localStorage values are not sent.

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
5. trigger one predefined conversion event and confirm no free-text or form payload is present.

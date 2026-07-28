# Privacy-friendly analytics setup

AI 赛场 uses a provider adapter for GoatCounter. The integration is committed but disabled until a real GoatCounter site code is configured.

## Why GoatCounter

- no cookies or browser storage in its standard tracker
- aggregate reporting rather than cross-site user profiles
- supports SPA pageviews and custom events
- supports a free hosted service and self-hosting

## Activation

1. Create a GoatCounter site for `aisaichang.cn`.
2. Choose a site code, for example `aisaichang` if available.
3. Edit `analytics-config.js`:

```js
window.AI_ANALYTICS_CONFIG = Object.freeze({
  provider: 'goatcounter',
  enabled: true,
  siteCode: 'YOUR_SITE_CODE',
  allowedHostnames: ['aisaichang.cn', 'www.aisaichang.cn'],
  respectPrivacySignals: true,
});
```

4. Open a pull request and let the full Pages CI pass.
5. Verify pageviews and custom events in the GoatCounter dashboard.

## Recorded page categories

- home
- competition library segments and safe filters
- competition detail by stable public competition ID
- playbook list and detail by stable public playbook ID
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

Event context may contain only a stable public competition or playbook ID. Form contents, selected answers, search terms, email addresses, phone numbers, GitHub usernames, full outbound URLs, and localStorage values are not sent.

## Privacy controls

The tracker does not load when:

- analytics is disabled
- the site code is missing or invalid
- the page is not served from an approved production hostname
- Global Privacy Control is enabled
- Do Not Track is enabled

Development and Playwright runs therefore do not send analytics traffic.

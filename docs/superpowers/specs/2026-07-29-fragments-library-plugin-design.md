# Fragments Library Plugin — Design

## Summary

Turn the stubbed-out `tools/fragments/` app into a **DA library plugin**: a panel that
runs inside DA's document editor (via the Library sidebar), lets an author browse the
`/fragments` content tree (folders and fragment documents), and, on clicking a fragment,
inserts a link to it into the page they're editing.

## Background

- `tools/fragments/fragments.html` already imports `https://da.live/nx/utils/sdk.js`
  and sets up a `da-lit` importmap pointing at the repo's vendored `deps/lit/dist/index.js`.
  `fragments.js` currently only logs `{ org, repo, path, token }` from `DA_SDK` — no UI yet.
- `scripts/scripts.js` already auto-detects any link whose `href` starts with
  `/fragments/` and decorates it as a **Fragment** block (see `blocks/fragment/fragment.js`).
  So "inserting a fragment" is just inserting a plain `<a href="/fragments/...">` link —
  no special markup is needed.
- `/fragments` in this project's DA content (org `adobedrago`, repo `kp-hw`) currently
  contains a mix of files and folders, confirmed via the DA admin list API:
  ```
  /fragments/404.html            (file)
  /fragments/tabs-example.html   (file)
  /fragments/nav/                (folder)
  /fragments/promos/             (folder)
  ```
  So the plugin must support folder navigation, not just a flat file list.
- This is a **library plugin**, not a fullscreen app — it needs the DA SDK's
  `actions.sendHTML()` / `actions.closeLibrary()`, which fullscreen apps don't get.
  Reference: https://docs.da.live/developers/guides/developing-apps-and-plugins

## Goals

- Author opens the Library panel while editing a DA doc, picks the "Fragments" plugin tab.
- Sees the contents of `/fragments`, can drill into subfolders and back out via breadcrumbs.
- Clicking a fragment document inserts a link to it into the doc being edited and closes
  the panel.
- Works against whatever site the plugin is registered on (org/repo read from SDK
  context, not hardcoded).

## Non-goals

- No search/filter box in this version (drill-down is cheap since each level is fetched
  independently; can be added later if `/fragments` grows large).
- No preview of fragment content before inserting.
- No create/rename/delete of fragments — this is a picker, not a content manager.
- No changes to `blocks/fragment/fragment.js` or the existing auto-detection logic.

## Architecture

```
DA editor (Library panel)
        │  postMessage (DA App SDK)
        ▼
tools/fragments/fragments.html  ──imports──▶ fragments.js
                                                  │
                                    DA_SDK → { context, token, actions }
                                                  │
                                    GET https://admin.da.live/list/{org}/{repo}{currentPath}
                                    Authorization: Bearer {token}
                                                  │
                                    render folder/file list (Lit component)
                                                  │
                              click file → actions.sendHTML(link) + actions.closeLibrary()
                              click folder → currentPath = folder.path, re-fetch
```

### Files touched

- `tools/fragments/fragments.html` — minor edit: keep the existing `da-lit` importmap
  and SDK/script includes; no structural change needed.
- `tools/fragments/fragments.js` — replace the stub body with plugin logic: pull
  `{ context, token, actions }` from `DA_SDK`, mount the picker component, wire its
  "select" event to `actions.sendHTML` + `actions.closeLibrary`.
- `tools/fragments/fragments.css` — extend the existing stub styles (it already has
  `.status-container` for loading/empty/error states) with list/breadcrumb/item styles.
- New: a small Lit component (co-located, e.g. `tools/fragments/fragment-picker.js`)
  encapsulating state (`currentPath`, `items`, `status`) and rendering.

## Data flow / behavior

1. On mount, `currentPath` starts at `/fragments`. Component fetches
   `GET https://admin.da.live/list/{org}/{repo}{currentPath}` with the bearer token.
2. Response items are classified:
   - no `ext` property → **folder**
   - `ext === 'html'` → **fragment** (clickable, inserts a link)
   - anything else → filtered out (not rendered)
3. Items render sorted: folders first, then fragments, each group alphabetical by `name`.
4. A breadcrumb bar reflects `currentPath` relative to `/fragments` (e.g.
   `Fragments / nav`); clicking a breadcrumb segment or a "back" control sets
   `currentPath` accordingly and re-fetches.
5. Clicking a folder row sets `currentPath` to that item's `path` (converted from the
   DA-absolute form `/{org}/{repo}/...` to the site-relative form used for display/state)
   and re-fetches.
6. Clicking a fragment row:
   - derives the site-relative path by stripping the `/{org}/{repo}` prefix and the
     trailing `.html` extension, e.g. `/adobedrago/kp-hw/fragments/nav/main-nav.html`
     → `/fragments/nav/main-nav`
   - calls `actions.sendHTML('<a href="/fragments/nav/main-nav">/fragments/nav/main-nav</a>')`
   - calls `actions.closeLibrary()`
7. Every fetch is issued with an incrementing request token; when a response comes back,
   it's discarded if a newer request has since been issued (guards against out-of-order
   responses when a user navigates quickly).

## States / error handling

- **Loading** — spinner, reusing the existing `.status-container` styles already stubbed
  in `fragments.css`.
- **Empty folder** — "No fragments here" message (empty array is indistinguishable from
  a non-existent path per the DA admin API, so both render this same state).
- **Error** — network failure or non-2xx response (e.g. 401 from an expired token)
  renders an error message with a retry button that re-issues the current fetch.
- All rendered names come from Lit's default text interpolation, which HTML-escapes —
  no `innerHTML` is used for API-provided strings other than the two static template
  characters we build ourselves for `sendHTML`.

## Registration (outside this repo)

Library plugins are enabled via the **library** tab of the site's DA config sheet at
`https://da.live/config#/adobedrago/kp-hw/`, with a row:

| title     | path                                    | icon                  | format |
|-----------|-----------------------------------------|-----------------------|--------|
| Fragments | `<hosted URL of tools/fragments/fragments.html>` | `<hosted URL of a .png icon>` | dialog |

This is a change to shared site configuration. It will be proposed with the exact URLs
to use once the plugin is verified working, and made only with explicit user
confirmation — not done automatically as part of implementation. A PNG icon isn't
currently available in the repo and will need to be supplied or created.

## Testing / verification plan

- Local dev server (`da.live` doc opened with `ref=local`, which iframes
  `localhost:3000`) or a branch preview URL, per the pattern already used by
  `tools/quick-edit`.
- Manually exercise against the real `/fragments` tree already inspected: verify
  `404` and `tabs-example` show at the root, `nav` and `promos` are navigable folders,
  breadcrumb navigation works, clicking a fragment inserts the expected `<a>` link and
  closes the panel, and the loading/empty/error states render correctly (error state can
  be forced by temporarily using a bad token).
- No automated test suite is planned for this tool (consistent with the other `tools/*`
  DA apps in this repo, which are manually verified against the live DA editor).

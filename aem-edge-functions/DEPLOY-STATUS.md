# Scenario 3 (Health Encyclopedia) edge function — deploy status

**Status: PAUSED — blocked on edge-function registration in Cloud Manager.**
Last updated: 2026-06-26.

The `kp-article` Fastly Compute edge function renders Healthwise encyclopedia
articles server-side into the EDS shell. It is **not yet deployed**. Everything
except the final registration + code deploy is done.

## What works / is done
- **Build fix** — `node-html-parser` was imported but missing from
  `package.json`, so the package never built. Added in PR
  [#53](https://github.com/AdobeDrago/kp-hw/pull/53). `aio aem edge-functions build` now succeeds.
- **Sandbox-safe config** (branch `poc/scenario3-sandbox`):
  - `config/edgeFunctions.yaml` — `secrets:` block disabled (sandbox programs
    don't provision the secret store).
  - `src/lib/config.js` — added a build-time `LOCAL_SECRETS` fallback for `HW_KEY`.
  - `src/lib/local-secrets.js` — committed empty; real Healthwise key is set
    locally and never committed (`git update-index --skip-worktree`).
- **Tooling verified**: node 22 + `@adobe/aio-cli` 11.1.2 + plugin
  `@adobe/aio-cli-plugin-aem-edge-functions` 0.11.1 (needs node ≥ 22 for
  `require(ESM)`).
- **Environment binding** (`aio aem edge-functions info`):
  - Program **199056** ("Drago Program", Edge Delivery: Yes) — **SANDBOX**
  - Environment **1240468**, Site domain **kp.pbyb.live**
  - ADC project "AEM Managed CDN Integration" / Production

## What's blocking
The `aio … deploy` only uploads **code** to an **already-registered** function.
Registration of `kp-article` (from `edgeFunctions.yaml`) + the routing rule
(from `cdn.yaml`) must happen via a **Cloud Manager configuration pipeline**.
All paths to do that are currently blocked:
1. **CM UI** — Edge Delivery config-pipeline UI hard to navigate.
2. **CM API via `aio cloudmanager`** — `403 Profile is not valid` (CLI token
   lacks Cloud Manager entitlement, though the UI login has the role).
3. **Direct experimental API** — undocumented/beta; not pursued.

## Known caveats
- **Sandbox secret limit**: program 199056 is a sandbox, so secret/config/kv
  stores aren't provisioned — hence the local `HW_KEY` workaround. For a real
  end-to-end deploy, use a **non-sandbox** environment, re-enable the
  `secrets:` block, and drop the `LOCAL_SECRETS` fallback.
- **Public beta**: AEM Edge Functions is public beta — "not for production
  without prior discussion with your Adobe representative."

## To finish (when unblocked)
1. Merge PR #53 (build fix).
2. Register the function + route via a CM config pipeline for program 199056
   pointed at this repo, branch `poc/scenario3-sandbox`, config path
   `aem-edge-functions/config` (move to repo-root `/config` if the pipeline
   requires it).
3. Set the Healthwise key locally:
   ```
   # src/lib/local-secrets.js
   export const LOCAL_SECRETS = { HW_KEY: '<healthwise-key>' };
   git update-index --skip-worktree src/lib/local-secrets.js
   ```
4. Build + deploy the code:
   ```
   nvm use 22
   cd aem-edge-functions
   aio aem edge-functions list          # confirm kp-article registered
   aio aem edge-functions build
   aio aem edge-functions deploy kp-article
   ```
5. Test (note the required URL shape — region prefix + `/article/`):
   ```
   curl -sI https://kp.pbyb.live/northern-california/health-wellness/health-encyclopedia/article/acn8821
   ```
   The `/article/default` shell already returns 200, so the template is ready.

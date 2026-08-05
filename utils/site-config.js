/*
 * Environment-aware site configuration.
 *
 * Values that differ per environment (API endpoints, etc.) live in the
 * `site-config` sheet in Document Authoring, one tab per environment:
 * `dev`, `qa`, `stage`, `prod`. Each tab is a simple key/value table:
 *
 *   | key            | value                                   |
 *   | -------------- | --------------------------------------- |
 *   | lucidSearchAPI | https://…/api/v1/web/example/kp-api     |
 *
 * The active environment is decided by `getEnv()` in scripts.js (from the
 * hostname) and stored on the shared app config. Here we read that env, fetch
 * only its tab (`/site-config.json?sheet=<env>`), and expose it as a flat map.
 *
 * Note: we import `getConfig` from ak.js (side-effect-free) rather than `getEnv`
 * from scripts.js on purpose — scripts.js runs the page bootstrap on import, and
 * this module is pulled in by blocks/utils that must not trigger that.
 */

// getConfig comes from the federated runtime, resolved from the same-origin /libs.
// eslint-disable-next-line import/no-absolute-path, import/no-unresolved
import { getConfig } from '/libs/scripts/ak.js';

let siteConfigPromise;

/**
 * Fetch the current environment's rows from the `site-config` sheet and return
 * them as a flat `{ key: value }` map. Cached for the page's lifetime; on any
 * failure (sheet missing, offline, test/Storybook) resolves to `{}` so callers
 * fall back to their own defaults.
 * @returns {Promise<Record<string, string>>}
 */
export function getSiteConfig() {
  if (siteConfigPromise) return siteConfigPromise;
  // env is set by scripts.js's getEnv() during loadPage; default to dev if a
  // caller somehow runs before the app config is initialized.
  const env = getConfig().env || 'dev';
  siteConfigPromise = (async () => {
    try {
      const resp = await fetch(`/site-config.json?sheet=${env}`);
      if (!resp.ok) throw new Error(`site-config ${resp.status}`);
      const { data = [] } = await resp.json();
      return Object.fromEntries(data.map((row) => [row.key, row.value]));
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.warn(`[site-config] "${env}" load failed; using defaults:`, ex.message);
      return {};
    }
  })();
  return siteConfigPromise;
}

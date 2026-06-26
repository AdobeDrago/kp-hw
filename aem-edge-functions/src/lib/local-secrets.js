/*
 * Build-time secret fallback for SANDBOX programs only.
 *
 * Sandbox Cloud Manager programs do NOT provision the Fastly secret store, so
 * SecretStoreManager.getSecret() cannot read HW_KEY at runtime. For a sandbox
 * PoC, populate this map locally and it gets bundled into the deployed package.
 *
 * SECURITY: do NOT commit real secret values. Keep this file's committed value
 * an empty object; set the real key locally and mark it skip-worktree:
 *   git update-index --skip-worktree src/lib/local-secrets.js
 * On a non-sandbox environment, leave this empty and use the secret store.
 */
export const LOCAL_SECRETS = {};

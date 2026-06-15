// KP header — the full production header (.kp-header), vendored from
// kp-vessel-3/header-pattern/ (vessel-non-auth-unversioned + vessel-auth-unversioned).
//
// This is the legacy `.kp-header` system (NOT the vessel `.ds-header`): it ships
// its own ~37k-line main.css (vendored here as foundation.css) and is normally
// driven by the vendor main.js. These are STATIC references — rendered with that
// CSS but WITHOUT main.js — so JS-driven bits (search suggestions, region/language
// menus, mega-menus, mobile toggles, sign-in/account flows) are inert. They exist
// as the design source of truth; see STORYBOOK.md for the .ds-header vs .kp-header note.

import { ensurePatternStyles, el } from '../pattern-utils.js';
// eslint-disable-next-line import/no-unresolved, import/extensions
import nonAuthHtml from './header.html?raw';
// eslint-disable-next-line import/no-unresolved, import/extensions
import authHtml from './header-auth.html?raw';

const PATTERN = 'kp-header';

export default {
  title: 'Components/KP Header',
  parameters: { layout: 'fullscreen' },
};

// Logged-out: utility bar, Register / Sign in, primary nav + exposed search.
export const NonAuthenticated = {
  name: 'Non-authenticated',
  render: () => {
    ensurePatternStyles(PATTERN);
    return el(nonAuthHtml);
  },
};

// Logged-in: account/profile menu and the authenticated nav + mega-menus.
export const Authenticated = {
  render: () => {
    ensurePatternStyles(PATTERN);
    return el(authHtml);
  },
};

// EDS-block harness story for blocks/header. The header's init() loads a nav
// fragment (network + ak.js), so it can't run in the table harness. Instead we
// mount the block's shared renderer directly under the EDS cascade (styles.css +
// the sliced blocks/header/header.css) with the same items as the Components/Header
// reference Default — so the visual-parity diff compares the sliced CSS against the
// vessel foundation on identical DOM. Behavior (toggle/dropdown) isn't wired here.

import { loadBlockStyles } from './eds-harness.js';
import { renderHeader } from '../../blocks/header/header-dom.js';

const asset = (p) => `/sb/header/${p}`;

export default {
  title: 'EDS Blocks/Header',
  parameters: { layout: 'fullscreen' },
};

export const Default = {
  render: () => {
    loadBlockStyles('header');
    // Mount inside the .header block root (as init() does), so the slice's
    // `.header .ds-header…` rules apply.
    const root = document.createElement('div');
    root.className = 'header block';
    root.append(renderHeader({
      menuLabel: 'Menu',
      items: [
        { kind: 'link', label: 'Standard Link', href: '#' },
        { kind: 'language', label: 'Language', value: 'English' },
        { kind: 'link', label: 'Large Link', href: '#', large: true },
        { kind: 'link', label: 'Large Link', href: '#', large: true },
      ],
      logos: {
        mobile: asset('assets/images/kp-logo-signature-stacked.svg'),
        desktop: asset('assets/images/kp-logo-374x42.svg'),
      },
      icons: {
        menu: asset('assets/icons/ds2/menu.svg'),
        close: asset('assets/icons/ds2/close-small.svg'),
        chevron: asset('assets/icons/ds2/chevrondown.svg'),
      },
    }));
    return root;
  },
};

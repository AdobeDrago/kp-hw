// Shared renderer for the KP vessel notification. Lives in the block (ships with
// EDS) and is imported by BOTH this block's init() and the Storybook reference
// story (stories/notifications/Notifications.stories.js) so the authored block and
// the design reference render the same .ds-notification DOM and cannot drift.
//
// Pure: takes resolved icon URLs (the caller decides where icons are served) and
// returns a detached .ds-notification element with the vanilla dismiss handler wired.

let uidCounter = 0;
const uid = (prefix = 'ds-notification__heading') => {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
};

export const VARIANT_ALT = {
  informational: 'Informational',
  alert: 'Alert',
  error: 'Error',
  success: 'Success',
};

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/**
 * @param {object} data
 * @param {'informational'|'alert'|'error'|'success'} [data.variant]
 * @param {string} [data.heading]
 * @param {string} [data.body]  plain text or paragraph HTML (may contain a link)
 * @param {boolean} [data.dismissible]
 * @param {boolean} [data.withActions]  Cancel / Retry buttons
 * @param {string} data.iconSrc       resolved URL of the status icon
 * @param {string} [data.closeIconSrc] resolved URL of the close (X) icon
 * @returns {HTMLElement} the .ds-notification element
 */
export function renderNotification({
  variant = 'informational',
  heading = '',
  body = '',
  dismissible = false,
  withActions = false,
  iconSrc = '',
  closeIconSrc = '',
} = {}) {
  const headingId = uid();
  const alt = VARIANT_ALT[variant] ?? VARIANT_ALT.informational;
  // The vessel markup uses __main-icon when a dismiss button is present, __main otherwise.
  const mainClass = dismissible ? 'ds-notification__main-icon' : 'ds-notification__main';
  const bodyHtml = /<p[\s>]/i.test(body) ? body : `<p>${body}</p>`;

  const dismissBtn = dismissible
    ? `<button class="dismiss" data-dismiss="x-close" aria-label="Dismiss" type="button">
         <img src="${closeIconSrc}" alt=""><span>Close</span>
       </button>`
    : '';

  const actions = withActions
    ? `<div class="ds-notification__action-buttons">
         <button class="link" type="button">Cancel</button>
         <span class="divider-vertical-wrap"><i class="divider-vertical"></i></span>
         <button class="link" type="button">Retry</button>
       </div>`
    : '';

  const node = elFromHTML(`
    <section aria-live="assertive"
             class="ds-notification${dismissible ? ' ds-notification--dismiss' : ''}"
             data-ds-version="2" data-ds-theme="vessel" data-ds-variant="${variant}"
             aria-labelledby="${headingId}">
      <div class="ds-notification__icon"><img src="${iconSrc}" alt="${alt}" width="40" height="40"></div>
      ${dismissBtn}
      <div class="${mainClass}">
        <div class="ds-notification__header">
          <div class="ds-notification__heading" id="${headingId}">${heading}</div>
        </div>
        <div class="ds-notification__body">${bodyHtml}${actions}</div>
      </div>
    </section>
  `);

  if (dismissible) {
    const btn = node.querySelector('.dismiss');
    if (btn) btn.addEventListener('click', () => node.remove());
  }
  return node;
}

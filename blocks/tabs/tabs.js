function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

export default async function init(el) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...el.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = el.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      el.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  el.prepend(tablist);

  // Split text content and image into two sibling columns per panel
  el.querySelectorAll('.tabs-panel > div').forEach((row) => {
    const picturePara = [...row.querySelectorAll('p')].reverse().find((p) => p.querySelector('picture'));
    if (!picturePara) return;

    const picture = picturePara.querySelector('picture');
    const allChildren = [...row.children];

    const textCol = document.createElement('div');
    allChildren.forEach((child) => {
      if (child !== picturePara) textCol.append(child);
    });

    const imageCol = document.createElement('div');
    imageCol.classList.add('tabs-image-col');
    imageCol.append(picture);
    picturePara.remove();

    row.append(textCol, imageCol);
  });
}

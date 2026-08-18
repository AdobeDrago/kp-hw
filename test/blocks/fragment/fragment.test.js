import { expect } from '@esm-bundle/chai';
import init from '../../../blocks/fragment/fragment.js';

const FRAGMENT_HTML = `
  <body>
    <main>
      <div>
        <div><p>Hello fragment</p></div>
      </div>
    </main>
  </body>
`;

describe('blocks/fragment/fragment.js', () => {
  let realFetch;

  beforeEach(() => {
    realFetch = window.fetch;
    window.fetch = async () => new Response(FRAGMENT_HTML, { status: 200 });
  });

  afterEach(() => {
    window.fetch = realFetch;
    document.body.innerHTML = '';
  });

  it('replaces the anchor when invoked directly on it (existing auto-block path)', async () => {
    document.body.innerHTML = `
      <div class="section">
        <div class="block-content">
          <p><a class="fragment auto-block" href="/fragments/tabs-example">/fragments/tabs-example</a></p>
        </div>
      </div>
    `;
    const a = document.querySelector('a');

    await init(a);

    expect(document.querySelector('a[href="/fragments/tabs-example"]')).to.equal(null);
    expect(document.body.textContent).to.include('Hello fragment');
  });

  it('replaces the block when invoked on a real Fragment block div', async () => {
    document.body.innerHTML = `
      <div class="section">
        <div class="block-content">
          <div class="fragment">
            <div><div><a href="/fragments/tabs-example">/fragments/tabs-example</a></div></div>
          </div>
        </div>
      </div>
    `;
    const blockEl = document.querySelector('.fragment');

    await init(blockEl);

    expect(document.querySelector('.fragment')).to.equal(null);
    expect(document.body.textContent).to.include('Hello fragment');
  });

  it('does nothing when no anchor can be found inside the block', async () => {
    document.body.innerHTML = '<div class="section"><div class="block-content"><div class="fragment"></div></div></div>';
    const blockEl = document.querySelector('.fragment');

    await init(blockEl);

    expect(document.querySelector('.fragment')).to.not.equal(null);
  });
});

import{e as n,a as r}from"./pattern-utils-DhwZIP84.js";const i="skip-link";function c({label:t="Skip to main content",autoFocus:a=!0}={}){n(i);const o=r(`
    <div>
      <a class="ds-skip-link" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="1" href="#main-content">${t}</a>
      <main id="main-content" style="padding: 2rem 0;">
        <h2>Main content area</h2>
        <p style="max-width: 48rem;">
          The skip link is visually hidden until it receives keyboard focus. Press
          <kbd>Tab</kbd> (with focus in this canvas) to reveal it in the top-left, or use the
          <strong>Focused</strong> story which focuses it automatically.
        </p>
      </main>
    </div>
  `);return a&&requestAnimationFrame(()=>o.querySelector(".ds-skip-link")?.focus()),o}const u={title:"Components/Skip Link",render:t=>c(t),argTypes:{label:{control:"text"},autoFocus:{control:"boolean",description:"Focus the link on render to show its visible state."}},args:{label:"Skip to main content",autoFocus:!0}},e={},s={args:{autoFocus:!1}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    autoFocus: false
  }
}`,...s.parameters?.docs?.source}}};const l=["Focused","HiddenUntilFocus"];export{e as Focused,s as HiddenUntilFocus,l as __namedExportsOrder,u as default};

import{e as p,a as m}from"./pattern-utils-DhwZIP84.js";const k="skip-link";function h({label:t="Skip to main content",autoFocus:l=!0}={}){p(k);const o=m(`
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
  `);return l&&requestAnimationFrame(()=>{var a;return(a=o.querySelector(".ds-skip-link"))==null?void 0:a.focus()}),o}const F={title:"Components/Skip Link",render:t=>h(t),argTypes:{label:{control:"text"},autoFocus:{control:"boolean",description:"Focus the link on render to show its visible state."}},args:{label:"Skip to main content",autoFocus:!0}},e={},s={args:{autoFocus:!1}};var n,r,i;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:"{}",...(i=(r=e.parameters)==null?void 0:r.docs)==null?void 0:i.source}}};var c,d,u;s.parameters={...s.parameters,docs:{...(c=s.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    autoFocus: false
  }
}`,...(u=(d=s.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};const v=["Focused","HiddenUntilFocus"];export{e as Focused,s as HiddenUntilFocus,v as __namedExportsOrder,F as default};

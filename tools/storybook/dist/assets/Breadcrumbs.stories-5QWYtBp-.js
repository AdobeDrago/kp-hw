import{e as d,a as b,b as m}from"./pattern-utils-DhwZIP84.js";const c="breadcrumbs",o=e=>m(c,`assets/images/chevron-${e}-small.svg`);function u(){return`<img aria-hidden="true" class="ds-breadcrumbs__chevron-forward" src="${o("right")}" alt="" height="16" width="16">`}function l(){return`<img aria-hidden="true" class="mobile-only ds-breadcrumbs__chevron-back" src="${o("left")}" alt="" height="16" width="16">`}function h({items:e=[]}={}){d(c);const i=e.map((n,t)=>t===e.length-1?`<li><div>${l()}${n.label}</div></li>`:`<li>
        <a href="${n.href||"#"}">
          ${t>0?l():""}
          <span class="ds-breadcrumbs__text">${n.label}</span>${u()}
        </a>
      </li>`).join("");return b(`
    <nav aria-label="Breadcrumb" class="ds-breadcrumbs" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="4">
      <ul class="ds-breadcrumbs__list">${i}</ul>
    </nav>
  `)}const g={title:"Components/Breadcrumbs",render:e=>h(e),argTypes:{items:{control:"object",description:"Trail items; the last one is the current page."}},args:{items:[{label:"Why KP",href:"#"},{label:"Experience",href:"#"},{label:"My Health Manager"}]}},r={},a={args:{items:[{label:"Home",href:"#"},{label:"Current page"}]}},s={args:{items:[{label:"Why KP",href:"#"},{label:"Experience",href:"#"},{label:"Care",href:"#"},{label:"My Health Manager"}]}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      label: 'Home',
      href: '#'
    }, {
      label: 'Current page'
    }]
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      label: 'Why KP',
      href: '#'
    }, {
      label: 'Experience',
      href: '#'
    }, {
      label: 'Care',
      href: '#'
    }, {
      label: 'My Health Manager'
    }]
  }
}`,...s.parameters?.docs?.source}}};const v=["Default","TwoLevels","DeepTrail"];export{s as DeepTrail,r as Default,a as TwoLevels,v as __namedExportsOrder,g as default};

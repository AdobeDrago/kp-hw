import{e as _,a as $,b as y}from"./pattern-utils-DhwZIP84.js";const f="breadcrumbs",g=e=>y(f,`assets/images/chevron-${e}-small.svg`);function T(){return`<img aria-hidden="true" class="ds-breadcrumbs__chevron-forward" src="${g("right")}" alt="" height="16" width="16">`}function l(){return`<img aria-hidden="true" class="mobile-only ds-breadcrumbs__chevron-back" src="${g("left")}" alt="" height="16" width="16">`}function w({items:e=[]}={}){_(f);const v=e.map((n,t)=>t===e.length-1?`<li><div>${l()}${n.label}</div></li>`:`<li>
        <a href="${n.href||"#"}">
          ${t>0?l():""}
          <span class="ds-breadcrumbs__text">${n.label}</span>${T()}
        </a>
      </li>`).join("");return $(`
    <nav aria-label="Breadcrumb" class="ds-breadcrumbs" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="4">
      <ul class="ds-breadcrumbs__list">${v}</ul>
    </nav>
  `)}const C={title:"Components/Breadcrumbs",render:e=>w(e),argTypes:{items:{control:"object",description:"Trail items; the last one is the current page."}},args:{items:[{label:"Why KP",href:"#"},{label:"Experience",href:"#"},{label:"My Health Manager"}]}},r={},a={args:{items:[{label:"Home",href:"#"},{label:"Current page"}]}},s={args:{items:[{label:"Why KP",href:"#"},{label:"Experience",href:"#"},{label:"Care",href:"#"},{label:"My Health Manager"}]}};var c,o,i;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:"{}",...(i=(o=r.parameters)==null?void 0:o.docs)==null?void 0:i.source}}};var d,b,m;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    items: [{
      label: 'Home',
      href: '#'
    }, {
      label: 'Current page'
    }]
  }
}`,...(m=(b=a.parameters)==null?void 0:b.docs)==null?void 0:m.source}}};var u,h,p;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(p=(h=s.parameters)==null?void 0:h.docs)==null?void 0:p.source}}};const E=["Default","TwoLevels","DeepTrail"];export{s as DeepTrail,r as Default,a as TwoLevels,E as __namedExportsOrder,C as default};

import{e as $,a as S,b as k}from"./pattern-utils-DhwZIP84.js";const x="content-toggle",i=e=>k(x,`assets/images/icon-${e}.svg`);function E({variant:e="basic",heading:b="Why use a Content Toggle?",expanded:n=!1,body:T=`<p>There are several advantages of using <a href="#">a Content Toggle</a> on long, content-rich pages:</p>
    <ul>
      <li>Collapsing the page minimizes scrolling.</li>
      <li>The headings serve as a mini-IA of the page.</li>
      <li>Hiding some of the content can make the page appear less daunting.</li>
    </ul>`}={}){$(x);const t=S(`
    <div class="ds-contenttoggle" data-analytics-location="Content Toggle"
         data-ds-theme="vessel" data-ds-variant="${e}" data-ds-version="2">
      <button class="ds-contenttoggle__expandable-heading" aria-expanded="${n}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__plus-icon${n?" ds-contenttoggle__remove-icon":""}"
             alt="" height="24" width="24" src="${i("plus")}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__minus-icon${n?"":" ds-contenttoggle__remove-icon"}"
             alt="" height="24" width="24" src="${i("minus")}">
        <span class="-medium ds-contenttoggle__expandable-heading-text">${b}</span>
      </button>
      <div class="ds-contenttoggle__content${n?" show":""}">${T}</div>
    </div>
  `),c=t.querySelector(".ds-contenttoggle__expandable-heading"),f=t.querySelector(".ds-contenttoggle__content"),C=t.querySelector(".ds-contenttoggle__plus-icon"),y=t.querySelector(".ds-contenttoggle__minus-icon");return c.addEventListener("click",()=>{const a=c.getAttribute("aria-expanded")==="true";c.setAttribute("aria-expanded",String(!a)),f.classList.toggle("show",!a),C.classList.toggle("ds-contenttoggle__remove-icon",!a),y.classList.toggle("ds-contenttoggle__remove-icon",a)}),t}const w={title:"Components/Content Toggle",render:e=>E(e),argTypes:{variant:{control:{type:"inline-radio"},options:["basic","dark"]},heading:{control:"text"},expanded:{control:"boolean",description:"Initial state."}},args:{variant:"basic",heading:"Why use a Content Toggle?",expanded:!1}},s={args:{expanded:!1}},o={args:{expanded:!0}},r={args:{variant:"dark",expanded:!0}};var g,l,d;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    expanded: false
  }
}`,...(d=(l=s.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};var p,u,m;o.parameters={...o.parameters,docs:{...(p=o.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    expanded: true
  }
}`,...(m=(u=o.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var _,h,v;r.parameters={...r.parameters,docs:{...(_=r.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    variant: 'dark',
    expanded: true
  }
}`,...(v=(h=r.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};const A=["Collapsed","Expanded","Dark"];export{s as Collapsed,r as Dark,o as Expanded,A as __namedExportsOrder,w as default};

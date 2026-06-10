import{e as _,a as h,b as v}from"./pattern-utils-DhwZIP84.js";const g="content-toggle",i=e=>v(g,`assets/images/icon-${e}.svg`);function x({variant:e="basic",heading:l="Why use a Content Toggle?",expanded:n=!1,body:d=`<p>There are several advantages of using <a href="#">a Content Toggle</a> on long, content-rich pages:</p>
    <ul>
      <li>Collapsing the page minimizes scrolling.</li>
      <li>The headings serve as a mini-IA of the page.</li>
      <li>Hiding some of the content can make the page appear less daunting.</li>
    </ul>`}={}){_(g);const t=h(`
    <div class="ds-contenttoggle" data-analytics-location="Content Toggle"
         data-ds-theme="vessel" data-ds-variant="${e}" data-ds-version="2">
      <button class="ds-contenttoggle__expandable-heading" aria-expanded="${n}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__plus-icon${n?" ds-contenttoggle__remove-icon":""}"
             alt="" height="24" width="24" src="${i("plus")}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__minus-icon${n?"":" ds-contenttoggle__remove-icon"}"
             alt="" height="24" width="24" src="${i("minus")}">
        <span class="-medium ds-contenttoggle__expandable-heading-text">${l}</span>
      </button>
      <div class="ds-contenttoggle__content${n?" show":""}">${d}</div>
    </div>
  `),c=t.querySelector(".ds-contenttoggle__expandable-heading"),p=t.querySelector(".ds-contenttoggle__content"),u=t.querySelector(".ds-contenttoggle__plus-icon"),m=t.querySelector(".ds-contenttoggle__minus-icon");return c.addEventListener("click",()=>{const a=c.getAttribute("aria-expanded")==="true";c.setAttribute("aria-expanded",String(!a)),p.classList.toggle("show",!a),u.classList.toggle("ds-contenttoggle__remove-icon",!a),m.classList.toggle("ds-contenttoggle__remove-icon",a)}),t}const T={title:"Components/Content Toggle",render:e=>x(e),argTypes:{variant:{control:{type:"inline-radio"},options:["basic","dark"]},heading:{control:"text"},expanded:{control:"boolean",description:"Initial state."}},args:{variant:"basic",heading:"Why use a Content Toggle?",expanded:!1}},s={args:{expanded:!1}},o={args:{expanded:!0}},r={args:{variant:"dark",expanded:!0}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    expanded: false
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    expanded: true
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'dark',
    expanded: true
  }
}`,...r.parameters?.docs?.source}}};const f=["Collapsed","Expanded","Dark"];export{s as Collapsed,r as Dark,o as Expanded,f as __namedExportsOrder,T as default};

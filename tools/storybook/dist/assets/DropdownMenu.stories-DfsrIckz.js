import{e as x,a as y,b as $,u as E}from"./pattern-utils-DhwZIP84.js";const m="dropdown-menu",p=s=>$(m,`assets/images/${s}`),L={default:"",dark:"ds-dropdown--dark","high-contrast":"ds-dropdown--high-contrast","dark-high-contrast":"ds-dropdown--dark-high-contrast"};function T({options:s=["Viewing pages","My account","Settings","Sign out"],selectedIndex:g=0,theme:h="default",small:w=!1,label:b="Viewing pages",showLabel:_=!0,showTriggerIcon:S=!0}={}){x(m);const f=["ds-dropdown",L[h],w?"ds-dropdown--small":""].filter(Boolean).join(" "),u=E("dd-trigger"),k=s.map((e,o)=>`
      <li class="drop-menu-list-op${o===g?" active":""}" role="option" tabindex="-1" data-index="${o}">
        <span class="drop-menu-list-text">${e}</span>
        <img class="checkmark-img" src="${p("checkmark-black.svg")}" alt="" width="24" height="24">
      </li>`).join(""),t=y(`
    <div class="${f}" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-menu-type="standard">
      <div class="ds-dropdown__drop-menu">
        ${_?`<label class="ds-dropdown__label"><span class="ds-dropdown__label-text">${b}</span></label>`:""}
        <button class="ds-dropdown__trigger-button" id="${u}" aria-haspopup="listbox" aria-expanded="false">
          ${S?`<img class="ds-dropdown__img" src="${p("people.svg")}" alt="" width="24" height="24">`:""}
          <span class="ds-dropdown__trigger-text">${s[g]??"Select"}</span>
          <img class="ds-dropdown__chevron" src="${p("chevrondown.svg")}" alt="" width="24" height="24">
        </button>
        <ul class="ds-dropdown__menu-list" role="listbox" aria-labelledby="${u}">${k}</ul>
      </div>
    </div>
  `),a=t.querySelector(".ds-dropdown__trigger-button"),v=t.querySelector(".ds-dropdown__trigger-text"),i=t.querySelector(".ds-dropdown__menu-list"),r=e=>{a.setAttribute("aria-expanded",String(e)),t.classList.toggle("-expanded",e),i.style.display=e?"":"none"};return r(!1),a.addEventListener("click",()=>r(a.getAttribute("aria-expanded")!=="true")),i.querySelectorAll(".drop-menu-list-op").forEach(e=>{e.addEventListener("click",()=>{i.querySelectorAll(".drop-menu-list-op").forEach(o=>o.classList.remove("active")),e.classList.add("active"),v.textContent=e.querySelector(".drop-menu-list-text").textContent,r(!1),a.focus()})}),t.addEventListener("keydown",e=>{e.key==="Escape"&&r(!1)}),document.addEventListener("click",e=>{t.contains(e.target)||r(!1)}),t}const A={title:"Components/Dropdown Menu",render:s=>T(s),argTypes:{options:{control:"object"},selectedIndex:{control:{type:"number",min:0}},theme:{control:{type:"select"},options:["default","dark","high-contrast","dark-high-contrast"]},small:{control:"boolean"},label:{control:"text"},showLabel:{control:"boolean"},showTriggerIcon:{control:"boolean"}},args:{options:["Viewing pages","My account","Settings","Sign out"],selectedIndex:0,theme:"default",small:!1,label:"Viewing pages",showLabel:!0,showTriggerIcon:!0}},n={},d={args:{small:!0}},l={args:{theme:"dark"}},c={args:{theme:"high-contrast"}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:"{}",...n.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    small: true
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'dark'
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'high-contrast'
  }
}`,...c.parameters?.docs?.source}}};const C=["Standard","Small","Dark","HighContrast"];export{l as Dark,c as HighContrast,d as Small,n as Standard,C as __namedExportsOrder,A as default};

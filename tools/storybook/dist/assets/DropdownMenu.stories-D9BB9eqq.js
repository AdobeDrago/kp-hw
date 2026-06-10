import{e as V,a as j,b as H,u as O}from"./pattern-utils-DhwZIP84.js";const E="dropdown-menu",p=s=>H(E,`assets/images/${s}`),P={default:"",dark:"ds-dropdown--dark","high-contrast":"ds-dropdown--high-contrast","dark-high-contrast":"ds-dropdown--dark-high-contrast"};function B({options:s=["Viewing pages","My account","Settings","Sign out"],selectedIndex:g=0,theme:L="default",small:T=!1,label:q="Viewing pages",showLabel:A=!0,showTriggerIcon:C=!0}={}){V(E);const D=["ds-dropdown",P[L],T?"ds-dropdown--small":""].filter(Boolean).join(" "),u=O("dd-trigger"),M=s.map((e,o)=>`
      <li class="drop-menu-list-op${o===g?" active":""}" role="option" tabindex="-1" data-index="${o}">
        <span class="drop-menu-list-text">${e}</span>
        <img class="checkmark-img" src="${p("checkmark-black.svg")}" alt="" width="24" height="24">
      </li>`).join(""),t=j(`
    <div class="${D}" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-menu-type="standard">
      <div class="ds-dropdown__drop-menu">
        ${A?`<label class="ds-dropdown__label"><span class="ds-dropdown__label-text">${q}</span></label>`:""}
        <button class="ds-dropdown__trigger-button" id="${u}" aria-haspopup="listbox" aria-expanded="false">
          ${C?`<img class="ds-dropdown__img" src="${p("people.svg")}" alt="" width="24" height="24">`:""}
          <span class="ds-dropdown__trigger-text">${s[g]??"Select"}</span>
          <img class="ds-dropdown__chevron" src="${p("chevrondown.svg")}" alt="" width="24" height="24">
        </button>
        <ul class="ds-dropdown__menu-list" role="listbox" aria-labelledby="${u}">${M}</ul>
      </div>
    </div>
  `),a=t.querySelector(".ds-dropdown__trigger-button"),I=t.querySelector(".ds-dropdown__trigger-text"),i=t.querySelector(".ds-dropdown__menu-list"),r=e=>{a.setAttribute("aria-expanded",String(e)),t.classList.toggle("-expanded",e),i.style.display=e?"":"none"};return r(!1),a.addEventListener("click",()=>r(a.getAttribute("aria-expanded")!=="true")),i.querySelectorAll(".drop-menu-list-op").forEach(e=>{e.addEventListener("click",()=>{i.querySelectorAll(".drop-menu-list-op").forEach(o=>o.classList.remove("active")),e.classList.add("active"),I.textContent=e.querySelector(".drop-menu-list-text").textContent,r(!1),a.focus()})}),t.addEventListener("keydown",e=>{e.key==="Escape"&&r(!1)}),document.addEventListener("click",e=>{t.contains(e.target)||r(!1)}),t}const R={title:"Components/Dropdown Menu",render:s=>B(s),argTypes:{options:{control:"object"},selectedIndex:{control:{type:"number",min:0}},theme:{control:{type:"select"},options:["default","dark","high-contrast","dark-high-contrast"]},small:{control:"boolean"},label:{control:"text"},showLabel:{control:"boolean"},showTriggerIcon:{control:"boolean"}},args:{options:["Viewing pages","My account","Settings","Sign out"],selectedIndex:0,theme:"default",small:!1,label:"Viewing pages",showLabel:!0,showTriggerIcon:!0}},n={},d={args:{small:!0}},l={args:{theme:"dark"}},c={args:{theme:"high-contrast"}};var m,h,w;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:"{}",...(w=(h=n.parameters)==null?void 0:h.docs)==null?void 0:w.source}}};var b,_,S;d.parameters={...d.parameters,docs:{...(b=d.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    small: true
  }
}`,...(S=(_=d.parameters)==null?void 0:_.docs)==null?void 0:S.source}}};var f,k,v;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    theme: 'dark'
  }
}`,...(v=(k=l.parameters)==null?void 0:k.docs)==null?void 0:v.source}}};var x,y,$;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    theme: 'high-contrast'
  }
}`,...($=(y=c.parameters)==null?void 0:y.docs)==null?void 0:$.source}}};const U=["Standard","Small","Dark","HighContrast"];export{l as Dark,c as HighContrast,d as Small,n as Standard,U as __namedExportsOrder,R as default};

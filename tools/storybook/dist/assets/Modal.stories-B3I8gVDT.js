import{e as k,a as q,u as m,b as A}from"./pattern-utils-DhwZIP84.js";const x="modal",u=t=>A(x,`assets/images/${t}`);function F({variant:t="windowed",title:$="Modal Windowed Example",body:E="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.",withIcon:L=!0,primaryLabel:S="No",secondaryLabel:I="Yes"}={}){k(x);const d=m("ds-modal"),l=m("ds-modal-header"),r=q(`
    <div>
      <button class="button -primary -light" data-modal-trigger="${d}" title="Opens a dialog" type="button">
        Open ${t} modal
      </button>

      <div aria-hidden="true" data-ds-theme="vessel" data-ds-variant="${t}" data-ds-version="2"
           class="ds-modal ds-grid__container ds-modal--columns-4" id="${d}">
        <div class="ds-modal__fade-screen"></div>
        <div class="ds-modal__container rows">
          <div class="ds-modal__inner ds-modal__icons-enabled" role="dialog" aria-modal="true" aria-labelledby="${l}">
            <div class="ds-modal__header">
              <h2 class="ds-modal__title" tabindex="-1" id="${l}">${$}</h2>
              <button class="-close--small" aria-label="Close" data-dismiss="x-close" type="button">
                <img alt="" src="${u("icon-close.svg")}" width="20" height="20">
              </button>
            </div>
            <div class="ds-modal__content">
              <div class="ds-modal__content-body">
                ${L?`<div class="ds-modal__icon"><img alt="alert" src="${u("alert-p1.svg")}" aria-hidden="true" width="48" height="48"></div>`:""}
                <div class="ds-modal__content-inner"><p>${E}</p></div>
              </div>
              <div class="ds-modal__actions">
                <div class="ds-modal__buttons -right">
                  <button class="button -inverted" type="button" data-dismiss="x-close">${I}</button>
                  <button class="button -primary -light modal__cancel-btn" type="button" data-dismiss="x-close">${S}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `),c=r.querySelector("[data-modal-trigger]"),e=r.querySelector(`#${d}`),M=e.querySelector(".ds-modal__title"),W=()=>{e.classList.add("ds-modal--showing"),e.setAttribute("aria-hidden","false"),M.focus()},i=()=>{e.classList.remove("ds-modal--showing"),e.setAttribute("aria-hidden","true"),c.focus()};return c.addEventListener("click",W),e.querySelectorAll('[data-dismiss="x-close"]').forEach(n=>n.addEventListener("click",i)),e.querySelector(".ds-modal__fade-screen").addEventListener("click",i),e.addEventListener("keydown",n=>{n.key==="Escape"&&i()}),r}const O={title:"Components/Modal",render:t=>F(t),argTypes:{variant:{control:{type:"inline-radio"},options:["windowed","fullscreen"]},title:{control:"text"},body:{control:"text"},withIcon:{control:"boolean"},primaryLabel:{control:"text"},secondaryLabel:{control:"text"}},args:{variant:"windowed",title:"Modal Windowed Example",body:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.",withIcon:!0,primaryLabel:"No",secondaryLabel:"Yes"}},a={args:{variant:"windowed"}},s={args:{variant:"fullscreen",title:"Modal Fullscreen Example"}},o={args:{variant:"windowed",withIcon:!1}};var p,v,b;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    variant: 'windowed'
  }
}`,...(b=(v=a.parameters)==null?void 0:v.docs)==null?void 0:b.source}}};var g,_,h;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'fullscreen',
    title: 'Modal Fullscreen Example'
  }
}`,...(h=(_=s.parameters)==null?void 0:_.docs)==null?void 0:h.source}}};var w,y,f;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    variant: 'windowed',
    withIcon: false
  }
}`,...(f=(y=o.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};const T=["Windowed","Fullscreen","WithoutIcon"];export{s as Fullscreen,a as Windowed,o as WithoutIcon,T as __namedExportsOrder,O as default};

import{e as f,a as x,u as m,b as $}from"./pattern-utils-DhwZIP84.js";const p="modal",u=t=>$(p,`assets/images/${t}`);function E({variant:t="windowed",title:v="Modal Windowed Example",body:b="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.",withIcon:g=!0,primaryLabel:_="No",secondaryLabel:h="Yes"}={}){f(p);const d=m("ds-modal"),l=m("ds-modal-header"),r=x(`
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
              <h2 class="ds-modal__title" tabindex="-1" id="${l}">${v}</h2>
              <button class="-close--small" aria-label="Close" data-dismiss="x-close" type="button">
                <img alt="" src="${u("icon-close.svg")}" width="20" height="20">
              </button>
            </div>
            <div class="ds-modal__content">
              <div class="ds-modal__content-body">
                ${g?`<div class="ds-modal__icon"><img alt="alert" src="${u("alert-p1.svg")}" aria-hidden="true" width="48" height="48"></div>`:""}
                <div class="ds-modal__content-inner"><p>${b}</p></div>
              </div>
              <div class="ds-modal__actions">
                <div class="ds-modal__buttons -right">
                  <button class="button -inverted" type="button" data-dismiss="x-close">${h}</button>
                  <button class="button -primary -light modal__cancel-btn" type="button" data-dismiss="x-close">${_}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `),c=r.querySelector("[data-modal-trigger]"),e=r.querySelector(`#${d}`),w=e.querySelector(".ds-modal__title"),y=()=>{e.classList.add("ds-modal--showing"),e.setAttribute("aria-hidden","false"),w.focus()},i=()=>{e.classList.remove("ds-modal--showing"),e.setAttribute("aria-hidden","true"),c.focus()};return c.addEventListener("click",y),e.querySelectorAll('[data-dismiss="x-close"]').forEach(n=>n.addEventListener("click",i)),e.querySelector(".ds-modal__fade-screen").addEventListener("click",i),e.addEventListener("keydown",n=>{n.key==="Escape"&&i()}),r}const S={title:"Components/Modal",render:t=>E(t),argTypes:{variant:{control:{type:"inline-radio"},options:["windowed","fullscreen"]},title:{control:"text"},body:{control:"text"},withIcon:{control:"boolean"},primaryLabel:{control:"text"},secondaryLabel:{control:"text"}},args:{variant:"windowed",title:"Modal Windowed Example",body:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.",withIcon:!0,primaryLabel:"No",secondaryLabel:"Yes"}},a={args:{variant:"windowed"}},s={args:{variant:"fullscreen",title:"Modal Fullscreen Example"}},o={args:{variant:"windowed",withIcon:!1}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'windowed'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'fullscreen',
    title: 'Modal Fullscreen Example'
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'windowed',
    withIcon: false
  }
}`,...o.parameters?.docs?.source}}};const I=["Windowed","Fullscreen","WithoutIcon"];export{s as Fullscreen,a as Windowed,o as WithoutIcon,I as __namedExportsOrder,S as default};

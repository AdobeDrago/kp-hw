import{e as C,a as g,u as _}from"./pattern-utils-DhwZIP84.js";const b="card-group";function y(){const s=_("cg-card");return`
    <div class="ds-card" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="3" role="group" aria-labelledby="${s}">
      <div class="ds-card__content">
        <div class="ds-card__title" id="${s}">Card Title</div>
        <div class="ds-card__summary">
          <p>Cards are used to summarize content on a single topic and should be easy to scan.</p>
        </div>
        <div class="ds-card__button-container">
          <div class="ds-card__cta"><button class="button -action -light -small" type="button">Action</button></div>
        </div>
      </div>
    </div>`}function T({numCols:s=3,count:p=3}={}){C(b);const v=Array.from({length:p},()=>y()).join("");return g(`
    <div class="ds-card-group" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-ds-num-cols="${s}">
      ${v}
    </div>
  `)}const f={title:"Components/Card Group",render:s=>T(s),argTypes:{numCols:{control:{type:"inline-radio"},options:[2,3,4],description:"Desktop column count."},count:{control:{type:"number",min:1,max:8}}},args:{numCols:3,count:3}},r={args:{numCols:3,count:3}},a={args:{numCols:2,count:4}},o={args:{numCols:4,count:4}};var n,t,e;r.parameters={...r.parameters,docs:{...(n=r.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    numCols: 3,
    count: 3
  }
}`,...(e=(t=r.parameters)==null?void 0:t.docs)==null?void 0:e.source}}};var d,c,u;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    numCols: 2,
    count: 4
  }
}`,...(u=(c=a.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var i,l,m;o.parameters={...o.parameters,docs:{...(i=o.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    numCols: 4,
    count: 4
  }
}`,...(m=(l=o.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};const S=["ThreeColumns","TwoColumns","FourColumns"];export{o as FourColumns,r as ThreeColumns,a as TwoColumns,S as __namedExportsOrder,f as default};

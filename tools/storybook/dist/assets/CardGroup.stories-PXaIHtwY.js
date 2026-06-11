import{e,a as d,u as c}from"./pattern-utils-DhwZIP84.js";const u="card-group";function i(){const s=c("cg-card");return`
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
    </div>`}function l({numCols:s=3,count:n=3}={}){e(u);const t=Array.from({length:n},()=>i()).join("");return d(`
    <div class="ds-card-group" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-ds-num-cols="${s}">
      ${t}
    </div>
  `)}const p={title:"Components/Card Group",render:s=>l(s),argTypes:{numCols:{control:{type:"inline-radio"},options:[2,3,4],description:"Desktop column count."},count:{control:{type:"number",min:1,max:8}}},args:{numCols:3,count:3}},r={args:{numCols:3,count:3}},a={args:{numCols:2,count:4}},o={args:{numCols:4,count:4}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    numCols: 3,
    count: 3
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    numCols: 2,
    count: 4
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    numCols: 4,
    count: 4
  }
}`,...o.parameters?.docs?.source}}};const v=["ThreeColumns","TwoColumns","FourColumns"];export{o as FourColumns,r as ThreeColumns,a as TwoColumns,v as __namedExportsOrder,p as default};

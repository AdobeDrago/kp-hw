import{e as d}from"./eds-harness-DKf85bQ0.js";import"./preload-helper-Ct5FWWRu.js";const m="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",e=({variants:t=[],heading:i,body:c=m})=>d({name:"notification",variants:t,section:!1,rows:[[`<h3>${i}</h3>
<p>${c}</p>`]]}),u={title:"EDS Blocks/Notification"},r={render:()=>e({heading:"Notification example with a link"})},s={render:()=>e({variants:["alert"],heading:"Something needs your attention"})},n={render:()=>e({variants:["error"],heading:"Something went wrong"})},a={render:()=>e({variants:["success"],heading:"You’re all set"})},o={render:()=>e({variants:["dismissible"],heading:"Dismissible notification"})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => note({
    heading: 'Notification example with a link'
  })
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => note({
    variants: ['alert'],
    heading: 'Something needs your attention'
  })
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => note({
    variants: ['error'],
    heading: 'Something went wrong'
  })
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => note({
    variants: ['success'],
    heading: 'You’re all set'
  })
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => note({
    variants: ['dismissible'],
    heading: 'Dismissible notification'
  })
}`,...o.parameters?.docs?.source}}};const g=["Informational","Alert","Error","Success","Dismissible"];export{s as Alert,o as Dismissible,n as Error,r as Informational,a as Success,g as __namedExportsOrder,u as default};

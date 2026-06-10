import{e as s,p as d}from"./eds-harness-DKf85bQ0.js";import"./preload-helper-Ct5FWWRu.js";const l=r=>`/sb/card/assets/images/${r}`,u="Cards are used to summarize content on a single topic and should be easy to scan for actionable information.",c=({title:r,summary:o=u,ctaLabel:e,primary:m=!1}={})=>{const p=e?`<p>${m?`<strong><a href="#">${e}</a></strong>`:`<a href="#">${e}</a>`}</p>`:"";return`<h3>${r}</h3>
<p>${o}</p>
${p}`},i=r=>o=>{const e=document.createElement("div");return e.style.maxWidth=`${r}px`,e.append(o()),e},b={title:"EDS Blocks/Card"},a={decorators:[i(320)],render:()=>s({name:"card",rows:[[c({title:"Card Title",ctaLabel:"Action"})]]})},t={decorators:[i(320)],render:()=>s({name:"card",variants:["large"],rows:[[d(l("cardimage.png"),{alt:""})],[c({title:"Title",ctaLabel:"Primary CTA",primary:!0})]]})},n={decorators:[i(320)],render:()=>s({name:"card",variants:["thumbnail"],rows:[[d(l("Clinician.png"),{alt:""})],[c({title:"Title",ctaLabel:"Action"})]]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    rows: [[content({
      title: 'Card Title',
      ctaLabel: 'Action'
    })]]
  })
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    variants: ['large'],
    rows: [[picture(IMG('cardimage.png'), {
      alt: ''
    })], [content({
      title: 'Title',
      ctaLabel: 'Primary CTA',
      primary: true
    })]]
  })
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    variants: ['thumbnail'],
    rows: [[picture(IMG('Clinician.png'), {
      alt: ''
    })], [content({
      title: 'Title',
      ctaLabel: 'Action'
    })]]
  })
}`,...n.parameters?.docs?.source}}};const B=["Basic","Large","Thumbnail"];export{a as Basic,t as Large,n as Thumbnail,B as __namedExportsOrder,b as default};

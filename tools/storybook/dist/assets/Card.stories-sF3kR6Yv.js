import{e as x,a as C,b as w,u as T}from"./pattern-utils-DhwZIP84.js";const b="card",c=a=>w(b,`assets/images/${a}`),u={large:"cardimage.png",thumbnail:"Clinician.png",video:"quarantine-fatigue.png"};function A({variant:a="basic",eyebrow:t="",title:p="Card Title",subtitle:d="",summary:g="Cards are used to summarize content on a single topic and should be easy to scan for actionable information.",ctaLabel:l="Action",ctaVariant:v="action"}={}){x(b);const m=T("card-title"),y=a==="video"?"1":"3";let n="";if(a==="large"||a==="thumbnail"){const $=a==="thumbnail"?'width="44" height="44"':'width="277" height="156"';n=`<div class="ds-card__image"><img src="${c(u[a])}" alt="" ${$}></div>`}else a==="video"&&(n=`<div class="ds-card__image">
        <img src="${c(u.video)}" alt="" height="156" width="277">
        <img class="ds-card__video-play-button" src="${c("play-button.svg")}" alt="" width="75" height="75">
        <div class="ds-card__time-lozenge"></div>
      </div>`);const h=l?`<div class="ds-card__button-container">
         <div class="ds-card__cta">
           <button class="button -${v} -light -small" type="button">${l}</button>
         </div>
       </div>`:"",_=`
    <div class="ds-card__content" role="group" aria-labelledby="${m}">
      ${t?`<div class="ds-card__eyebrow p4 -medium">${t}</div>`:""}
      <div class="ds-card__title" id="${m}">${p}</div>
      ${d?`<div class="ds-card__subtitle">${d}</div>`:""}
      ${a==="thumbnail"?"":`<div class="ds-card__summary"><p>${g}</p></div>`}
      ${h}
    </div>`;return C(`
    <div class="ds-card${a==="video"?" ds-card__option--vertical":""}" data-ds-theme="vessel" data-ds-variant="${a}" data-ds-version="${y}">
      ${n}
      ${_}
    </div>
  `)}const V={title:"Components/Card",render:a=>A(a),decorators:[a=>{const t=document.createElement("div");return t.style.maxWidth="320px",t.appendChild(a()),t}],argTypes:{variant:{control:{type:"select"},options:["basic","large","thumbnail","video"]},ctaVariant:{control:{type:"inline-radio"},options:["action","primary"]},eyebrow:{control:"text"},title:{control:"text"},subtitle:{control:"text"},summary:{control:"text"},ctaLabel:{control:"text"}},args:{variant:"basic",eyebrow:"",title:"Card Title",subtitle:"",summary:"Cards are used to summarize content on a single topic and should be easy to scan for actionable information.",ctaLabel:"Action",ctaVariant:"action"}},e={args:{variant:"basic"}},r={args:{variant:"basic",eyebrow:"Eyebrow",subtitle:"subtitle",ctaLabel:"Primary CTA",ctaVariant:"primary"}},s={args:{variant:"large",title:"Title",ctaLabel:"Primary CTA",ctaVariant:"primary"}},i={args:{variant:"thumbnail",title:"Title"},decorators:[a=>{const t=document.createElement("div");return t.style.maxWidth="420px",t.appendChild(a()),t}]},o={args:{variant:"video",eyebrow:"Video",title:"Watch: managing your care",summary:"A short overview video."}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'basic'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'basic',
    eyebrow: 'Eyebrow',
    subtitle: 'subtitle',
    ctaLabel: 'Primary CTA',
    ctaVariant: 'primary'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'large',
    title: 'Title',
    ctaLabel: 'Primary CTA',
    ctaVariant: 'primary'
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'thumbnail',
    title: 'Title'
  },
  decorators: [story => {
    const box = document.createElement('div');
    box.style.maxWidth = '420px';
    box.appendChild(story());
    return box;
  }]
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'video',
    eyebrow: 'Video',
    title: 'Watch: managing your care',
    summary: 'A short overview video.'
  }
}`,...o.parameters?.docs?.source}}};const L=["Basic","BasicWithEyebrow","Large","Thumbnail","Video"];export{e as Basic,r as BasicWithEyebrow,s as Large,i as Thumbnail,o as Video,L as __namedExportsOrder,V as default};

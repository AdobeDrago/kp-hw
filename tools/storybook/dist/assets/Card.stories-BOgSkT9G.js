import{e as U,a as q,b as D,u as F}from"./pattern-utils-DhwZIP84.js";const V="card",c=a=>D(V,`assets/images/${a}`),u={large:"cardimage.png",thumbnail:"Clinician.png",video:"quarantine-fatigue.png"};function G({variant:a="basic",eyebrow:t="",title:L="Card Title",subtitle:d="",summary:W="Cards are used to summarize content on a single topic and should be easy to scan for actionable information.",ctaLabel:l="Action",ctaVariant:P="action"}={}){U(V);const m=F("card-title"),S=a==="video"?"1":"3";let n="";if(a==="large"||a==="thumbnail"){const I=a==="thumbnail"?'width="44" height="44"':'width="277" height="156"';n=`<div class="ds-card__image"><img src="${c(u[a])}" alt="" ${I}></div>`}else a==="video"&&(n=`<div class="ds-card__image">
        <img src="${c(u.video)}" alt="" height="156" width="277">
        <img class="ds-card__video-play-button" src="${c("play-button.svg")}" alt="" width="75" height="75">
        <div class="ds-card__time-lozenge"></div>
      </div>`);const B=l?`<div class="ds-card__button-container">
         <div class="ds-card__cta">
           <button class="button -${P} -light -small" type="button">${l}</button>
         </div>
       </div>`:"",z=`
    <div class="ds-card__content" role="group" aria-labelledby="${m}">
      ${t?`<div class="ds-card__eyebrow p4 -medium">${t}</div>`:""}
      <div class="ds-card__title" id="${m}">${L}</div>
      ${d?`<div class="ds-card__subtitle">${d}</div>`:""}
      ${a==="thumbnail"?"":`<div class="ds-card__summary"><p>${W}</p></div>`}
      ${B}
    </div>`;return q(`
    <div class="ds-card${a==="video"?" ds-card__option--vertical":""}" data-ds-theme="vessel" data-ds-variant="${a}" data-ds-version="${S}">
      ${n}
      ${z}
    </div>
  `)}const O={title:"Components/Card",render:a=>G(a),decorators:[a=>{const t=document.createElement("div");return t.style.maxWidth="320px",t.appendChild(a()),t}],argTypes:{variant:{control:{type:"select"},options:["basic","large","thumbnail","video"]},ctaVariant:{control:{type:"inline-radio"},options:["action","primary"]},eyebrow:{control:"text"},title:{control:"text"},subtitle:{control:"text"},summary:{control:"text"},ctaLabel:{control:"text"}},args:{variant:"basic",eyebrow:"",title:"Card Title",subtitle:"",summary:"Cards are used to summarize content on a single topic and should be easy to scan for actionable information.",ctaLabel:"Action",ctaVariant:"action"}},e={args:{variant:"basic"}},r={args:{variant:"basic",eyebrow:"Eyebrow",subtitle:"subtitle",ctaLabel:"Primary CTA",ctaVariant:"primary"}},s={args:{variant:"large",title:"Title",ctaLabel:"Primary CTA",ctaVariant:"primary"}},i={args:{variant:"thumbnail",title:"Title"},decorators:[a=>{const t=document.createElement("div");return t.style.maxWidth="420px",t.appendChild(a()),t}]},o={args:{variant:"video",eyebrow:"Video",title:"Watch: managing your care",summary:"A short overview video."}};var b,p,g;e.parameters={...e.parameters,docs:{...(b=e.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    variant: 'basic'
  }
}`,...(g=(p=e.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var v,y,h;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    variant: 'basic',
    eyebrow: 'Eyebrow',
    subtitle: 'subtitle',
    ctaLabel: 'Primary CTA',
    ctaVariant: 'primary'
  }
}`,...(h=(y=r.parameters)==null?void 0:y.docs)==null?void 0:h.source}}};var _,$,x;s.parameters={...s.parameters,docs:{...(_=s.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    variant: 'large',
    title: 'Title',
    ctaLabel: 'Primary CTA',
    ctaVariant: 'primary'
  }
}`,...(x=($=s.parameters)==null?void 0:$.docs)==null?void 0:x.source}}};var C,w,T;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(T=(w=i.parameters)==null?void 0:w.docs)==null?void 0:T.source}}};var A,E,f;o.parameters={...o.parameters,docs:{...(A=o.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    variant: 'video',
    eyebrow: 'Video',
    title: 'Watch: managing your care',
    summary: 'A short overview video.'
  }
}`,...(f=(E=o.parameters)==null?void 0:E.docs)==null?void 0:f.source}}};const R=["Basic","BasicWithEyebrow","Large","Thumbnail","Video"];export{e as Basic,r as BasicWithEyebrow,s as Large,i as Thumbnail,o as Video,R as __namedExportsOrder,O as default};

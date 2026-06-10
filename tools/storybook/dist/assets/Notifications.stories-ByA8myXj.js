import{e as z,a as F,u as G,b as H}from"./pattern-utils-DhwZIP84.js";const V="notifications",p={informational:{src:"info-circle-solid.svg",alt:"Informational"},alert:{src:"alertsolid.svg",alt:"Alert"},error:{src:"errorcirclesolid.svg",alt:"Error"},success:{src:"checkmarkcirclesolid.svg",alt:"Success"}};function g(a){return H(V,`assets/icons/ds2/${a}`)}function q({variant:a="informational",heading:s="Notification heading",body:O="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",dismissible:i=!1,withActions:P=!1}={}){var u;z(V);const{src:W,alt:Y}=p[a]??p.informational,m=G("ds-notification__heading"),B=i?"ds-notification__main-icon":"ds-notification__main",X=P?`<div class="ds-notification__action-buttons">
         <button class="link" type="button">Cancel</button>
         <span class="divider-vertical-wrap"><i class="divider-vertical"></i></span>
         <button class="link" type="button">Retry</button>
       </div>`:"",j=i?`<button class="dismiss" data-dismiss="x-close" aria-label="Dismiss" type="button">
         <img src="${g("close.svg")}" alt="">
         <span>Close</span>
       </button>`:"",l=F(`
    <section aria-live="assertive"
             class="ds-notification${i?" ds-notification--dismiss":""}"
             data-ds-version="2" data-ds-theme="vessel" data-ds-variant="${a}"
             aria-labelledby="${m}">
      <div class="ds-notification__icon">
        <img src="${g(W)}" alt="${Y}" width="40" height="40">
      </div>
      ${j}
      <div class="${B}">
        <div class="ds-notification__header">
          <div class="ds-notification__heading" id="${m}">${s}</div>
        </div>
        <div class="ds-notification__body">
          <p>${O}</p>
          ${X}
        </div>
      </div>
    </section>
  `);return i&&((u=l.querySelector(".dismiss"))==null||u.addEventListener("click",()=>l.remove())),l}const K={title:"Components/Notifications",render:a=>q(a),argTypes:{variant:{control:{type:"select"},options:["informational","alert","error","success"],description:"Status/severity of the notification (sets icon + accent)."},heading:{control:"text"},body:{control:"text"},dismissible:{control:"boolean",description:"Show the close (X) button."},withActions:{control:"boolean",description:"Show Cancel / Retry action buttons."}},args:{variant:"informational",heading:"Notification example with a link",body:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",dismissible:!1,withActions:!1}},t={args:{variant:"informational"}},e={args:{variant:"alert",heading:"Something needs your attention"}},n={args:{variant:"error",heading:"Something went wrong"}},r={args:{variant:"success",heading:"You’re all set"}},o={args:{variant:"informational",dismissible:!0,heading:"Dismissible notification"}},c={args:{variant:"alert",withActions:!0,heading:"Confirm this action"}},d={argTypes:{variant:{table:{disable:!0}}},render:()=>{const a=document.createElement("div");return a.style.display="grid",a.style.gap="1.5rem",["informational","alert","error","success"].forEach(s=>{a.appendChild(q({variant:s,heading:`${s[0].toUpperCase()}${s.slice(1)} notification`,dismissible:!0}))}),a}};var f,v,h;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    variant: 'informational'
  }
}`,...(h=(v=t.parameters)==null?void 0:v.docs)==null?void 0:h.source}}};var b,y,_;e.parameters={...e.parameters,docs:{...(b=e.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    variant: 'alert',
    heading: 'Something needs your attention'
  }
}`,...(_=(y=e.parameters)==null?void 0:y.docs)==null?void 0:_.source}}};var w,S,$;n.parameters={...n.parameters,docs:{...(w=n.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    heading: 'Something went wrong'
  }
}`,...($=(S=n.parameters)==null?void 0:S.docs)==null?void 0:$.source}}};var A,C,E;r.parameters={...r.parameters,docs:{...(A=r.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    heading: 'You’re all set'
  }
}`,...(E=(C=r.parameters)==null?void 0:C.docs)==null?void 0:E.source}}};var N,k,x;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    variant: 'informational',
    dismissible: true,
    heading: 'Dismissible notification'
  }
}`,...(x=(k=o.parameters)==null?void 0:k.docs)==null?void 0:x.source}}};var I,T,D;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    variant: 'alert',
    withActions: true,
    heading: 'Confirm this action'
  }
}`,...(D=(T=c.parameters)==null?void 0:T.docs)==null?void 0:D.source}}};var R,L,U;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  argTypes: {
    variant: {
      table: {
        disable: true
      }
    }
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gap = '1.5rem';
    ['informational', 'alert', 'error', 'success'].forEach(variant => {
      wrap.appendChild(renderNotification({
        variant,
        heading: \`\${variant[0].toUpperCase()}\${variant.slice(1)} notification\`,
        dismissible: true
      }));
    });
    return wrap;
  }
}`,...(U=(L=d.parameters)==null?void 0:L.docs)==null?void 0:U.source}}};const M=["Informational","Alert","Error","Success","Dismissible","WithActions","AllVariants"];export{e as Alert,d as AllVariants,o as Dismissible,n as Error,t as Informational,r as Success,c as WithActions,M as __namedExportsOrder,K as default};

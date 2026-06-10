import{e as $,a as A,u as C,b as E}from"./pattern-utils-DhwZIP84.js";const g="notifications",u={informational:{src:"info-circle-solid.svg",alt:"Informational"},alert:{src:"alertsolid.svg",alt:"Alert"},error:{src:"errorcirclesolid.svg",alt:"Error"},success:{src:"checkmarkcirclesolid.svg",alt:"Success"}};function p(a){return E(g,`assets/icons/ds2/${a}`)}function f({variant:a="informational",heading:s="Notification heading",body:v="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",dismissible:i=!1,withActions:h=!1}={}){$(g);const{src:b,alt:y}=u[a]??u.informational,m=C("ds-notification__heading"),_=i?"ds-notification__main-icon":"ds-notification__main",w=h?`<div class="ds-notification__action-buttons">
         <button class="link" type="button">Cancel</button>
         <span class="divider-vertical-wrap"><i class="divider-vertical"></i></span>
         <button class="link" type="button">Retry</button>
       </div>`:"",S=i?`<button class="dismiss" data-dismiss="x-close" aria-label="Dismiss" type="button">
         <img src="${p("close.svg")}" alt="">
         <span>Close</span>
       </button>`:"",l=A(`
    <section aria-live="assertive"
             class="ds-notification${i?" ds-notification--dismiss":""}"
             data-ds-version="2" data-ds-theme="vessel" data-ds-variant="${a}"
             aria-labelledby="${m}">
      <div class="ds-notification__icon">
        <img src="${p(b)}" alt="${y}" width="40" height="40">
      </div>
      ${S}
      <div class="${_}">
        <div class="ds-notification__header">
          <div class="ds-notification__heading" id="${m}">${s}</div>
        </div>
        <div class="ds-notification__body">
          <p>${v}</p>
          ${w}
        </div>
      </div>
    </section>
  `);return i&&l.querySelector(".dismiss")?.addEventListener("click",()=>l.remove()),l}const k={title:"Components/Notifications",render:a=>f(a),argTypes:{variant:{control:{type:"select"},options:["informational","alert","error","success"],description:"Status/severity of the notification (sets icon + accent)."},heading:{control:"text"},body:{control:"text"},dismissible:{control:"boolean",description:"Show the close (X) button."},withActions:{control:"boolean",description:"Show Cancel / Retry action buttons."}},args:{variant:"informational",heading:"Notification example with a link",body:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",dismissible:!1,withActions:!1}},t={args:{variant:"informational"}},e={args:{variant:"alert",heading:"Something needs your attention"}},n={args:{variant:"error",heading:"Something went wrong"}},r={args:{variant:"success",heading:"You’re all set"}},o={args:{variant:"informational",dismissible:!0,heading:"Dismissible notification"}},c={args:{variant:"alert",withActions:!0,heading:"Confirm this action"}},d={argTypes:{variant:{table:{disable:!0}}},render:()=>{const a=document.createElement("div");return a.style.display="grid",a.style.gap="1.5rem",["informational","alert","error","success"].forEach(s=>{a.appendChild(f({variant:s,heading:`${s[0].toUpperCase()}${s.slice(1)} notification`,dismissible:!0}))}),a}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'informational'
  }
}`,...t.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'alert',
    heading: 'Something needs your attention'
  }
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    heading: 'Something went wrong'
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    heading: 'You’re all set'
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'informational',
    dismissible: true,
    heading: 'Dismissible notification'
  }
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'alert',
    withActions: true,
    heading: 'Confirm this action'
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source}}};const x=["Informational","Alert","Error","Success","Dismissible","WithActions","AllVariants"];export{e as Alert,d as AllVariants,o as Dismissible,n as Error,t as Informational,r as Success,c as WithActions,x as __namedExportsOrder,k as default};

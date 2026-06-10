let c=0;const $=(t="ds-notification__heading")=>(c+=1,`${t}-${c}`),d={informational:"Informational",alert:"Alert",error:"Error",success:"Success"};function p(t){const i=document.createElement("template");return i.innerHTML=t.trim(),i.content.firstElementChild}function h({variant:t="informational",heading:i="",body:s="",dismissible:n=!1,withActions:l=!1,iconSrc:r="",closeIconSrc:f=""}={}){const o=$(),u=d[t]??d.informational,v=n?"ds-notification__main-icon":"ds-notification__main",m=/<p[\s>]/i.test(s)?s:`<p>${s}</p>`,_=n?`<button class="dismiss" data-dismiss="x-close" aria-label="Dismiss" type="button">
         <img src="${f}" alt=""><span>Close</span>
       </button>`:"",a=p(`
    <section aria-live="assertive"
             class="ds-notification${n?" ds-notification--dismiss":""}"
             data-ds-version="2" data-ds-theme="vessel" data-ds-variant="${t}"
             aria-labelledby="${o}">
      <div class="ds-notification__icon"><img src="${r}" alt="${u}" width="40" height="40"></div>
      ${_}
      <div class="${v}">
        <div class="ds-notification__header">
          <div class="ds-notification__heading" id="${o}">${i}</div>
        </div>
        <div class="ds-notification__body">${m}${l?`<div class="ds-notification__action-buttons">
         <button class="link" type="button">Cancel</button>
         <span class="divider-vertical-wrap"><i class="divider-vertical"></i></span>
         <button class="link" type="button">Retry</button>
       </div>`:""}</div>
      </div>
    </section>
  `);if(n){const e=a.querySelector(".dismiss");e&&e.addEventListener("click",()=>a.remove())}return a}export{d as VARIANT_ALT,h as renderNotification};

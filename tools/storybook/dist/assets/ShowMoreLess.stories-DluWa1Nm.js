import{e as x,a as L}from"./pattern-utils-DhwZIP84.js";const A="show-more-less";function C({showFirst:o=3,itemCount:S=6,moreLabel:a="Show more",lessLabel:i="Show less",showDivider:c=!0}={}){x(A);const b=Array.from({length:S},(s,n)=>`
    <div class="show-more-less-item">
      <div>Article Title ${n+1}</div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque id sodales mi.</p>
    </div>`).join(""),e=L(`
    <div class="ds-showmoreless" data-ds-theme="vessel" data-ds-variant="block" data-ds-version="3"
         data-show-first="${o}" data-more-label="${a}" data-less-label="${i}"
         data-show-icon="true" data-show-divider="${c}">
      ${b}
      <div class="show-more-less-group">
        ${c?'<hr class="show-more-less-divider">':""}
        <button class="show-more-less-toggle" aria-expanded="false" type="button">
          <span class="show-more-less-icon" aria-hidden="true"></span>
          <span class="show-more-less-toggle-label">${a}</span>
        </button>
      </div>
    </div>
  `),v=[...e.querySelectorAll(".show-more-less-item")],l=e.querySelector(".show-more-less-toggle"),y=e.querySelector(".show-more-less-icon"),f=e.querySelector(".show-more-less-toggle-label"),m=s=>{v.forEach((n,$)=>{n.hidden=!s&&$>=o}),l.setAttribute("aria-expanded",String(s)),y.classList.toggle("--minus",s),f.textContent=s?i:a};return m(!1),l.addEventListener("click",()=>m(l.getAttribute("aria-expanded")!=="true")),e}const q={title:"Components/Show More Less",render:o=>C(o),argTypes:{showFirst:{control:{type:"number",min:1,max:10}},itemCount:{control:{type:"number",min:1,max:12}},moreLabel:{control:"text"},lessLabel:{control:"text"},showDivider:{control:"boolean"}},args:{showFirst:3,itemCount:6,moreLabel:"Show more",lessLabel:"Show less",showDivider:!0}},t={},r={args:{showFirst:2,itemCount:5}};var d,u,h;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:"{}",...(h=(u=t.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var w,p,g;r.parameters={...r.parameters,docs:{...(w=r.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    showFirst: 2,
    itemCount: 5
  }
}`,...(g=(p=r.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};const E=["Block","ShowTwo"];export{t as Block,r as ShowTwo,E as __namedExportsOrder,q as default};

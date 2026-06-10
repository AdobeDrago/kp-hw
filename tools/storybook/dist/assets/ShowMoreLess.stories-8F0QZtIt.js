import{e as S,a as b}from"./pattern-utils-DhwZIP84.js";const v="show-more-less";function y({showFirst:o=3,itemCount:d=6,moreLabel:a="Show more",lessLabel:i="Show less",showDivider:c=!0}={}){S(v);const u=Array.from({length:d},(s,n)=>`
    <div class="show-more-less-item">
      <div>Article Title ${n+1}</div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque id sodales mi.</p>
    </div>`).join(""),e=b(`
    <div class="ds-showmoreless" data-ds-theme="vessel" data-ds-variant="block" data-ds-version="3"
         data-show-first="${o}" data-more-label="${a}" data-less-label="${i}"
         data-show-icon="true" data-show-divider="${c}">
      ${u}
      <div class="show-more-less-group">
        ${c?'<hr class="show-more-less-divider">':""}
        <button class="show-more-less-toggle" aria-expanded="false" type="button">
          <span class="show-more-less-icon" aria-hidden="true"></span>
          <span class="show-more-less-toggle-label">${a}</span>
        </button>
      </div>
    </div>
  `),h=[...e.querySelectorAll(".show-more-less-item")],l=e.querySelector(".show-more-less-toggle"),w=e.querySelector(".show-more-less-icon"),p=e.querySelector(".show-more-less-toggle-label"),m=s=>{h.forEach((n,g)=>{n.hidden=!s&&g>=o}),l.setAttribute("aria-expanded",String(s)),w.classList.toggle("--minus",s),p.textContent=s?i:a};return m(!1),l.addEventListener("click",()=>m(l.getAttribute("aria-expanded")!=="true")),e}const $={title:"Components/Show More Less",render:o=>y(o),argTypes:{showFirst:{control:{type:"number",min:1,max:10}},itemCount:{control:{type:"number",min:1,max:12}},moreLabel:{control:"text"},lessLabel:{control:"text"},showDivider:{control:"boolean"}},args:{showFirst:3,itemCount:6,moreLabel:"Show more",lessLabel:"Show less",showDivider:!0}},t={},r={args:{showFirst:2,itemCount:5}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{}",...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    showFirst: 2,
    itemCount: 5
  }
}`,...r.parameters?.docs?.source}}};const x=["Block","ShowTwo"];export{t as Block,r as ShowTwo,x as __namedExportsOrder,$ as default};

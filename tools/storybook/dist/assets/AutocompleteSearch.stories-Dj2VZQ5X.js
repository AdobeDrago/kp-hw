import{e as f,a as y,b as v}from"./pattern-utils-DhwZIP84.js";const d="autocomplete-search",p=["Acne","ADD-ADHD","Adult Vaccines","Allergies","Alzheimers","Anxiety Panic","Arthritis","Asthma","Back Pain","Birth Control","Breast Cancer","Cancer","Diabetes","Flu","Heart Disease","High Blood Pressure","Migraine","Pregnancy"];function g({label:c="Contextual search label",placeholder:m="Type keyword to search",suggestions:h=p,maxResults:b=8}={}){f(d);const a=y(`
    <div class="ds-autocompletesearch" data-ds-theme="vessel" data-ds-variant="contextual" data-ds-version="2">
      <form class="autocomplete-search__form" autocomplete="off" method="get" onsubmit="return false" action="">
        <label class="autocomplete-search__label">${c}</label>
        <div class="autocomplete-search__combobox ds-form__clear-input-field" role="application">
          <input class="autocomplete-search__input clear-input-textbox contextual-input" type="text"
                 placeholder="${m}" role="combobox" aria-expanded="false" aria-autocomplete="list">
          <fieldset class="autocomplete-search__listbox -hidden">
            <ul class="autocomplete-search__result" role="listbox"></ul>
          </fieldset>
          <button class="clear-input-button" type="button" aria-label="Clear">
            <img src="${v(d,"assets/images/clear_x.svg")}" alt="">
          </button>
        </div>
        <button class="autocomplete-search__submit button" type="submit">Search</button>
      </form>
    </div>
  `),e=a.querySelector(".autocomplete-search__input"),r=a.querySelector(".autocomplete-search__listbox"),n=a.querySelector(".autocomplete-search__result"),_=a.querySelector(".clear-input-button"),t=()=>{r.classList.add("-hidden"),r.style.display="none",e.setAttribute("aria-expanded","false")},x=()=>{r.classList.remove("-hidden"),r.style.display="",e.setAttribute("aria-expanded","true")},i=()=>{const o=e.value.trim().toLowerCase();if(!o)return t();const u=h.filter(s=>s.toLowerCase().includes(o)).slice(0,b);return u.length?(n.innerHTML=u.map(s=>`<li role="option"><button class="autocomplete-search__link" type="button">${s}</button></li>`).join(""),n.querySelectorAll(".autocomplete-search__link").forEach(s=>{s.addEventListener("click",()=>{e.value=s.textContent,t(),e.focus()})}),x()):t()};return e.addEventListener("input",i),e.addEventListener("focus",i),e.addEventListener("keydown",o=>{o.key==="Escape"&&t()}),_.addEventListener("click",()=>{e.value="",t(),e.focus()}),document.addEventListener("click",o=>{a.contains(o.target)||t()}),t(),a}const S={title:"Components/Autocomplete Search",render:c=>g(c),argTypes:{label:{control:"text"},placeholder:{control:"text"},suggestions:{control:"object"},maxResults:{control:{type:"number",min:1,max:15}}},args:{label:"Contextual search label",placeholder:"Type keyword to search",suggestions:p,maxResults:8}},l={};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:"{}",...l.parameters?.docs?.source}}};const C=["Contextual"];export{l as Contextual,C as __namedExportsOrder,S as default};

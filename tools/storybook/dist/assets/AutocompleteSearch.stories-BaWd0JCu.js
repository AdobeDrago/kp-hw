import{e as g,a as A,b as S}from"./pattern-utils-DhwZIP84.js";const d="autocomplete-search",b=["Acne","ADD-ADHD","Adult Vaccines","Allergies","Alzheimers","Anxiety Panic","Arthritis","Asthma","Back Pain","Birth Control","Breast Cancer","Cancer","Diabetes","Flu","Heart Disease","High Blood Pressure","Migraine","Pregnancy"];function C({label:c="Contextual search label",placeholder:_="Type keyword to search",suggestions:x=b,maxResults:f=8}={}){g(d);const a=A(`
    <div class="ds-autocompletesearch" data-ds-theme="vessel" data-ds-variant="contextual" data-ds-version="2">
      <form class="autocomplete-search__form" autocomplete="off" method="get" onsubmit="return false" action="">
        <label class="autocomplete-search__label">${c}</label>
        <div class="autocomplete-search__combobox ds-form__clear-input-field" role="application">
          <input class="autocomplete-search__input clear-input-textbox contextual-input" type="text"
                 placeholder="${_}" role="combobox" aria-expanded="false" aria-autocomplete="list">
          <fieldset class="autocomplete-search__listbox -hidden">
            <ul class="autocomplete-search__result" role="listbox"></ul>
          </fieldset>
          <button class="clear-input-button" type="button" aria-label="Clear">
            <img src="${S(d,"assets/images/clear_x.svg")}" alt="">
          </button>
        </div>
        <button class="autocomplete-search__submit button" type="submit">Search</button>
      </form>
    </div>
  `),e=a.querySelector(".autocomplete-search__input"),r=a.querySelector(".autocomplete-search__listbox"),n=a.querySelector(".autocomplete-search__result"),y=a.querySelector(".clear-input-button"),t=()=>{r.classList.add("-hidden"),r.style.display="none",e.setAttribute("aria-expanded","false")},v=()=>{r.classList.remove("-hidden"),r.style.display="",e.setAttribute("aria-expanded","true")},i=()=>{const o=e.value.trim().toLowerCase();if(!o)return t();const u=x.filter(s=>s.toLowerCase().includes(o)).slice(0,f);return u.length?(n.innerHTML=u.map(s=>`<li role="option"><button class="autocomplete-search__link" type="button">${s}</button></li>`).join(""),n.querySelectorAll(".autocomplete-search__link").forEach(s=>{s.addEventListener("click",()=>{e.value=s.textContent,t(),e.focus()})}),v()):t()};return e.addEventListener("input",i),e.addEventListener("focus",i),e.addEventListener("keydown",o=>{o.key==="Escape"&&t()}),y.addEventListener("click",()=>{e.value="",t(),e.focus()}),document.addEventListener("click",o=>{a.contains(o.target)||t()}),t(),a}const L={title:"Components/Autocomplete Search",render:c=>C(c),argTypes:{label:{control:"text"},placeholder:{control:"text"},suggestions:{control:"object"},maxResults:{control:{type:"number",min:1,max:15}}},args:{label:"Contextual search label",placeholder:"Type keyword to search",suggestions:b,maxResults:8}},l={};var p,m,h;l.parameters={...l.parameters,docs:{...(p=l.parameters)==null?void 0:p.docs,source:{originalSource:"{}",...(h=(m=l.parameters)==null?void 0:m.docs)==null?void 0:h.source}}};const k=["Contextual"];export{l as Contextual,k as __namedExportsOrder,L as default};

import{e as c,a as d}from"./pattern-utils-DhwZIP84.js";const u="search-results";function p({category:e,title:o,affiliate:t,points:i=[]}){const r=i.map(l=>`<li class="data-point"><span class="data-bold">${l.label}:</span><span class="data-text"> ${l.value}</span></li>`).join("");return`
    <div class="search-result">
      <div class="search-result--header">
        <span class="content-block category-pre-heading">${e}</span>
        <span class="content-block result-title-heading -first-letter-uppercase"><a href="#">${o}</a></span>
        ${t?`<span class="content-block affiliate-sub-heading">${t}</span>`:""}
      </div>
      <div class="search-result--body">
        ${r?`<ul class="data-points">${r}</ul>`:""}
      </div>
    </div>`}function m({results:e=[]}={}){return c(u),d(`
    <div class="ds-search-results" data-ds-variant="base" data-ds-theme="vessel" data-ds-version="3">
      ${e.map(p).join("")}
    </div>
  `)}const n=[{category:"Category",title:"advanced Yoga",affiliate:"Kaiser Permanente Affiliate",points:[{label:"Data Point 1",value:"Lorum ipsum dolor sit amet"},{label:"Data Point 2",value:"consectetur adipiscing elit"}]},{category:"Category",title:"beginner Pilates",affiliate:"Kaiser Permanente Affiliate",points:[{label:"Data Point 1",value:"Lorum ipsum dolor sit amet"}]}],v={title:"Components/Search Results",render:e=>m(e),argTypes:{results:{control:"object"}},args:{results:n}},s={},a={args:{results:[n[0]]}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    results: [DEFAULT_RESULTS[0]]
  }
}`,...a.parameters?.docs?.source}}};const f=["Base","SingleResult"];export{s as Base,a as SingleResult,f as __namedExportsOrder,v as default};

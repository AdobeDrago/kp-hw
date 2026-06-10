import{e as v,a as f}from"./pattern-utils-DhwZIP84.js";const h="search-results";function b({category:e,title:m,affiliate:t,points:g=[]}){const r=g.map(l=>`<li class="data-point"><span class="data-bold">${l.label}:</span><span class="data-text"> ${l.value}</span></li>`).join("");return`
    <div class="search-result">
      <div class="search-result--header">
        <span class="content-block category-pre-heading">${e}</span>
        <span class="content-block result-title-heading -first-letter-uppercase"><a href="#">${m}</a></span>
        ${t?`<span class="content-block affiliate-sub-heading">${t}</span>`:""}
      </div>
      <div class="search-result--body">
        ${r?`<ul class="data-points">${r}</ul>`:""}
      </div>
    </div>`}function S({results:e=[]}={}){return v(h),f(`
    <div class="ds-search-results" data-ds-variant="base" data-ds-theme="vessel" data-ds-version="3">
      ${e.map(b).join("")}
    </div>
  `)}const p=[{category:"Category",title:"advanced Yoga",affiliate:"Kaiser Permanente Affiliate",points:[{label:"Data Point 1",value:"Lorum ipsum dolor sit amet"},{label:"Data Point 2",value:"consectetur adipiscing elit"}]},{category:"Category",title:"beginner Pilates",affiliate:"Kaiser Permanente Affiliate",points:[{label:"Data Point 1",value:"Lorum ipsum dolor sit amet"}]}],$={title:"Components/Search Results",render:e=>S(e),argTypes:{results:{control:"object"}},args:{results:p}},s={},a={args:{results:[p[0]]}};var n,o,i;s.parameters={...s.parameters,docs:{...(n=s.parameters)==null?void 0:n.docs,source:{originalSource:"{}",...(i=(o=s.parameters)==null?void 0:o.docs)==null?void 0:i.source}}};var c,d,u;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    results: [DEFAULT_RESULTS[0]]
  }
}`,...(u=(d=a.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};const y=["Base","SingleResult"];export{s as Base,a as SingleResult,y as __namedExportsOrder,$ as default};

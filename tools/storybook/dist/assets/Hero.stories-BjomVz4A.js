import{e as p,a as u,b as v}from"./pattern-utils-DhwZIP84.js";const r="hero",m=v(r,"assets/images/hero-right-side-image.jpg");function _({variant:s="card-overlay",position:n="left",cols:i=6,title:c="Spacious gracious",description:d="Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.",primaryCta:a="Primary",secondaryCta:o="Secondary"}={}){p(r);const l=[o?`<span class="ds-buttoncontainer__button-swap">
           <button class="button -inverted -light" type="button">${o}</button>
         </span>`:"",a?`<span class="ds-buttoncontainer__button-swap">
           <button class="button -primary -light" type="button">${a}</button>
         </span>`:""].join("");return u(`
    <div class="ds-hero ds-hero__cols--${i} ds-hero__size--l1 ds-hero__position--${n}"
         data-ds-variant="${s}" data-ds-version="3" data-ds-theme="vessel">
      <img class="ds-hero__background-image" src="${m}" alt="Sunny mountainside lake" width="1920" height="480">
      <div class="ds-hero__outer-content-container">
        <div class="ds-hero__inner-content-container">
          <div class="cmp-teaser">
            <div class="cmp-teaser__content">
              <h2 class="cmp-teaser__title">${c}</h2>
              <div class="cmp-teaser__description"><p class="p1 -book">${d}</p></div>
              <div class="cmp-teaser__action-container">
                <div class="ds-buttoncontainer ds-buttoncontainer__left ds-buttoncontainer__reversed-mobile"
                     data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="3">
                  <div class="ds-buttoncontainer__list">${l}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `)}const g={title:"Components/Hero",render:s=>_(s),parameters:{layout:"fullscreen"},argTypes:{variant:{control:{type:"inline-radio"},options:["card-overlay","text-overlay"]},position:{control:{type:"inline-radio"},options:["left","center","right"]},cols:{control:{type:"inline-radio"},options:[6,12]},title:{control:"text"},description:{control:"text"},primaryCta:{control:"text"},secondaryCta:{control:"text"}},args:{variant:"card-overlay",position:"left",cols:6,title:"Spacious gracious",description:"Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.",primaryCta:"Primary",secondaryCta:"Secondary"}},t={args:{variant:"card-overlay"}},e={args:{variant:"text-overlay",position:"center"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'card-overlay'
  }
}`,...t.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'text-overlay',
    position: 'center'
  }
}`,...e.parameters?.docs?.source}}};const b=["CardOverlay","TextOverlay"];export{t as CardOverlay,e as TextOverlay,b as __namedExportsOrder,g as default};

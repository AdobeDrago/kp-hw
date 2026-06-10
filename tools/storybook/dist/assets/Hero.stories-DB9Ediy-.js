import{e as g,a as b,b as h}from"./pattern-utils-DhwZIP84.js";const p="hero",x=h(p,"assets/images/hero-right-side-image.jpg");function $({variant:s="card-overlay",position:u="left",cols:v=6,title:m="Spacious gracious",description:_="Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.",primaryCta:a="Primary",secondaryCta:o="Secondary"}={}){g(p);const y=[o?`<span class="ds-buttoncontainer__button-swap">
           <button class="button -inverted -light" type="button">${o}</button>
         </span>`:"",a?`<span class="ds-buttoncontainer__button-swap">
           <button class="button -primary -light" type="button">${a}</button>
         </span>`:""].join("");return b(`
    <div class="ds-hero ds-hero__cols--${v} ds-hero__size--l1 ds-hero__position--${u}"
         data-ds-variant="${s}" data-ds-version="3" data-ds-theme="vessel">
      <img class="ds-hero__background-image" src="${x}" alt="Sunny mountainside lake" width="1920" height="480">
      <div class="ds-hero__outer-content-container">
        <div class="ds-hero__inner-content-container">
          <div class="cmp-teaser">
            <div class="cmp-teaser__content">
              <h2 class="cmp-teaser__title">${m}</h2>
              <div class="cmp-teaser__description"><p class="p1 -book">${_}</p></div>
              <div class="cmp-teaser__action-container">
                <div class="ds-buttoncontainer ds-buttoncontainer__left ds-buttoncontainer__reversed-mobile"
                     data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="3">
                  <div class="ds-buttoncontainer__list">${y}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `)}const S={title:"Components/Hero",render:s=>$(s),parameters:{layout:"fullscreen"},argTypes:{variant:{control:{type:"inline-radio"},options:["card-overlay","text-overlay"]},position:{control:{type:"inline-radio"},options:["left","center","right"]},cols:{control:{type:"inline-radio"},options:[6,12]},title:{control:"text"},description:{control:"text"},primaryCta:{control:"text"},secondaryCta:{control:"text"}},args:{variant:"card-overlay",position:"left",cols:6,title:"Spacious gracious",description:"Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.",primaryCta:"Primary",secondaryCta:"Secondary"}},t={args:{variant:"card-overlay"}},e={args:{variant:"text-overlay",position:"center"}};var r,n,i;t.parameters={...t.parameters,docs:{...(r=t.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    variant: 'card-overlay'
  }
}`,...(i=(n=t.parameters)==null?void 0:n.docs)==null?void 0:i.source}}};var c,d,l;e.parameters={...e.parameters,docs:{...(c=e.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    variant: 'text-overlay',
    position: 'center'
  }
}`,...(l=(d=e.parameters)==null?void 0:d.docs)==null?void 0:l.source}}};const O=["CardOverlay","TextOverlay"];export{t as CardOverlay,e as TextOverlay,O as __namedExportsOrder,S as default};

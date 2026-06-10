import{e as m,a as x,b as A,u as b}from"./pattern-utils-DhwZIP84.js";const u="form",N=A(u,"assets/images/errorcirclesmall.svg");function F(e,a){return`<div class="error-description">
      <ul id="${e}" role="presentation">
        <li><span class="inline-error-icon" aria-hidden="true"><img src="${N}" alt="" width="16" height="16"></span> ${a}</li>
      </ul>
    </div>`}function R({label:e="Label",value:a="",helperText:o="",error:r="",disabled:s=!1}={}){m(u);const t=b("text-input"),v=`${t}-helper`,g=`${t}-error`,$=[o?v:"",r?g:""].filter(Boolean).join(" ");return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="input" data-ds-version="2">
      <label for="${t}">${e}</label>
      <div>
        <input type="text" id="${t}" value="${a}" autocomplete="on"
               class="${r?"ds-form__error-field":""}" ${s?"disabled":""}
               ${$?`aria-describedby="${$}"`:""}>
        ${o?`<span id="${v}" class="ds-form__text-input-helper">${o}</span>`:""}
        ${r?F(g,r):""}
      </div>
    </div>
  `)}function U({label:e="Label",placeholder:a="Choose an option",options:o=[]}={}){m(u);const r=b("select-menu"),s=o.map(t=>`<option value="${t}">${t}</option>`).join("");return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="select" data-ds-version="2">
      <label for="${r}">${e}</label>
      <div class="select-one">
        <select id="${r}">
          <option value="" disabled hidden selected>${a}</option>
          ${s}
        </select>
      </div>
    </div>
  `)}function k({label:e="Label",lines:a=3,value:o="",error:r=""}={}){m(u);const s=b("text-area"),t=`${s}-error`;return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="text-area" data-ds-version="2">
      <label for="${s}">${e}</label>
      <textarea id="${s}" data-show-lines="${a}" autocomplete="on"
                class="ds-form__text-area_global${r?" ds-form__error-field":""}"
                ${r?`aria-describedby="${t}"`:""}>${o}</textarea>
      ${r?F(t,r):""}
    </div>
  `)}const z={title:"Components/Form"},n={render:e=>R(e),argTypes:{label:{control:"text"},value:{control:"text"},helperText:{control:"text"},error:{control:"text",description:"Error message (empty = no error)."},disabled:{control:"boolean"}},args:{label:"Label",value:"",helperText:"",error:"",disabled:!1}},l={...n,args:{...n.args,helperText:"Helper text for input field"}},d={...n,args:{...n.args,value:"invalid@",error:"Please enter a valid email address."}},i={...n,args:{...n.args,disabled:!0,value:"Disabled"}},c={render:e=>U(e),argTypes:{label:{control:"text"},placeholder:{control:"text"},options:{control:"object"}},args:{label:"Label",placeholder:"Choose an option",options:["Option 1","Option 2","Option 3"]}},p={render:e=>k(e),argTypes:{label:{control:"text"},lines:{control:{type:"number",min:1,max:10}},value:{control:"text"},error:{control:"text"}},args:{label:"Label",lines:3,value:"",error:""}};var T,f,h;n.parameters={...n.parameters,docs:{...(T=n.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: a => renderTextInput(a),
  argTypes: {
    label: {
      control: 'text'
    },
    value: {
      control: 'text'
    },
    helperText: {
      control: 'text'
    },
    error: {
      control: 'text',
      description: 'Error message (empty = no error).'
    },
    disabled: {
      control: 'boolean'
    }
  },
  args: {
    label: 'Label',
    value: '',
    helperText: '',
    error: '',
    disabled: false
  }
}`,...(h=(f=n.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var I,y,_;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    helperText: 'Helper text for input field'
  }
}`,...(_=(y=l.parameters)==null?void 0:y.docs)==null?void 0:_.source}}};var S,L,O;d.parameters={...d.parameters,docs:{...(S=d.parameters)==null?void 0:S.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    value: 'invalid@',
    error: 'Please enter a valid email address.'
  }
}`,...(O=(L=d.parameters)==null?void 0:L.docs)==null?void 0:O.source}}};var E,j,C;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    disabled: true,
    value: 'Disabled'
  }
}`,...(C=(j=i.parameters)==null?void 0:j.docs)==null?void 0:C.source}}};var D,H,P;c.parameters={...c.parameters,docs:{...(D=c.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: a => renderSelect(a),
  argTypes: {
    label: {
      control: 'text'
    },
    placeholder: {
      control: 'text'
    },
    options: {
      control: 'object'
    }
  },
  args: {
    label: 'Label',
    placeholder: 'Choose an option',
    options: ['Option 1', 'Option 2', 'Option 3']
  }
}`,...(P=(H=c.parameters)==null?void 0:H.docs)==null?void 0:P.source}}};var W,w,B;p.parameters={...p.parameters,docs:{...(W=p.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: a => renderTextarea(a),
  argTypes: {
    label: {
      control: 'text'
    },
    lines: {
      control: {
        type: 'number',
        min: 1,
        max: 10
      }
    },
    value: {
      control: 'text'
    },
    error: {
      control: 'text'
    }
  },
  args: {
    label: 'Label',
    lines: 3,
    value: '',
    error: ''
  }
}`,...(B=(w=p.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};const G=["TextInput","TextInputWithHelper","TextInputWithError","TextInputDisabled","Select","Textarea"];export{c as Select,n as TextInput,i as TextInputDisabled,d as TextInputWithError,l as TextInputWithHelper,p as Textarea,G as __namedExportsOrder,z as default};

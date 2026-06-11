import{e as m,a as x,b as f,u as b}from"./pattern-utils-DhwZIP84.js";const u="form",h=f(u,"assets/images/errorcirclesmall.svg");function T(e,a){return`<div class="error-description">
      <ul id="${e}" role="presentation">
        <li><span class="inline-error-icon" aria-hidden="true"><img src="${h}" alt="" width="16" height="16"></span> ${a}</li>
      </ul>
    </div>`}function I({label:e="Label",value:a="",helperText:o="",error:r="",disabled:s=!1}={}){m(u);const t=b("text-input"),v=`${t}-helper`,g=`${t}-error`,$=[o?v:"",r?g:""].filter(Boolean).join(" ");return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="input" data-ds-version="2">
      <label for="${t}">${e}</label>
      <div>
        <input type="text" id="${t}" value="${a}" autocomplete="on"
               class="${r?"ds-form__error-field":""}" ${s?"disabled":""}
               ${$?`aria-describedby="${$}"`:""}>
        ${o?`<span id="${v}" class="ds-form__text-input-helper">${o}</span>`:""}
        ${r?T(g,r):""}
      </div>
    </div>
  `)}function y({label:e="Label",placeholder:a="Choose an option",options:o=[]}={}){m(u);const r=b("select-menu"),s=o.map(t=>`<option value="${t}">${t}</option>`).join("");return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="select" data-ds-version="2">
      <label for="${r}">${e}</label>
      <div class="select-one">
        <select id="${r}">
          <option value="" disabled hidden selected>${a}</option>
          ${s}
        </select>
      </div>
    </div>
  `)}function _({label:e="Label",lines:a=3,value:o="",error:r=""}={}){m(u);const s=b("text-area"),t=`${s}-error`;return x(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="text-area" data-ds-version="2">
      <label for="${s}">${e}</label>
      <textarea id="${s}" data-show-lines="${a}" autocomplete="on"
                class="ds-form__text-area_global${r?" ds-form__error-field":""}"
                ${r?`aria-describedby="${t}"`:""}>${o}</textarea>
      ${r?T(t,r):""}
    </div>
  `)}const L={title:"Components/Form"},n={render:e=>I(e),argTypes:{label:{control:"text"},value:{control:"text"},helperText:{control:"text"},error:{control:"text",description:"Error message (empty = no error)."},disabled:{control:"boolean"}},args:{label:"Label",value:"",helperText:"",error:"",disabled:!1}},l={...n,args:{...n.args,helperText:"Helper text for input field"}},d={...n,args:{...n.args,value:"invalid@",error:"Please enter a valid email address."}},i={...n,args:{...n.args,disabled:!0,value:"Disabled"}},c={render:e=>y(e),argTypes:{label:{control:"text"},placeholder:{control:"text"},options:{control:"object"}},args:{label:"Label",placeholder:"Choose an option",options:["Option 1","Option 2","Option 3"]}},p={render:e=>_(e),argTypes:{label:{control:"text"},lines:{control:{type:"number",min:1,max:10}},value:{control:"text"},error:{control:"text"}},args:{label:"Label",lines:3,value:"",error:""}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
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
}`,...n.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    helperText: 'Helper text for input field'
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    value: 'invalid@',
    error: 'Please enter a valid email address.'
  }
}`,...d.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  ...TextInput,
  args: {
    ...TextInput.args,
    disabled: true,
    value: 'Disabled'
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}};const O=["TextInput","TextInputWithHelper","TextInputWithError","TextInputDisabled","Select","Textarea"];export{c as Select,n as TextInput,i as TextInputDisabled,d as TextInputWithError,l as TextInputWithHelper,p as Textarea,O as __namedExportsOrder,L as default};

// Form — current lineage: index-*-vessel-v2 (v2, vessel theme).
// Source: design-files/.extracted/kp-vessel-3/form-pattern/index-*-vessel-v2.html
//
// The form pattern is a family of field types (input / select / textarea / selectables /
// password). This story covers the core, reusable fields. Each field is a `.ds-form`
// wrapper with data-ds-variant per type. The error state adds `ds-form__error-field` to
// the control and renders an error list (the vendor JS builds this; we render it
// statically when `error` is set). Specialized fields (password strength, selectable
// tiles) are deferred.

import { ensurePatternStyles, assetUrl, el, uid } from '../pattern-utils.js';

const PATTERN = 'form';
const errorIcon = assetUrl(PATTERN, 'assets/images/errorcirclesmall.svg');

function errorList(id, message) {
  return `<div class="error-description">
      <ul id="${id}" role="presentation">
        <li><span class="inline-error-icon" aria-hidden="true"><img src="${errorIcon}" alt="" width="16" height="16"></span> ${message}</li>
      </ul>
    </div>`;
}

function renderTextInput({
  label = 'Label', value = '', helperText = '', error = '', disabled = false,
} = {}) {
  ensurePatternStyles(PATTERN);
  const id = uid('text-input');
  const helperId = `${id}-helper`;
  const errId = `${id}-error`;
  const describedBy = [helperText ? helperId : '', error ? errId : ''].filter(Boolean).join(' ');

  return el(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="input" data-ds-version="2">
      <label for="${id}">${label}</label>
      <div>
        <input type="text" id="${id}" value="${value}" autocomplete="on"
               class="${error ? 'ds-form__error-field' : ''}" ${disabled ? 'disabled' : ''}
               ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
        ${helperText ? `<span id="${helperId}" class="ds-form__text-input-helper">${helperText}</span>` : ''}
        ${error ? errorList(errId, error) : ''}
      </div>
    </div>
  `);
}

function renderSelect({ label = 'Label', placeholder = 'Choose an option', options = [] } = {}) {
  ensurePatternStyles(PATTERN);
  const id = uid('select-menu');
  const opts = options
    .map((o) => `<option value="${o}">${o}</option>`)
    .join('');
  return el(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="select" data-ds-version="2">
      <label for="${id}">${label}</label>
      <div class="select-one">
        <select id="${id}">
          <option value="" disabled hidden selected>${placeholder}</option>
          ${opts}
        </select>
      </div>
    </div>
  `);
}

function renderTextarea({
  label = 'Label', lines = 3, value = '', error = '',
} = {}) {
  ensurePatternStyles(PATTERN);
  const id = uid('text-area');
  const errId = `${id}-error`;
  return el(`
    <div class="ds-form" data-ds-theme="vessel" data-ds-variant="text-area" data-ds-version="2">
      <label for="${id}">${label}</label>
      <textarea id="${id}" data-show-lines="${lines}" autocomplete="on"
                class="ds-form__text-area_global${error ? ' ds-form__error-field' : ''}"
                ${error ? `aria-describedby="${errId}"` : ''}>${value}</textarea>
      ${error ? errorList(errId, error) : ''}
    </div>
  `);
}

export default {
  title: 'Components/Form',
};

// --- Text input ---
export const TextInput = {
  render: (a) => renderTextInput(a),
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text', description: 'Error message (empty = no error).' },
    disabled: { control: 'boolean' },
  },
  args: { label: 'Label', value: '', helperText: '', error: '', disabled: false },
};

export const TextInputWithHelper = {
  ...TextInput,
  args: { ...TextInput.args, helperText: 'Helper text for input field' },
};

export const TextInputWithError = {
  ...TextInput,
  args: { ...TextInput.args, value: 'invalid@', error: 'Please enter a valid email address.' },
};

export const TextInputDisabled = { ...TextInput, args: { ...TextInput.args, disabled: true, value: 'Disabled' } };

// --- Select ---
export const Select = {
  render: (a) => renderSelect(a),
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    options: { control: 'object' },
  },
  args: { label: 'Label', placeholder: 'Choose an option', options: ['Option 1', 'Option 2', 'Option 3'] },
};

// --- Textarea ---
export const Textarea = {
  render: (a) => renderTextarea(a),
  argTypes: {
    label: { control: 'text' },
    lines: { control: { type: 'number', min: 1, max: 10 } },
    value: { control: 'text' },
    error: { control: 'text' },
  },
  args: { label: 'Label', lines: 3, value: '', error: '' },
};

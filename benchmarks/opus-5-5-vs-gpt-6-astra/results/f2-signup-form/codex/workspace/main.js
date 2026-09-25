import './styles.css';
import countries from './countries.json';
import { fieldIds, validate, passwordStrength, getToday } from './validation.mjs';

const form = document.querySelector('#signup-form');
const fields = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id)]));
const errorElements = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(`error-${id}`)]));
const touched = new Set();
let submitted = false;

for (const country of countries) {
  fields.country.add(new Option(country.name, country.code));
}

function getValues() {
  return Object.fromEntries(fieldIds.map((id) => [id, id === 'terms' ? fields[id].checked : fields[id].value]));
}

function updateErrors() {
  const errors = validate(getValues(), getToday());
  for (const id of fieldIds) {
    const message = submitted || touched.has(id) ? errors[id] : '';
    if (errorElements[id].textContent !== message) errorElements[id].textContent = message;
    fields[id].setAttribute('aria-invalid', String(Boolean(message)));
  }
  fields.birthDate.classList.toggle('has-value', Boolean(fields.birthDate.value));
  return errors;
}

function updateStrength() {
  const { label } = passwordStrength(fields.password.value);
  const levels = { '': 0, Weak: 1, Fair: 2, Strong: 3, 'Very strong': 4 };
  document.querySelector('#password-strength').textContent = label;
  document.querySelector('.strength-row').dataset.level = levels[label];
}

for (const id of fieldIds) {
  fields[id].addEventListener('blur', () => {
    touched.add(id);
    updateErrors();
  });
  fields[id].addEventListener('input', () => {
    updateErrors();
    if (id === 'password') updateStrength();
  });
  fields[id].addEventListener('change', updateErrors);
}

for (const toggle of document.querySelectorAll('.visibility-toggle')) {
  toggle.addEventListener('click', () => {
    const field = fields[toggle.getAttribute('aria-controls')];
    const showing = field.type === 'password';
    field.type = showing ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(showing));
    toggle.setAttribute('aria-label', `${showing ? 'Hide' : 'Show'} ${field.id === 'confirm' ? 'confirm password' : 'password'}`);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitted = true;
  const errors = updateErrors();
  const firstInvalid = fieldIds.find((id) => errors[id]);
  if (firstInvalid) {
    fields[firstInvalid].focus();
    return;
  }

  const { username, email, birthDate, country } = getValues();
  const success = document.createElement('section');
  success.className = 'success-view';
  success.dataset.testid = 'success';
  success.setAttribute('aria-labelledby', 'form-title');
  success.innerHTML = `<div class="success-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="section-number">02 <span>/</span> A NEW BEGINNING</div><h2 id="form-title" tabindex="-1"></h2><p>You’re all set. Here’s to new connections<br>and a little room to grow.</p><p class="details-label">YOUR SIGN-UP DETAILS</p><pre data-testid="payload"></pre>`;
  success.querySelector('h2').textContent = `Welcome, ${username}!`;
  success.querySelector('pre').textContent = JSON.stringify({ username, email: email.trim().toLowerCase(), birthDate, country }, null, 2);
  document.querySelector('#form-content').replaceChildren(success);
  document.querySelector('.form-topline').innerHTML = '<span class="topline-dot"></span> LOOKS LIKE YOU’RE RIGHT WHERE YOU BELONG';
  success.querySelector('h2').focus();
});

const termsDialog = document.querySelector('#terms-dialog');
document.querySelector('#read-terms').addEventListener('click', () => termsDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => termsDialog.close());
document.querySelector('#terms-done').addEventListener('click', () => termsDialog.close());
termsDialog.addEventListener('click', (event) => {
  if (event.target === termsDialog) {
    const rect = termsDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) termsDialog.close();
  }
});

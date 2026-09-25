import takenUsernameList from '../taken-usernames.json';
import {
  FIELD_IDS,
  buildPayload,
  createUsernameSet,
  passwordStrength,
  resolveToday,
  validateForm,
} from './validation.js';

const form = document.getElementById('signup-form');
const successTemplate = document.getElementById('success-template');
const strengthMeter = document.getElementById('password-strength');
const strengthLabel = strengthMeter.querySelector('[data-testid="strength"]');
const takenUsernames = createUsernameSet(takenUsernameList);

/** Each field's control and error element, in form order. */
const fields = new Map(
  FIELD_IDS.map((id) => [
    id,
    {
      control: document.getElementById(id),
      error: document.querySelector(`[data-testid="error-${id}"]`),
    },
  ]),
);

/**
 * Fields whose errors are on display: those that have lost focus at least once, and
 * every field after the first submit attempt. Other fields stay quiet while invalid.
 */
const touched = new Set();

function readValues() {
  const valueOf = (id) => fields.get(id).control.value;
  return {
    username: valueOf('username'),
    email: valueOf('email'),
    password: valueOf('password'),
    confirm: valueOf('confirm'),
    birthDate: valueOf('birthDate'),
    country: valueOf('country'),
    terms: fields.get('terms').control.checked,
  };
}

/** Re-validates everything, so errors that depend on other fields stay current. */
function render() {
  const errors = validateForm(readValues(), {
    takenUsernames,
    today: resolveToday(window.location.search),
  });
  for (const [id, { control, error }] of fields) {
    showError(control, error, touched.has(id) ? errors[id] : '');
  }
  renderStrength();

  // Lets CSS grey out an empty date field's "dd/mm/yyyy" like a placeholder. A partly
  // typed date has an empty value too, but reports badInput.
  const { control: birthDate } = fields.get('birthDate');
  birthDate.classList.toggle('is-empty', birthDate.value === '' && !birthDate.validity.badInput);

  return errors;
}

function showError(control, error, message) {
  if (error.textContent !== message) error.textContent = message;

  // The error goes first in the description, ahead of any hint.
  const describedBy = (control.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id !== '' && id !== error.id);
  if (message) describedBy.unshift(error.id);

  if (describedBy.length > 0) control.setAttribute('aria-describedby', describedBy.join(' '));
  else control.removeAttribute('aria-describedby');

  if (message) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
}

function renderStrength() {
  const { level, label } = passwordStrength(fields.get('password').control.value);
  if (strengthLabel.textContent !== label) strengthLabel.textContent = label;
  strengthMeter.dataset.level = String(level);
}

/** Focuses a control and scrolls its whole field, label included, into view. */
function focusField(control) {
  control.focus({ preventScroll: true });
  control.closest('.field').scrollIntoView({ block: 'nearest' });
}

function showSuccess(values) {
  const payload = buildPayload(values);
  const success = successTemplate.content.firstElementChild.cloneNode(true);
  const title = success.querySelector('[data-success-title]');
  title.textContent = `Welcome, ${payload.username}!`;
  success.querySelector('[data-testid="payload"]').textContent = JSON.stringify(payload, null, 2);
  success.querySelector('[data-start-over]').addEventListener('click', () => startOver(success));

  form.replaceWith(success);
  window.scrollTo(0, 0);
  title.focus({ preventScroll: true });
}

function startOver(success) {
  form.reset();
  touched.clear();
  success.replaceWith(form);
  render();
  fields.get('username').control.focus();
}

// Pressing the mouse on another control (the submit button, the checkbox, ...) blurs the
// current field. Showing its error right away would push that control down before the
// button is released, and the click would miss, so such errors wait for the release.
// The browser has already picked the mouseup and click targets when mouseup is dispatched.
let mouseIsDown = false;
let renderOnRelease = false;

window.addEventListener('mousedown', () => {
  mouseIsDown = true;
}, true);

// A key press also ends the wait, in case a mouseup never arrives.
for (const type of ['mouseup', 'pointercancel', 'dragend', 'keydown']) {
  window.addEventListener(type, () => {
    mouseIsDown = false;
    if (renderOnRelease) {
      renderOnRelease = false;
      render();
    }
  }, true);
}

function handleLeave(event) {
  const { id } = event.target;
  // Focus moving around inside a control (e.g. the parts of a date input) is not a blur.
  if (!fields.has(id) || event.relatedTarget === event.target) return;
  touched.add(id);
  if (mouseIsDown) renderOnRelease = true;
  else render();
}

// A real blur fires both events; scripted ones may fire only one. `blur` doesn't bubble,
// hence the capture phase.
form.addEventListener('blur', handleLeave, true);
form.addEventListener('focusout', handleLeave);

form.addEventListener('input', render);
form.addEventListener('change', render);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  for (const id of FIELD_IDS) touched.add(id);
  const errors = render();
  const firstInvalid = FIELD_IDS.find((id) => errors[id] !== '');
  if (firstInvalid) focusField(fields.get(firstInvalid).control);
  else showSuccess(readValues());
});

// The browser may have restored values (back/forward cache, reload), so sync the meter.
render();

import takenUsernames from './taken-usernames.json' with { type: 'json' };

export const fieldIds = [
  'username',
  'email',
  'password',
  'confirm',
  'birthDate',
  'country',
  'terms',
];

const taken = new Set(takenUsernames.map((username) => username.toLowerCase()));

export function getToday(search = globalThis.location?.search ?? '') {
  const parameters = new URLSearchParams(search);
  if (parameters.has('today')) return parameters.get('today');

  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function passwordStrength(password) {
  const score = [
    password.length >= 10,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const label = !password
    ? ''
    : score <= 2
      ? 'Weak'
      : score === 3
        ? 'Fair'
        : score === 4
          ? 'Strong'
          : 'Very strong';

  return { label, score };
}

function isValidEmail(email) {
  if (/\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0]) return false;
  const labels = parts[1].split('.');
  return labels.length >= 2
    && labels.every((label) => label.length > 0)
    && /^[a-zA-Z]{2,}$/.test(labels.at(-1));
}

export function validate(values, todayString = getToday()) {
  const { username, password, confirm, birthDate, country, terms } = values;
  const email = values.email.trim();
  const errors = Object.fromEntries(fieldIds.map((id) => [id, '']));

  if (!username) {
    errors.username = 'Choose a username.';
  } else if (username.length < 3 || username.length > 20) {
    errors.username = 'Use 3–20 characters.';
  } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    errors.username = 'Start with a letter, then use letters, numbers or underscores.';
  } else if (taken.has(username.toLowerCase())) {
    errors.username = 'That username is taken.';
  }

  if (!email) {
    errors.email = 'Enter your email.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Enter a password.';
  } else if (password.length < 10) {
    errors.password = 'Use at least 10 characters.';
  } else if (passwordStrength(password).score < 5) {
    errors.password = 'Add a lowercase letter, an uppercase letter, a number and a symbol.';
  } else if (username.length >= 3 && password.toLowerCase().includes(username.toLowerCase())) {
    errors.password = "Don't include your username.";
  }

  if (!confirm) {
    errors.confirm = 'Confirm your password.';
  } else if (confirm !== password) {
    errors.confirm = "Passwords don't match.";
  }

  if (!birthDate) {
    errors.birthDate = 'Enter your date of birth.';
  } else if (birthDate > todayString) {
    errors.birthDate = 'That date is in the future.';
  } else {
    const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
    const [todayYear, todayMonth, todayDay] = todayString.split('-').map(Number);
    let age = todayYear - birthYear;
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) age -= 1;
    if (age < 16) errors.birthDate = 'You must be at least 16.';
  }

  if (!country) errors.country = 'Choose your country.';
  if (!terms) errors.terms = 'Accept the terms to continue.';

  return errors;
}

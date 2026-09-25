// Validation rules for the sign-up form. Pure functions with no DOM access, so the
// same code drives the page and the unit tests.

/** Field ids in form order. On submit, focus goes to the first invalid one. */
export const FIELD_IDS = ['username', 'email', 'password', 'confirm', 'birthDate', 'country', 'terms'];

export const MESSAGES = {
  username: {
    required: 'Choose a username.',
    length: 'Use 3–20 characters.',
    format: 'Start with a letter, then use letters, numbers or underscores.',
    taken: 'That username is taken.',
  },
  email: {
    required: 'Enter your email.',
    invalid: 'Enter a valid email address.',
  },
  password: {
    required: 'Enter a password.',
    length: 'Use at least 10 characters.',
    variety: 'Add a lowercase letter, an uppercase letter, a number and a symbol.',
    containsUsername: "Don't include your username.",
  },
  confirm: {
    required: 'Confirm your password.',
    mismatch: "Passwords don't match.",
  },
  birthDate: {
    required: 'Enter your date of birth.',
    future: 'That date is in the future.',
    tooYoung: 'You must be at least 16.',
  },
  country: {
    required: 'Choose your country.',
  },
  terms: {
    required: 'Accept the terms to continue.',
  },
};

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 10;
const MINIMUM_AGE = 16;

/** Counts characters (Unicode code points), so an emoji counts as one, not two. */
export function characterCount(text) {
  return [...text].length;
}

/** Lower-cases the taken-username list once so lookups can ignore case. */
export function createUsernameSet(usernames) {
  return new Set(usernames.map((name) => name.toLowerCase()));
}

export function validateUsername(username, takenUsernames = new Set()) {
  if (username === '') return MESSAGES.username.required;
  const length = characterCount(username);
  if (length < USERNAME_MIN_LENGTH || length > USERNAME_MAX_LENGTH) return MESSAGES.username.length;
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(username)) return MESSAGES.username.format;
  if (takenUsernames.has(username.toLowerCase())) return MESSAGES.username.taken;
  return '';
}

/** Checks an already trimmed address against the rules in the spec. */
export function isValidEmail(email) {
  if (/\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local === '') return false;
  const labels = domain.split('.');
  return (
    labels.length >= 2 &&
    labels.every((label) => label !== '') &&
    /^[A-Za-z]{2,}$/.test(labels[labels.length - 1])
  );
}

export function validateEmail(email) {
  const trimmed = email.trim();
  if (trimmed === '') return MESSAGES.email.required;
  if (!isValidEmail(trimmed)) return MESSAGES.email.invalid;
  return '';
}

/**
 * The five password traits shared by the rules and the strength meter. Letters and
 * digits are recognised in any script; a symbol is anything that is neither.
 */
export function passwordTraits(password) {
  return {
    longEnough: characterCount(password) >= PASSWORD_MIN_LENGTH,
    lowercase: /\p{Ll}/u.test(password),
    uppercase: /\p{Lu}/u.test(password),
    digit: /\p{Nd}/u.test(password),
    symbol: /[^\p{L}\p{Nd}]/u.test(password),
  };
}

export function validatePassword(password, username = '') {
  if (password === '') return MESSAGES.password.required;
  const { longEnough, lowercase, uppercase, digit, symbol } = passwordTraits(password);
  if (!longEnough) return MESSAGES.password.length;
  if (!(lowercase && uppercase && digit && symbol)) return MESSAGES.password.variety;
  if (
    characterCount(username) >= USERNAME_MIN_LENGTH &&
    password.toLowerCase().includes(username.toLowerCase())
  ) {
    return MESSAGES.password.containsUsername;
  }
  return '';
}

/** Level 0 (empty) to 4 (very strong), with the label shown next to the meter. */
export function passwordStrength(password) {
  if (password === '') return { level: 0, label: '' };
  const met = Object.values(passwordTraits(password)).filter(Boolean).length;
  if (met <= 2) return { level: 1, label: 'Weak' };
  if (met === 3) return { level: 2, label: 'Fair' };
  if (met === 4) return { level: 3, label: 'Strong' };
  return { level: 4, label: 'Very strong' };
}

export function validateConfirm(confirm, password) {
  if (confirm === '') return MESSAGES.confirm.required;
  if (confirm !== password) return MESSAGES.confirm.mismatch;
  return '';
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parses a `YYYY-MM-DD` string into a calendar date, or returns null if it isn't a real date. */
export function parseIsoDate(text) {
  const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** "Today" is the `today` query parameter when it holds a valid date, else the local date. */
export function resolveToday(search = '', now = new Date()) {
  const param = new URLSearchParams(search).get('today');
  const fromUrl = param === null ? null : parseIsoDate(param.trim());
  return fromUrl ?? { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function compareDates(a, b) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Whole years between the two dates; the age goes up on the birthday itself. */
export function ageOn(birth, today) {
  const hadBirthday =
    today.month > birth.month || (today.month === birth.month && today.day >= birth.day);
  return today.year - birth.year - (hadBirthday ? 0 : 1);
}

export function validateBirthDate(birthDate, today) {
  const birth = parseIsoDate(birthDate);
  if (birth === null) return MESSAGES.birthDate.required;
  if (compareDates(birth, today) > 0) return MESSAGES.birthDate.future;
  if (ageOn(birth, today) < MINIMUM_AGE) return MESSAGES.birthDate.tooYoung;
  return '';
}

export function validateCountry(country) {
  return country === '' ? MESSAGES.country.required : '';
}

export function validateTerms(accepted) {
  return accepted ? '' : MESSAGES.terms.required;
}

/** Returns every field's current error message; an empty string means the field is valid. */
export function validateForm(values, { takenUsernames, today }) {
  return {
    username: validateUsername(values.username, takenUsernames),
    email: validateEmail(values.email),
    password: validatePassword(values.password, values.username),
    confirm: validateConfirm(values.confirm, values.password),
    birthDate: validateBirthDate(values.birthDate, today),
    country: validateCountry(values.country),
    terms: validateTerms(values.terms),
  };
}

/** The data a real sign-up would send. The password is deliberately left out. */
export function buildPayload(values) {
  return {
    username: values.username,
    email: values.email.trim().toLowerCase(),
    birthDate: values.birthDate,
    country: values.country,
  };
}

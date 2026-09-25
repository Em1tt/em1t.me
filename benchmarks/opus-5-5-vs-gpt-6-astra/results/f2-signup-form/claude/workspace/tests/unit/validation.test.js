import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  FIELD_IDS,
  MESSAGES,
  ageOn,
  buildPayload,
  createUsernameSet,
  isValidEmail,
  parseIsoDate,
  passwordStrength,
  resolveToday,
  validateBirthDate,
  validateConfirm,
  validateCountry,
  validateEmail,
  validateForm,
  validatePassword,
  validateTerms,
  validateUsername,
} from '../../src/validation.js';

const takenList = JSON.parse(readFileSync(new URL('../../taken-usernames.json', import.meta.url), 'utf8'));
const taken = createUsernameSet(takenList);
const today = { year: 2026, month: 9, day: 25 };

/** Runs one test per [input, expected message] pair; '' means valid. */
function cases(name, check, table) {
  describe(name, () => {
    for (const [input, expected] of table) {
      test(`${JSON.stringify(input)} -> ${expected || 'valid'}`, () => {
        assert.equal(check(input), expected);
      });
    }
  });
}

test('messages match the spec text exactly', () => {
  assert.equal(MESSAGES.username.length, 'Use 3–20 characters.');
  assert.equal(MESSAGES.password.containsUsername, "Don't include your username.");
  assert.equal(MESSAGES.confirm.mismatch, "Passwords don't match.");
  assert.equal(
    MESSAGES.password.variety,
    'Add a lowercase letter, an uppercase letter, a number and a symbol.',
  );
});

test('field order', () => {
  assert.deepEqual(FIELD_IDS, ['username', 'email', 'password', 'confirm', 'birthDate', 'country', 'terms']);
});

cases('validateUsername', (value) => validateUsername(value, taken), [
  ['', MESSAGES.username.required],
  ['a', MESSAGES.username.length],
  ['ab', MESSAGES.username.length],
  ['abc', ''],
  ['a'.repeat(20), ''],
  ['a'.repeat(21), MESSAGES.username.length],
  ['1abc', MESSAGES.username.format],
  ['_abc', MESSAGES.username.format],
  [' abc', MESSAGES.username.format],
  ['abc ', MESSAGES.username.format],
  ['ab c', MESSAGES.username.format],
  ['ab-c', MESSAGES.username.format],
  ['jürgen', MESSAGES.username.format],
  ['   ', MESSAGES.username.format],
  ['1a', MESSAGES.username.length], // the length rule comes before the format rule
  ['River_Song_42', ''],
  ['admin', MESSAGES.username.taken],
  ['ADMIN', MESSAGES.username.taken],
  ['tidepool', MESSAGES.username.taken],
  ['Jan_Novak', MESSAGES.username.taken],
  ['admins', ''],
  ['maria1', ''],
]);

describe('validateUsername counts characters, not UTF-16 units', () => {
  test('two emoji are two characters', () => {
    assert.equal(validateUsername('😀😀', taken), MESSAGES.username.length);
  });
});

cases('validateEmail', validateEmail, [
  ['', MESSAGES.email.required],
  ['   ', MESSAGES.email.required],
  ['a@b.co', ''],
  ['  a@b.co  ', ''],
  ['First.Last+tag@Example.COM', ''],
  ['a@b.c.de', ''],
  ['a@b-c.io', ''],
  ['plainaddress', MESSAGES.email.invalid],
  ['@b.co', MESSAGES.email.invalid],
  ['a@', MESSAGES.email.invalid],
  ['a@b', MESSAGES.email.invalid],
  ['a@b.', MESSAGES.email.invalid],
  ['a@.co', MESSAGES.email.invalid],
  ['a@b..co', MESSAGES.email.invalid],
  ['a@b.c', MESSAGES.email.invalid],
  ['a@b.c0', MESSAGES.email.invalid],
  ['a@b.co1', MESSAGES.email.invalid],
  ['a@b.12', MESSAGES.email.invalid],
  ['a@@b.co', MESSAGES.email.invalid],
  ['a@b@c.co', MESSAGES.email.invalid],
  ['a b@c.co', MESSAGES.email.invalid],
  ['a@b c.co', MESSAGES.email.invalid],
  ['a\t@b.co', MESSAGES.email.invalid],
]);

test('isValidEmail expects trimmed input', () => {
  assert.equal(isValidEmail(' a@b.co'), false);
  assert.equal(isValidEmail('a@b.co'), true);
});

cases('validatePassword without a username', (value) => validatePassword(value, ''), [
  ['', MESSAGES.password.required],
  ['Ab1!', MESSAGES.password.length],
  ['Abcdefgh1', MESSAGES.password.length],
  ['abcdefghij', MESSAGES.password.variety],
  ['ABCDEFGHI1!', MESSAGES.password.variety],
  ['abcdefghi1!', MESSAGES.password.variety],
  ['Abcdefghij!', MESSAGES.password.variety],
  ['Abcdefghi12', MESSAGES.password.variety],
  ['Abcdefgh1!', ''],
  ['Correct horse 9', ''], // a space counts as a symbol
  ['Ünïcødé-pw1', ''], // letters in any script count as letters
]);

describe('validatePassword with a username', () => {
  test('rejects a password containing the username, ignoring case', () => {
    assert.equal(validatePassword('xxRIVERxx1!', 'river'), MESSAGES.password.containsUsername);
    assert.equal(validatePassword('River2026!!', 'RIVER'), MESSAGES.password.containsUsername);
  });
  test('allows it when the username is shorter than 3 characters', () => {
    assert.equal(validatePassword('Abcdefgh1!', 'ab'), '');
  });
  test('applies once the username reaches 3 characters, even if it is invalid', () => {
    assert.equal(validatePassword('Abcdefgh1!', 'abc'), MESSAGES.password.containsUsername);
    assert.equal(validatePassword('Xy 1!abcdefg', 'y 1'), MESSAGES.password.containsUsername);
  });
  test('earlier rules win', () => {
    assert.equal(validatePassword('river', 'river'), MESSAGES.password.length);
    assert.equal(validatePassword('riverriver', 'river'), MESSAGES.password.variety);
  });
});

cases('passwordStrength', (value) => passwordStrength(value).label, [
  ['', ''],
  ['a', 'Weak'],
  ['aA', 'Weak'],
  ['abcdefghij', 'Weak'],
  ['aA1', 'Fair'],
  ['abcdefghiJ', 'Fair'],
  ['aA1!', 'Strong'],
  ['abcdefghJ1', 'Strong'],
  ['aA1!aaaaaa', 'Very strong'],
  ['!!!!', 'Weak'],
]);

test('passwordStrength levels', () => {
  assert.deepEqual(
    ['', 'a', 'aA1', 'aA1!', 'aA1!aaaaaa'].map((value) => passwordStrength(value).level),
    [0, 1, 2, 3, 4],
  );
});

describe('validateConfirm', () => {
  test('empty', () => assert.equal(validateConfirm('', 'Abcdefgh1!'), MESSAGES.confirm.required));
  test('different', () => assert.equal(validateConfirm('Abcdefgh1?', 'Abcdefgh1!'), MESSAGES.confirm.mismatch));
  test('case matters', () => assert.equal(validateConfirm('abcdefgh1!', 'Abcdefgh1!'), MESSAGES.confirm.mismatch));
  test('password empty', () => assert.equal(validateConfirm('x', ''), MESSAGES.confirm.mismatch));
  test('same', () => assert.equal(validateConfirm('Abcdefgh1!', 'Abcdefgh1!'), ''));
});

cases('validateBirthDate (today is 2026-09-25)', (value) => validateBirthDate(value, today), [
  ['', MESSAGES.birthDate.required],
  ['2026-09-26', MESSAGES.birthDate.future],
  ['2030-01-01', MESSAGES.birthDate.future],
  ['2026-09-25', MESSAGES.birthDate.tooYoung],
  ['2010-09-26', MESSAGES.birthDate.tooYoung], // turns 16 tomorrow
  ['2010-09-25', ''], // 16th birthday today
  ['2010-09-24', ''],
  ['2010-10-01', MESSAGES.birthDate.tooYoung],
  ['1990-02-28', ''],
  ['1900-01-01', ''],
]);

describe('ageOn', () => {
  test('age goes up on the birthday', () => {
    assert.equal(ageOn({ year: 2000, month: 5, day: 10 }, { year: 2016, month: 5, day: 9 }), 15);
    assert.equal(ageOn({ year: 2000, month: 5, day: 10 }, { year: 2016, month: 5, day: 10 }), 16);
  });
  test('29 February birthdays count from 1 March in common years', () => {
    const birth = { year: 2008, month: 2, day: 29 };
    assert.equal(ageOn(birth, { year: 2025, month: 2, day: 28 }), 16);
    assert.equal(ageOn(birth, { year: 2024, month: 2, day: 28 }), 15);
    assert.equal(ageOn(birth, { year: 2024, month: 2, day: 29 }), 16);
    assert.equal(ageOn({ year: 2011, month: 2, day: 28 }, { year: 2027, month: 2, day: 28 }), 16);
  });
});

describe('parseIsoDate', () => {
  test('valid dates', () => {
    assert.deepEqual(parseIsoDate('2026-09-25'), { year: 2026, month: 9, day: 25 });
    assert.deepEqual(parseIsoDate('2024-02-29'), { year: 2024, month: 2, day: 29 });
  });
  test('invalid dates', () => {
    for (const text of ['', '2026-9-25', '2026-13-01', '2026-00-10', '2025-02-29', '2026-04-31', 'tomorrow', '2026-09-25T00:00']) {
      assert.equal(parseIsoDate(text), null, text);
    }
  });
});

describe('resolveToday', () => {
  const now = new Date(2031, 0, 15, 23, 59); // local time
  test('uses the today query parameter', () => {
    assert.deepEqual(resolveToday('?today=2026-09-25', now), today);
    assert.deepEqual(resolveToday('?foo=1&today=2020-02-29', now), { year: 2020, month: 2, day: 29 });
  });
  test('falls back to the local date', () => {
    const local = { year: 2031, month: 1, day: 15 };
    assert.deepEqual(resolveToday('', now), local);
    assert.deepEqual(resolveToday('?today=', now), local);
    assert.deepEqual(resolveToday('?today=soon', now), local);
    assert.deepEqual(resolveToday('?today=2026-02-30', now), local);
  });
});

test('validateCountry and validateTerms', () => {
  assert.equal(validateCountry(''), MESSAGES.country.required);
  assert.equal(validateCountry('SK'), '');
  assert.equal(validateTerms(false), MESSAGES.terms.required);
  assert.equal(validateTerms(true), '');
});

describe('validateForm and buildPayload', () => {
  const values = {
    username: 'River_Song',
    email: '  River@Example.COM ',
    password: 'Tardis-2026!',
    confirm: 'Tardis-2026!',
    birthDate: '1990-05-17',
    country: 'GB',
    terms: true,
  };

  test('a complete form has no errors', () => {
    const errors = validateForm(values, { takenUsernames: taken, today });
    assert.deepEqual(Object.values(errors), Array(7).fill(''));
    assert.deepEqual(Object.keys(errors), FIELD_IDS);
  });

  test('an empty form reports the first rule of every field', () => {
    const empty = { username: '', email: '', password: '', confirm: '', birthDate: '', country: '', terms: false };
    assert.deepEqual(validateForm(empty, { takenUsernames: taken, today }), {
      username: MESSAGES.username.required,
      email: MESSAGES.email.required,
      password: MESSAGES.password.required,
      confirm: MESSAGES.confirm.required,
      birthDate: MESSAGES.birthDate.required,
      country: MESSAGES.country.required,
      terms: MESSAGES.terms.required,
    });
  });

  test('the payload trims and lower-cases the email and leaves out the password', () => {
    const payload = buildPayload(values);
    assert.deepEqual(payload, {
      username: 'River_Song',
      email: 'river@example.com',
      birthDate: '1990-05-17',
      country: 'GB',
    });
    assert.deepEqual(Object.keys(payload), ['username', 'email', 'birthDate', 'country']);
    assert.ok(!JSON.stringify(payload).includes(values.password));
  });
});

import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

export { expect };

const readJson = (file) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));

export const countries = readJson('countries.json');

export const FIELD_IDS = ['username', 'email', 'password', 'confirm', 'birthDate', 'country', 'terms'];

/** The date used as "today" unless a test says otherwise. */
export const TODAY = '2026-09-25';

// Written out again rather than imported from src/, so the tests check the spec's wording.
export const MSG = {
  username: {
    required: 'Choose a username.',
    length: 'Use 3–20 characters.',
    format: 'Start with a letter, then use letters, numbers or underscores.',
    taken: 'That username is taken.',
  },
  email: { required: 'Enter your email.', invalid: 'Enter a valid email address.' },
  password: {
    required: 'Enter a password.',
    length: 'Use at least 10 characters.',
    variety: 'Add a lowercase letter, an uppercase letter, a number and a symbol.',
    containsUsername: "Don't include your username.",
  },
  confirm: { required: 'Confirm your password.', mismatch: "Passwords don't match." },
  birthDate: {
    required: 'Enter your date of birth.',
    future: 'That date is in the future.',
    tooYoung: 'You must be at least 16.',
  },
  country: { required: 'Choose your country.' },
  terms: { required: 'Accept the terms to continue.' },
};

export const VALID = {
  username: 'River_Song',
  email: 'river@example.com',
  password: 'Tardis-2026!',
  birthDate: '1990-05-17',
  country: 'GB',
};

/** Fails the test on uncaught page errors and console errors. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`);
    });
    await use(page);
    expect(problems).toEqual([]);
  },
});

export async function open(page, today = TODAY) {
  await page.goto(today === null ? '/' : `/?today=${today}`);
}

export const errorOf = (page, id) => page.getByTestId(`error-${id}`);

/** Fills every field, valid by default. `confirm` follows `password` unless given. */
export async function fillForm(page, overrides = {}) {
  const values = { ...VALID, terms: true, ...overrides };
  values.confirm ??= values.password;
  await page.locator('#username').fill(values.username);
  await page.locator('#email').fill(values.email);
  await page.locator('#password').fill(values.password);
  await page.locator('#confirm').fill(values.confirm);
  await page.locator('#birthDate').fill(values.birthDate);
  await page.locator('#country').selectOption(values.country);
  await page.locator('#terms').setChecked(values.terms);
  return values;
}

/** Makes a field show its errors by focusing and leaving it. */
export async function touch(page, id) {
  await page.locator(`#${id}`).focus();
  await page.locator(`#${id}`).blur();
}

/** Types each value into a touched field and checks the error that is shown right away. */
export async function expectErrors(page, id, table) {
  await touch(page, id);
  for (const [value, message] of table) {
    await page.locator(`#${id}`).fill(value);
    await expect(errorOf(page, id), `${id} = ${JSON.stringify(value)}`).toHaveText(message);
  }
}

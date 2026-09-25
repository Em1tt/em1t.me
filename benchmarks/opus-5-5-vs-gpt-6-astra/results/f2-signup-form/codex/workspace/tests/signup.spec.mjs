import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const countries = JSON.parse(readFileSync(new URL('../countries.json', import.meta.url), 'utf8'));
const takenUsernames = JSON.parse(readFileSync(new URL('../taken-usernames.json', import.meta.url), 'utf8'));
const fieldIds = ['username', 'email', 'password', 'confirm', 'birthDate', 'country', 'terms'];
const requiredErrors = {
  username: 'Choose a username.',
  email: 'Enter your email.',
  password: 'Enter a password.',
  confirm: 'Confirm your password.',
  birthDate: 'Enter your date of birth.',
  country: 'Choose your country.',
  terms: 'Accept the terms to continue.',
};

async function checkError(page, id, message) {
  const error = page.getByTestId(`error-${id}`);
  await expect(error).toHaveText(message);
  if (message) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'true');
    const errorId = await error.getAttribute('id');
    expect(errorId).toBeTruthy();
    const description = await page.locator(`#${id}`).getAttribute('aria-describedby');
    expect((description || '').split(/\s+/)).toContain(errorId);
  }
}

async function touch(page, id) {
  await page.locator(`#${id}`).focus();
  await page.locator(`#${id}`).blur();
}

async function fillValidForm(page) {
  await page.locator('#username').fill('Lena_204');
  await page.locator('#email').fill('  LENA@EXAMPLE.COM  ');
  await page.locator('#password').fill('Copper!River27');
  await page.locator('#confirm').fill('Copper!River27');
  await page.locator('#birthDate').fill('1994-06-15');
  await page.locator('#country').selectOption('SK');
  await page.locator('#terms').check();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?today=2026-09-25');
});

test('fields, labels, country data and empty initial feedback match the contract', async ({ page }) => {
  const actualOrder = await page.locator(fieldIds.map((id) => `#${id}`).join(',')).evaluateAll((fields) => fields.map((field) => field.id));
  expect(actualOrder).toEqual(fieldIds);
  for (const id of fieldIds) {
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.getByTestId(`error-${id}`)).toHaveCount(1);
    await checkError(page, id, '');
    const labels = await page.locator(`#${id}`).evaluate((field) => [...field.labels].map((label) => ({
      text: label.textContent.trim(),
      visible: Boolean(label.getClientRects().length),
    })));
    expect(labels.some((label) => label.text && label.visible)).toBe(true);
  }
  await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  await expect(page.locator('#confirm')).toHaveAttribute('type', 'password');
  await expect(page.locator('#birthDate')).toHaveAttribute('type', 'date');
  await expect(page.locator('#terms')).toHaveAttribute('type', 'checkbox');
  await expect(page.getByLabel('I accept the terms', { exact: true })).toBeVisible();
  const options = await page.locator('#country option').evaluateAll((entries) => entries.map((option) => ({
    code: option.value,
    name: option.textContent,
  })));
  expect(options).toEqual([{ code: '', name: 'Choose a country' }, ...countries]);
  await expect(page.locator('#country')).toHaveValue('');
  await expect(page.getByTestId('strength')).toHaveText('');
  await expect(page.getByTestId('submit')).toBeEnabled();
});

test('feedback waits for blur, then follows input without another blur', async ({ page }) => {
  await page.locator('#username').fill('1');
  await checkError(page, 'username', '');
  await touch(page, 'username');
  await checkError(page, 'username', 'Use 3–20 characters.');
  await page.locator('#username').fill('1user');
  await checkError(page, 'username', 'Start with a letter, then use letters, numbers or underscores.');
  await page.locator('#username').fill('Free_user');
  await checkError(page, 'username', '');
  await page.locator('#username').fill('');
  await checkError(page, 'username', requiredErrors.username);
  await checkError(page, 'email', '');
  await checkError(page, 'password', '');
});

test('username checks run in order, enforce both limits, and compare taken names ignoring case', async ({ page }) => {
  await touch(page, 'username');
  const cases = [
    ['', 'Choose a username.'],
    ['1', 'Use 3–20 characters.'],
    ['a'.repeat(21), 'Use 3–20 characters.'],
    ['1abc', 'Start with a letter, then use letters, numbers or underscores.'],
    ['ab-c', 'Start with a letter, then use letters, numbers or underscores.'],
    ['abc ', 'Start with a letter, then use letters, numbers or underscores.'],
    ['éclair', 'Start with a letter, then use letters, numbers or underscores.'],
    ['Zxy', ''],
    ['Z'.repeat(20), ''],
    ['Zxy_123', ''],
  ];
  for (const [value, message] of cases) {
    await page.locator('#username').fill(value);
    await checkError(page, 'username', message);
  }
  for (const username of takenUsernames) {
    await page.locator('#username').fill(username.toUpperCase());
    await checkError(page, 'username', 'That username is taken.');
  }
});

test('email follows the specified trimmed address and domain rules', async ({ page }) => {
  await touch(page, 'email');
  const invalidAddresses = ['plain', '@example.com', 'a@@example.com', 'a@localhost', 'a@.com', 'a@example..com', 'a@example.c', 'a@example.c1', 'a b@example.com', 'a@example .com'];
  for (const value of ['', '   ']) {
    await page.locator('#email').fill(value);
    await checkError(page, 'email', 'Enter your email.');
  }
  for (const value of invalidAddresses) {
    await page.locator('#email').fill(value);
    await checkError(page, 'email', 'Enter a valid email address.');
  }
  for (const value of ['  A@EXAMPLE.COM  ', 'first+tag@sub.example.co', 'a@1.ab']) {
    await page.locator('#email').fill(value);
    await checkError(page, 'email', '');
  }
});

test('password applies ordered rules and revalidates when username changes', async ({ page }) => {
  await page.locator('#username').fill('Atlas');
  await touch(page, 'password');
  const cases = [
    ['', 'Enter a password.'],
    ['Atlas1!', 'Use at least 10 characters.'],
    ['atlas123456!', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
    ['ATLAS123456!', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
    ['AtlasSecure!', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
    ['AtlasSecure1', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
    ['aTLAS!Secure97', "Don't include your username."],
    ['Copper!River27', ''],
    ['Copper River27', ''],
  ];
  for (const [value, message] of cases) {
    await page.locator('#password').fill(value);
    await checkError(page, 'password', message);
  }
  await page.locator('#username').fill('COPPER');
  await checkError(page, 'password', "Don't include your username.");
  await page.locator('#username').fill('Co');
  await checkError(page, 'password', '');
});

test('confirmation stays untouched until blur and updates when either password changes', async ({ page }) => {
  await page.locator('#password').fill('Copper!River27');
  await checkError(page, 'confirm', '');
  await touch(page, 'confirm');
  await checkError(page, 'confirm', 'Confirm your password.');
  await page.locator('#confirm').fill('different');
  await checkError(page, 'confirm', "Passwords don't match.");
  await page.locator('#confirm').fill('Copper!River27');
  await checkError(page, 'confirm', '');
  await page.locator('#password').fill('Birch!Valley38');
  await checkError(page, 'confirm', "Passwords don't match.");
  await page.locator('#password').fill('Copper!River27');
  await checkError(page, 'confirm', '');
});

test('strength counts the five properties independently of validity and touched state', async ({ page }) => {
  const cases = [
    ['', ''],
    ['a', 'Weak'],
    ['aA', 'Weak'],
    ['aA1', 'Fair'],
    ['aA1!', 'Strong'],
    ['abcdefghij', 'Weak'],
    ['Abcdefghij', 'Fair'],
    ['Abcdefghi1', 'Strong'],
    ['Abcdefgh1!', 'Very strong'],
    ['', ''],
  ];
  for (const [value, strength] of cases) {
    await page.locator('#password').fill(value);
    await expect(page.getByTestId('strength')).toHaveText(strength);
    await checkError(page, 'password', '');
  }
});

test('date validation respects the query date, future dates and the exact sixteenth birthday', async ({ page }) => {
  await page.goto('/?today=2031-04-12');
  await touch(page, 'birthDate');
  const cases = [
    ['', 'Enter your date of birth.'],
    ['2031-04-13', 'That date is in the future.'],
    ['2031-04-12', 'You must be at least 16.'],
    ['2015-04-13', 'You must be at least 16.'],
    ['2015-04-12', ''],
    ['2015-04-11', ''],
    ['2016-01-01', 'You must be at least 16.'],
  ];
  for (const [value, message] of cases) {
    await page.locator('#birthDate').fill(value);
    await checkError(page, 'birthDate', message);
  }
});

test('date validation falls back to the browser local date', async ({ page }) => {
  await page.goto('/');
  const { birthday, tomorrow } = await page.evaluate(() => {
    const now = new Date();
    const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      birthday: format(new Date(now.getFullYear() - 16, now.getMonth(), now.getDate())),
      tomorrow: format(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
    };
  });
  await touch(page, 'birthDate');
  await page.locator('#birthDate').fill(tomorrow);
  await checkError(page, 'birthDate', 'That date is in the future.');
  await page.locator('#birthDate').fill(birthday);
  await checkError(page, 'birthDate', '');
});

test('country and terms show required feedback on blur and clear on change', async ({ page }) => {
  await touch(page, 'country');
  await checkError(page, 'country', 'Choose your country.');
  await page.locator('#country').selectOption('JP');
  await checkError(page, 'country', '');
  await touch(page, 'terms');
  await checkError(page, 'terms', 'Accept the terms to continue.');
  await page.locator('#terms').check();
  await checkError(page, 'terms', '');
  await page.locator('#terms').uncheck();
  await checkError(page, 'terms', 'Accept the terms to continue.');
});

test('invalid submits expose all errors and focus the first invalid field in order', async ({ page }) => {
  const submit = page.getByTestId('submit');
  await expect(submit).toBeEnabled();
  await submit.click();
  for (const id of fieldIds) await checkError(page, id, requiredErrors[id]);
  await expect(page.locator('#username')).toBeFocused();
  const corrections = [
    () => page.locator('#username').fill('Lena_204'),
    () => page.locator('#email').fill('lena@example.com'),
    () => page.locator('#password').fill('Copper!River27'),
    () => page.locator('#confirm').fill('Copper!River27'),
    () => page.locator('#birthDate').fill('1994-06-15'),
    () => page.locator('#country').selectOption('SK'),
  ];
  for (let index = 0; index < corrections.length; index += 1) {
    await corrections[index]();
    await checkError(page, fieldIds[index], '');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.locator(`#${fieldIds[index + 1]}`)).toBeFocused();
  }
  await expect(submit).toBeEnabled();
});

test('successful submission replaces the form and returns only the normalized public payload', async ({ page }) => {
  await fillValidForm(page);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('success')).toContainText('Welcome, Lena_204!');
  const payloadText = await page.getByTestId('payload').textContent();
  expect(JSON.parse(payloadText)).toEqual({
    username: 'Lena_204',
    email: 'lena@example.com',
    birthDate: '1994-06-15',
    country: 'SK',
  });
  await expect(page.locator('pre[data-testid="payload"]')).toHaveCount(1);
  expect(payloadText).not.toContain('Copper!River27');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('#password')).toHaveCount(0);
  await expect(page.locator('#confirm')).toHaveCount(0);
});

test('phone layout has no horizontal overflow before or after validation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const checkWidth = async () => {
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  };
  await checkWidth();
  await page.getByTestId('submit').click();
  await checkWidth();
  await page.locator('#username').fill('1invalid');
  await page.locator('#password').fill('alllowercase');
  await checkWidth();
  for (const id of fieldIds) await expect(page.locator(`#${id}`)).toBeVisible();
});

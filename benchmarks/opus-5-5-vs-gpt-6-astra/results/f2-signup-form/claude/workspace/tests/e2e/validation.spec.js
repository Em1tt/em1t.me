import {
  FIELD_IDS,
  MSG,
  countries,
  errorOf,
  expect,
  expectErrors,
  open,
  test,
  touch,
} from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe('page structure', () => {
  test('has every field, in order, with a visible label', async ({ page }) => {
    const ids = await page.locator('form input, form select').evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(FIELD_IDS);

    const labels = {
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirm: 'Confirm password',
      birthDate: 'Date of birth',
      country: 'Country',
      terms: 'I accept the terms',
    };
    for (const [id, text] of Object.entries(labels)) {
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
      await expect(label).toHaveText(text);
      await expect(page.getByLabel(text, { exact: true })).toHaveId(id);
    }
  });

  test('uses the right kind of control for each field', async ({ page }) => {
    await expect(page.locator('#username')).toHaveAttribute('type', 'text');
    expect(['email', 'text']).toContain(await page.locator('#email').getAttribute('type'));
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirm')).toHaveAttribute('type', 'password');
    await expect(page.locator('#birthDate')).toHaveAttribute('type', 'date');
    expect(await page.locator('#country').evaluate((el) => el.tagName)).toBe('SELECT');
    await expect(page.locator('#terms')).toHaveAttribute('type', 'checkbox');
  });

  test('lists a placeholder and then every country, in file order', async ({ page }) => {
    const options = await page
      .locator('#country option')
      .evaluateAll((els) => els.map((el) => ({ value: el.value, text: el.textContent })));
    expect(options).toEqual([
      { value: '', text: 'Choose a country' },
      ...countries.map(({ code, name }) => ({ value: code, text: name })),
    ]);
    await expect(page.locator('#country')).toHaveValue('');
  });

  test('starts with every error element present and empty', async ({ page }) => {
    for (const id of FIELD_IDS) {
      await expect(errorOf(page, id)).toHaveCount(1);
      await expect(errorOf(page, id)).toBeEmpty();
      await expect(page.locator(`#${id}`)).not.toHaveAttribute('aria-invalid', 'true');
    }
    await expect(page.getByTestId('strength')).toHaveCount(1);
    await expect(page.getByTestId('strength')).toBeEmpty();
  });

  test('has an enabled submit button, also after a failed submit', async ({ page }) => {
    const submit = page.getByTestId('submit');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(submit).toBeEnabled();
  });
});

test.describe('when errors appear', () => {
  test('an invalid value shows no error until the field loses focus', async ({ page }) => {
    await page.locator('#username').fill('ab');
    await page.locator('#email').pressSequentially('not-an-email');
    await expect(errorOf(page, 'email')).toBeEmpty();
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.length); // it lost focus

    await page.locator('#email').blur();
    await expect(errorOf(page, 'email')).toHaveText(MSG.email.invalid);
  });

  test('tabbing out of an empty field shows its error, and only its error', async ({ page }) => {
    await page.locator('#username').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#email')).toBeFocused();
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.required);
    for (const id of FIELD_IDS.slice(1)) await expect(errorOf(page, id)).toBeEmpty();
  });

  test('clicking outside a field counts as leaving it', async ({ page }) => {
    await page.locator('#username').fill('ab');
    await page.mouse.click(4, 4);
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.length);
  });

  test('scripted blur and focusout events count as leaving a field', async ({ page }) => {
    await page.locator('#username').fill('ab');
    await page.locator('#username').dispatchEvent('blur');
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.length);

    await page.locator('#email').fill('ab');
    await page.locator('#email').dispatchEvent('focusout');
    await expect(errorOf(page, 'email')).toHaveText(MSG.email.invalid);
  });

  test('once shown, the error follows every keystroke', async ({ page }) => {
    await page.locator('#username').fill('a');
    await page.locator('#username').blur();
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.length);

    await page.locator('#username').focus();
    await page.keyboard.press('End');
    await page.keyboard.type('bc');
    await expect(errorOf(page, 'username')).toBeEmpty();
    await page.keyboard.type('!');
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.format);
    await page.keyboard.press('Backspace');
    await expect(errorOf(page, 'username')).toBeEmpty();
  });

  test('a field with an error is marked invalid and described by the error', async ({ page }) => {
    const email = page.locator('#email');
    await email.fill('nope');
    await email.blur();

    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const errorId = await errorOf(page, 'email').getAttribute('id');
    expect(errorId).toBeTruthy();
    expect((await email.getAttribute('aria-describedby')).split(/\s+/)).toContain(errorId);

    await email.fill('nope@example.com');
    await expect(errorOf(page, 'email')).toBeEmpty();
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('after a submit attempt every field shows its error and aria state', async ({ page }) => {
    await page.getByTestId('submit').click();
    for (const id of FIELD_IDS) {
      const control = page.locator(`#${id}`);
      const error = errorOf(page, id);
      await expect(error).not.toBeEmpty();
      await expect(control).toHaveAttribute('aria-invalid', 'true');
      const errorId = await error.getAttribute('id');
      expect((await control.getAttribute('aria-describedby')).split(/\s+/)).toContain(errorId);
    }
  });

  test('after a submit attempt, errors update without the field being focused', async ({ page }) => {
    await page.getByTestId('submit').click();
    await expect(errorOf(page, 'country')).toHaveText(MSG.country.required);
    await page.locator('#country').selectOption('PT');
    await expect(errorOf(page, 'country')).toBeEmpty();
    await expect(page.locator('#country')).not.toHaveAttribute('aria-invalid', 'true');
    await page.locator('#country').selectOption('');
    await expect(errorOf(page, 'country')).toHaveText(MSG.country.required);
  });
});

test.describe('rules', () => {
  test('username', async ({ page }) => {
    await expectErrors(page, 'username', [
      ['', MSG.username.required],
      ['a', MSG.username.length],
      ['ab', MSG.username.length],
      ['a'.repeat(21), MSG.username.length],
      ['1a', MSG.username.length],
      ['abc', ''],
      ['a'.repeat(20), ''],
      ['1abc', MSG.username.format],
      ['_abc', MSG.username.format],
      [' abc', MSG.username.format],
      ['ab c', MSG.username.format],
      ['ab-c', MSG.username.format],
      ['jürgen', MSG.username.format],
      ['admin', MSG.username.taken],
      ['ADMIN', MSG.username.taken],
      ['tidepool', MSG.username.taken],
      ['Test_User', MSG.username.taken],
      ['River_Song42', ''],
    ]);
  });

  test('email', async ({ page }) => {
    await expectErrors(page, 'email', [
      ['', MSG.email.required],
      ['   ', MSG.email.required],
      ['plain', MSG.email.invalid],
      ['a@b', MSG.email.invalid],
      ['a@b.c', MSG.email.invalid],
      ['a@b.c1', MSG.email.invalid],
      ['a@b.', MSG.email.invalid],
      ['a@.co', MSG.email.invalid],
      ['a@b..co', MSG.email.invalid],
      ['@b.co', MSG.email.invalid],
      ['a@@b.co', MSG.email.invalid],
      ['a@b@c.co', MSG.email.invalid],
      ['a b@c.co', MSG.email.invalid],
      ['a@b.co', ''],
      ['  First.Last+tag@Mail.Example.ORG  ', ''],
    ]);
  });

  test('password', async ({ page }) => {
    await expectErrors(page, 'password', [
      ['', MSG.password.required],
      ['Ab1!', MSG.password.length],
      ['Abcdefgh1', MSG.password.length],
      ['abcdefghij', MSG.password.variety],
      ['ABCDEFGH1!', MSG.password.variety],
      ['Abcdefghi!', MSG.password.variety],
      ['Abcdefghi1', MSG.password.variety],
      ['Abcdefgh1!', ''],
      ['Correct horse 9', ''],
    ]);
  });

  test('password must not contain a username of 3+ characters', async ({ page }) => {
    await page.locator('#username').fill('ab');
    await expectErrors(page, 'password', [['xxAbcdef1!', '']]);

    // The password error follows changes to the username.
    await page.locator('#username').fill('ABC');
    await expect(errorOf(page, 'password')).toHaveText(MSG.password.containsUsername);
    await page.locator('#username').fill('river');
    await expect(errorOf(page, 'password')).toBeEmpty();
    await page.locator('#password').fill('My-River-2026');
    await expect(errorOf(page, 'password')).toHaveText(MSG.password.containsUsername);
  });

  test('confirm password, including when the password changes', async ({ page }) => {
    await page.locator('#password').fill('Abcdefgh1!');
    await expectErrors(page, 'confirm', [
      ['', MSG.confirm.required],
      ['Abcdefgh1', MSG.confirm.mismatch],
      ['abcdefgh1!', MSG.confirm.mismatch],
      ['Abcdefgh1!', ''],
    ]);
    await page.locator('#password').fill('Abcdefgh1?');
    await expect(errorOf(page, 'confirm')).toHaveText(MSG.confirm.mismatch);
    await page.locator('#password').fill('Abcdefgh1!');
    await expect(errorOf(page, 'confirm')).toBeEmpty();
  });

  test('date of birth, with today from the URL', async ({ page }) => {
    await expectErrors(page, 'birthDate', [
      ['', MSG.birthDate.required],
      ['2026-09-26', MSG.birthDate.future],
      ['2031-01-01', MSG.birthDate.future],
      ['2026-09-25', MSG.birthDate.tooYoung],
      ['2010-09-26', MSG.birthDate.tooYoung],
      ['2010-09-25', ''], // 16th birthday today
      ['1990-05-17', ''],
    ]);
  });

  test('date of birth with a different today', async ({ page }) => {
    await open(page, '2030-03-01');
    await expectErrors(page, 'birthDate', [
      ['2014-03-02', MSG.birthDate.tooYoung],
      ['2014-03-01', ''],
      ['2030-03-01', MSG.birthDate.tooYoung],
      ['2030-03-02', MSG.birthDate.future],
      ['2026-09-26', MSG.birthDate.tooYoung],
    ]);
  });

  for (const [name, today] of [
    ['without a today parameter', null],
    ['with an invalid today parameter', 'someday'],
  ]) {
    test(`date of birth uses the local date ${name}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(2026, 8, 25, 12, 0));
      await open(page, today);
      await expectErrors(page, 'birthDate', [
        ['2026-09-26', MSG.birthDate.future],
        ['2010-09-26', MSG.birthDate.tooYoung],
        ['2010-09-25', ''],
      ]);
    });
  }

  test('country', async ({ page }) => {
    await touch(page, 'country');
    await expect(errorOf(page, 'country')).toHaveText(MSG.country.required);
    await page.locator('#country').selectOption('SK');
    await expect(errorOf(page, 'country')).toBeEmpty();
    await page.locator('#country').selectOption({ label: 'Choose a country' });
    await expect(errorOf(page, 'country')).toHaveText(MSG.country.required);
  });

  test('terms', async ({ page }) => {
    await touch(page, 'terms');
    await expect(errorOf(page, 'terms')).toHaveText(MSG.terms.required);
    await page.getByLabel('I accept the terms').check();
    await expect(errorOf(page, 'terms')).toBeEmpty();
    await page.getByLabel('I accept the terms').uncheck();
    await expect(errorOf(page, 'terms')).toHaveText(MSG.terms.required);
  });
});

test.describe('password strength', () => {
  test('rates the password as it is typed', async ({ page }) => {
    const strength = page.getByTestId('strength');
    const password = page.locator('#password');
    for (const [value, label] of [
      ['', ''],
      ['a', 'Weak'],
      ['aA', 'Weak'],
      ['abcdefghij', 'Weak'],
      ['!!!!', 'Weak'],
      ['aA1', 'Fair'],
      ['abcdefghiJ', 'Fair'],
      ['aA1!', 'Strong'],
      ['abcdefghJ1', 'Strong'],
      ['aA1!aaaaaa', 'Very strong'],
      ['', ''],
    ]) {
      await password.fill(value);
      await expect(strength, JSON.stringify(value)).toHaveText(label);
    }
  });

  test('updates on each keystroke', async ({ page }) => {
    const strength = page.getByTestId('strength');
    await page.locator('#password').focus();
    const steps = [
      ['a', 'Weak'],
      ['B', 'Weak'],
      ['3', 'Fair'],
      ['$', 'Strong'],
      ['cdefgh', 'Very strong'],
    ];
    for (const [keys, label] of steps) {
      await page.keyboard.type(keys);
      await expect(strength).toHaveText(label);
    }
    await expect(strength).toBeVisible();
  });
});

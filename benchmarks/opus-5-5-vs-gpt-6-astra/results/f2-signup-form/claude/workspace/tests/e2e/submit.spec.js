import { FIELD_IDS, MSG, VALID, errorOf, expect, fillForm, open, test } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe('submitting an invalid form', () => {
  test('shows every error and focuses the first field', async ({ page }) => {
    await page.getByTestId('submit').click();

    const expected = {
      username: MSG.username.required,
      email: MSG.email.required,
      password: MSG.password.required,
      confirm: MSG.confirm.required,
      birthDate: MSG.birthDate.required,
      country: MSG.country.required,
      terms: MSG.terms.required,
    };
    for (const [id, message] of Object.entries(expected)) {
      await expect(errorOf(page, id)).toHaveText(message);
    }
    await expect(page.locator('#username')).toBeFocused();
    await expect(page.getByTestId('success')).toHaveCount(0);
  });

  const cases = [
    ['email', { email: 'river@example' }],
    ['password', { password: 'river-song-2026', confirm: 'river-song-2026' }],
    ['confirm', { confirm: 'Tardis-2026?' }],
    ['birthDate', { birthDate: '2012-01-01' }],
    ['country', { country: '' }],
    ['terms', { terms: false }],
  ];
  for (const [firstInvalid, overrides] of cases) {
    test(`focuses ${firstInvalid} when it is the first invalid field`, async ({ page }) => {
      await fillForm(page, overrides);
      await page.getByTestId('submit').click();
      await expect(page.locator(`#${firstInvalid}`)).toBeFocused();
      for (const id of FIELD_IDS) {
        if (id === firstInvalid) await expect(errorOf(page, id)).not.toBeEmpty();
        else await expect(errorOf(page, id)).toBeEmpty();
      }
    });
  }

  test('focuses the first invalid field in form order, not the last one touched', async ({ page }) => {
    await fillForm(page, { username: 'admin', country: '' });
    await page.getByTestId('submit').click();
    await expect(page.locator('#username')).toBeFocused();
    await expect(errorOf(page, 'username')).toHaveText(MSG.username.taken);
    await expect(errorOf(page, 'country')).toHaveText(MSG.country.required);
  });

  // Leaving a field with the mouse shows its error; if that happened before the mouse
  // button came back up, the submit button would move away from the pointer and the
  // click would be lost.
  test('one click on submit is enough when leaving the terms reveals their error', async ({ page }) => {
    await fillForm(page, { terms: false });
    await page.locator('#terms').focus(); // no error until it loses focus
    await page.getByTestId('submit').click();

    await expect(errorOf(page, 'terms')).toHaveText(MSG.terms.required);
    await expect(page.locator('#terms')).toBeFocused(); // the submit moved focus back here
  });

  test('one click on submit is enough when leaving a field reveals an error', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1600 }); // no scrolling, so nothing absorbs the shift
    // The date is filled last, so it still has focus and has not shown its error yet.
    await fillForm(page, { birthDate: '2012-01-01', terms: false });
    await expect(page.locator('#birthDate')).toBeFocused();
    await expect(errorOf(page, 'birthDate')).toBeEmpty();
    await page.getByTestId('submit').click();

    // The terms were never touched, so their error proves the submit went through.
    await expect(errorOf(page, 'terms')).toHaveText(MSG.terms.required);
    await expect(errorOf(page, 'birthDate')).toHaveText(MSG.birthDate.tooYoung);
    await expect(page.locator('#birthDate')).toBeFocused();
  });

  test('one click ticks the checkbox when leaving a field reveals an error above it', async ({ page }) => {
    await page.locator('#birthDate').fill('2012-01-01');
    await page.locator('#terms').click();
    await expect(page.locator('#terms')).toBeChecked();
    await expect(errorOf(page, 'birthDate')).toHaveText(MSG.birthDate.tooYoung);
  });

  test('can be fixed and submitted again', async ({ page }) => {
    await fillForm(page, { terms: false });
    await page.getByTestId('submit').click();
    await expect(page.locator('#terms')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(errorOf(page, 'terms')).toBeEmpty();
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('success')).toBeVisible();
  });
});

test.describe('submitting a valid form', () => {
  test('replaces the form with a welcome message and the payload', async ({ page }) => {
    const values = await fillForm(page, { email: '  River.Song@Example.COM  ' });
    await page.getByTestId('submit').click();

    const success = page.getByTestId('success');
    await expect(success).toBeVisible();
    await expect(success).toContainText(`Welcome, ${VALID.username}!`);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('#username')).toHaveCount(0);

    const payload = success.getByTestId('payload');
    expect(await payload.evaluate((el) => el.tagName)).toBe('PRE');
    const json = JSON.parse(await payload.textContent());
    expect(json).toEqual({
      username: 'River_Song',
      email: 'river.song@example.com',
      birthDate: '1990-05-17',
      country: 'GB',
    });
    expect(Object.keys(json)).toEqual(['username', 'email', 'birthDate', 'country']);
    expect(await success.textContent()).not.toContain(values.password);
    expect(await page.content()).not.toContain(values.password);
  });

  test('keeps the username exactly as typed', async ({ page }) => {
    await fillForm(page, { username: 'MiXeD_Case_9', password: 'Tardis-2026!' });
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('success')).toContainText('Welcome, MiXeD_Case_9!');
    const json = JSON.parse(await page.getByTestId('payload').textContent());
    expect(json.username).toBe('MiXeD_Case_9');
  });

  test('can be submitted with the Enter key', async ({ page }) => {
    await fillForm(page);
    await page.locator('#confirm').press('Enter');
    await expect(page.getByTestId('success')).toContainText(`Welcome, ${VALID.username}!`);
  });

  test('accepts someone on their 16th birthday', async ({ page }) => {
    await fillForm(page, { birthDate: '2010-09-25' });
    await page.getByTestId('submit').click();
    const json = JSON.parse(await page.getByTestId('payload').textContent());
    expect(json.birthDate).toBe('2010-09-25');
  });

  test('can start over with an empty form', async ({ page }) => {
    await fillForm(page);
    await page.getByTestId('submit').click();
    await page.getByRole('button', { name: 'Start over' }).click();

    await expect(page.getByTestId('success')).toHaveCount(0);
    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#username')).toBeFocused();
    await expect(page.getByTestId('strength')).toBeEmpty();
    for (const id of FIELD_IDS) await expect(errorOf(page, id)).toBeEmpty();
  });
});

test.describe('layout', () => {
  const horizontalOverflow = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  for (const width of [390, 320]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.getByTestId('submit').click();
      await page.locator('#username').fill('a'.repeat(40));
      await page.locator('#password').fill('Abcdefgh1!');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await fillForm(page, {
        username: 'Abcdefghijklmnopqrst',
        email: `${'very.long.address'.repeat(4)}@${'subdomain.'.repeat(4)}example.com`,
      });
      await page.getByTestId('submit').click();
      await expect(page.getByTestId('success')).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});

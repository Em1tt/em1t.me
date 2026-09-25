# Task: sign-up form with validation

Build a sign-up page with client-side validation. There is no server: a valid submission just
shows a success message.

You may use any framework or none. The deliverable is a static build:

- `npm run build` must produce `dist/index.html` (plus any assets it needs).
- The site must work when `dist/` is served by a plain static file server at the root URL (`/`).
- When you finish, the `dist/` folder must be built and up to date.

Automated browser tests will check the behaviour below exactly, so follow the names, texts and
attributes precisely. `countries.json` and `taken-usernames.json` in this folder are data you
need; bundle them or copy them into `dist/`.

## Fields

Each field has a visible `<label>`, and these ids, in this order:

| Field            | Element                                     | id          |
| ---------------- | ------------------------------------------- | ----------- |
| Username         | text input                                  | `username`  |
| Email            | email or text input                         | `email`     |
| Password         | password input                              | `password`  |
| Confirm password | password input                              | `confirm`   |
| Date of birth    | `<input type="date">`                       | `birthDate` |
| Country          | `<select>`                                  | `country`   |
| Terms            | checkbox, "I accept the terms"              | `terms`     |

The country `<select>` starts with a placeholder option with value `""` ("Choose a country"),
followed by one option per entry in `countries.json`, in that order, with the code as its value
and the name as its text.

The submit button has `data-testid="submit"` and is never disabled.

## Errors

Each field has an error element with `data-testid="error-<id>"` (e.g. `error-username`) that
always exists in the page. While a field has no error to show, its error element is empty.

A field's error is shown after the field has lost focus once, or after the first submit attempt.
From then on it updates as the user types. Before that, it stays empty even if the value is
invalid.

A field with an error showing has `aria-invalid="true"` and an `aria-describedby` that includes
the id of its error element. Only the **first** failing rule's message is shown, checking the
rules in the order listed:

**Username**
1. Empty → `Choose a username.`
2. Shorter than 3 or longer than 20 characters → `Use 3–20 characters.`
3. Doesn't start with a letter (A–Z, a–z), or contains anything but letters, digits and
   underscores → `Start with a letter, then use letters, numbers or underscores.`
4. In `taken-usernames.json`, ignoring case → `That username is taken.`

**Email** (ignore leading and trailing spaces)
1. Empty → `Enter your email.`
2. Not valid → `Enter a valid email address.` A valid email has no spaces, exactly one `@`, at
   least one character before the `@`, and after it at least two dot-separated labels that are
   each non-empty, the last one being at least two letters (A–Z, a–z).

**Password**
1. Empty → `Enter a password.`
2. Shorter than 10 characters → `Use at least 10 characters.`
3. Missing any of: a lowercase letter, an uppercase letter, a digit, a symbol (any character that
   isn't a letter or a digit) → `Add a lowercase letter, an uppercase letter, a number and a
   symbol.`
4. Contains the username, ignoring case, when the username is at least 3 characters long →
   `Don't include your username.`

**Confirm password**
1. Empty → `Confirm your password.`
2. Different from the password → `Passwords don't match.` This updates when the password
   changes, too.

**Date of birth**
1. Empty → `Enter your date of birth.`
2. After today → `That date is in the future.`
3. The person is younger than 16 today → `You must be at least 16.` Someone turns 16 on their
   16th birthday.

"Today" is the date in the page URL's `today` query parameter (`?today=2026-09-25`) if it is
there, and otherwise the user's current local date.

**Country**
1. None chosen → `Choose your country.`

**Terms**
1. Not checked → `Accept the terms to continue.`

## Password strength

An element with `data-testid="strength"` shows how strong the password is. Count how many of these
five hold: at least 10 characters, a lowercase letter, an uppercase letter, a digit, a symbol.
Empty password → empty text. Otherwise 0–2 → `Weak`, 3 → `Fair`, 4 → `Strong`, 5 → `Very strong`.
It updates as the user types.

## Submitting

- If anything is invalid: show every field's error, and move keyboard focus to the first invalid
  field, in the order of the fields table.
- If everything is valid: replace the form with an element with `data-testid="success"` that
  contains the text `Welcome, <username>!` and a `<pre data-testid="payload">` holding this JSON:
  `{"username", "email", "birthDate", "country"}` with the username as typed, the email trimmed
  and lowercased, the date as `YYYY-MM-DD` and the country code. The password must not be in it.

## Layout

It must look good and be easy to use, on a phone as well as a desktop; the visual design is up to
you. At a viewport 390 px wide, the page must not scroll sideways.

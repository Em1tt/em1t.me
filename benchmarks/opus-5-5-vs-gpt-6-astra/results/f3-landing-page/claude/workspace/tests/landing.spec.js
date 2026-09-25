// @ts-check
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PLANS = [
  { id: "free", name: "Free", monthly: "$0/mo", yearly: "$0/yr", includes: "1 list, 2 people" },
  { id: "family", name: "Family", monthly: "$4/mo", yearly: "$40/yr", includes: "Unlimited lists, 6 people, recipe import" },
  {
    id: "plus",
    name: "Plus",
    monthly: "$9/mo",
    yearly: "$90/yr",
    includes: "Everything in Family, store layouts, 12 people, priority support",
  },
];

const FEATURES = [
  ["Lists that sync instantly", "Add milk on the bus, and it's on your partner's list before they reach the checkout."],
  ["Aisle-by-aisle order", "Tidepool learns your store's layout and sorts the list the way you walk it."],
  ["Recipes to list in one tap", "Paste a recipe link and the ingredients land on the list, minus what you already have."],
];

const FAQ = [
  ["Does everyone need an account?", "Yes, each person signs in with an email address or a phone number. Invites take a few seconds."],
  ["Does it work offline?", "Yes. Changes made offline sync as soon as you're back online."],
  ["Can I cancel any time?", "Yes. Your lists stay free on the Free plan after you cancel."],
  ["Which stores does it know?", "Store layouts cover 4,000 supermarkets in Europe and North America, and grow every week."],
];

const NAV = [
  ["Features", "#features"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

test.describe("copy and structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("header shows the name and three section links", async ({ page }) => {
    await expect(page.getByRole("banner")).toContainText("Tidepool");
    // On phones the links sit behind the menu button, so include hidden ones here.
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { includeHidden: true })).toHaveCount(3);
    for (const [name, href] of NAV) {
      await expect(nav.getByRole("link", { name, exact: true, includeHidden: true })).toHaveAttribute("href", href);
    }
  });

  test("hero has the only h1, the subheadline and both calls to action", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Groceries, sorted together.");
    await expect(page.getByRole("heading", { level: 1, name: "Groceries, sorted together." })).toBeVisible();
    await expect(
      page.getByText(
        "Tidepool keeps one shopping list for the whole household, in sync on every phone, so nobody buys the third jar of mustard.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByText("Get Tidepool free", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Tidepool free" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See pricing" })).toHaveAttribute("href", "#pricing");
  });

  test("features section lists the three features", async ({ page }) => {
    const section = page.locator("section#features");
    for (const [title, text] of FEATURES) {
      await expect(section.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(section.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test("pricing section shows every plan and what it includes", async ({ page }) => {
    const section = page.locator("section#pricing");
    for (const plan of PLANS) {
      const card = section.locator("li").filter({ has: page.getByTestId(`price-${plan.id}`) });
      await expect(card.getByRole("heading", { name: plan.name, exact: true })).toBeVisible();
      await expect(card).toContainText(plan.includes);
      await expect(section.getByText(plan.includes, { exact: true })).toBeVisible();
    }
    const family = section.locator("li").filter({ has: page.getByTestId("price-family") });
    await expect(family.getByText("Most popular", { exact: true })).toBeVisible();
    await expect(page.getByText("Most popular")).toHaveCount(1);
    await expect(section.getByText("Bill yearly (2 months free)", { exact: true })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Bill yearly (2 months free)" })).toBeVisible();
    await expect(page.getByLabel("Bill yearly (2 months free)")).toBeVisible();
  });

  test("FAQ section has the four questions", async ({ page }) => {
    const section = page.locator("section#faq");
    for (const [question, answer] of FAQ) {
      await expect(section.getByRole("button", { name: question, exact: true })).toBeVisible();
      await expect(section.getByText(answer, { exact: true })).toHaveCount(1);
    }
  });

  test("footer has the copyright and three links", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText("© 2026 Tidepool");
    await expect(footer.getByText("© 2026 Tidepool", { exact: true })).toBeVisible();
    for (const name of ["Privacy", "Terms", "Contact"]) {
      await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", "#");
      await expect(page.getByRole("link", { name })).toHaveCount(1);
    }
  });

  test("key elements contain exactly the copy, with no stray whitespace", async ({ page }) => {
    const textOf = (locator) => locator.evaluate((element) => element.textContent);
    expect(await textOf(page.locator("h1"))).toBe("Groceries, sorted together.");
    expect(await textOf(page.getByRole("button", { name: "Get Tidepool free" }))).toBe("Get Tidepool free");
    expect(await textOf(page.getByRole("link", { name: "See pricing" }))).toBe("See pricing");
    expect(await textOf(page.getByTestId("billing-toggle"))).toBe("Bill yearly (2 months free)");
    for (const [question] of FAQ) {
      expect(await textOf(page.getByRole("button", { name: question }))).toBe(question);
    }
    for (const plan of PLANS) {
      expect(await textOf(page.getByTestId(`price-${plan.id}`))).toBe(plan.monthly);
    }
  });

  test("landmarks and headings are unique where they should be", async ({ page }) => {
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("nav")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.getByText("Get Tidepool free")).toHaveCount(1);
  });
});

test.describe("pricing toggle", () => {
  test("switches all prices between monthly and yearly", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("billing-toggle");

    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(toggle).not.toBeChecked();
    for (const plan of PLANS) await expect(page.getByTestId(`price-${plan.id}`)).toHaveText(plan.monthly);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(toggle).toBeChecked();
    for (const plan of PLANS) await expect(page.getByTestId(`price-${plan.id}`)).toHaveText(plan.yearly);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    for (const plan of PLANS) await expect(page.getByTestId(`price-${plan.id}`)).toHaveText(plan.monthly);
  });

  test("works from the keyboard", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("billing-toggle");
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("price-family")).toHaveText("$40/yr");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("price-family")).toHaveText("$4/mo");
  });
});

test.describe("FAQ", () => {
  test("every answer starts collapsed and toggles with its question", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator("#faq button");
    await expect(buttons).toHaveCount(FAQ.length);

    for (const [index, [, answerText]] of FAQ.entries()) {
      const button = buttons.nth(index);
      const answerId = await button.getAttribute("aria-controls");
      expect(answerId).toBeTruthy();
      const answer = page.locator(`[id="${answerId}"]`);

      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(answer).toBeHidden();
      await expect(answer).toHaveText(answerText);

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(answer).toBeVisible();
      expect(await answer.isVisible()).toBe(true);

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(answer).toBeHidden();
    }
  });

  test("answers open independently", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: FAQ[0][0] }).click();
    await page.getByRole("button", { name: FAQ[1][0] }).click();
    await expect(page.getByText(FAQ[0][1])).toBeVisible();
    await expect(page.getByText(FAQ[1][1])).toBeVisible();
  });
});

test.describe("navigation", () => {
  for (const width of [320, 360, 390, 767]) {
    test(`links are behind the menu button at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const button = page.getByTestId("menu-button");
      const links = page.getByRole("navigation").getByRole("link", { includeHidden: true });

      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      for (const link of await links.all()) await expect(link).toBeHidden();

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      for (const link of await links.all()) await expect(link).toBeVisible();

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      for (const link of await links.all()) await expect(link).toBeHidden();
    });
  }

  test("the menu closes after choosing a link and on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const button = page.getByTestId("menu-button");
    const nav = page.getByRole("navigation");

    await button.click();
    await nav.getByRole("link", { name: "FAQ" }).click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "FAQ" })).toBeHidden();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator("#faq")).toBeInViewport();

    await button.click();
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  test("controls respond to taps on touch screens", async ({ page, hasTouch }) => {
    test.skip(!hasTouch, "needs a touch screen");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByTestId("menu-button");
    await menuButton.tap();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Features" })).toBeVisible();

    await page.getByTestId("billing-toggle").tap();
    await expect(page.getByTestId("price-plus")).toHaveText("$90/yr");

    const question = page.getByRole("button", { name: FAQ[3][0] });
    await question.tap();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(FAQ[3][1])).toBeVisible();
  });

  for (const width of [768, 1024, 1280]) {
    test(`links are always visible at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await expect(page.getByTestId("menu-button")).toBeHidden();
      const links = page.getByRole("navigation").getByRole("link");
      await expect(links).toHaveCount(3);
      for (const link of await links.all()) await expect(link).toBeVisible();
    });
  }

  test("section links land below the sticky header", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByTestId("menu-button");
    if (await menuButton.isVisible()) await menuButton.click();
    await page.getByRole("navigation").getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect(page.getByTestId("billing-toggle")).toBeInViewport();
  });
});

test.describe("layout", () => {
  for (const width of [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - window.innerWidth,
      }));
      expect(overflow.doc).toBeLessThanOrEqual(0);
      expect(overflow.body).toBeLessThanOrEqual(0);

      // Opening every disclosure must not introduce overflow either.
      if (width < 768) await page.getByTestId("menu-button").click();
      for (const button of await page.locator("#faq button").all()) await button.click();
      await page.getByTestId("billing-toggle").click();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }
});

test.describe("accessibility", () => {
  for (const width of [1280, 390, 360, 768]) {
    test(`axe finds no serious or critical issues at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const results = await new AxeBuilder({ page }).analyze();
      await testInfo.attach("axe-results", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
      const blocking = results.violations
        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
      expect(blocking).toEqual([]);
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    });
  }

  test("axe also passes with the menu and every answer open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    for (const button of await page.locator("#faq button").all()) await button.click();
    await page.getByTestId("billing-toggle").click();
    await page.getByTestId("menu-button").click();
    await expect(page.getByRole("navigation").getByRole("link", { name: "FAQ" })).toBeVisible();
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  test("the get-the-app dialog is labelled, traps focus and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Get Tidepool free" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Get Tidepool on your phone" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).include("dialog").analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("delivery", () => {
  test("loads nothing from other servers and logs no errors", async ({ page, baseURL }) => {
    const origin = new URL(String(baseURL)).origin;
    const foreign = [];
    const failed = [];
    const errors = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol !== "data:" && url.origin !== origin) foreign.push(request.url());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
    }

    expect(foreign).toEqual([]);
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check('600 16px "Fraunces"'))).toBe(true);
  });
});

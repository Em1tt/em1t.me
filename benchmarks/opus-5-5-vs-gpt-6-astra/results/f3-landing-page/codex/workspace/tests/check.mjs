import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, ".browser-cache");
const { chromium } = await import("@playwright/test");
const { default: AxeBuilder } = await import("@axe-core/playwright");
const dist = path.join(root, "dist");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  const requested = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const file = path.resolve(
    dist,
    "." + (requested === "/" ? "/index.html" : requested),
  );
  if (!file.startsWith(dist + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(file);
    res.writeHead(200, {
      "content-type": types[path.extname(file)] || "application/octet-stream",
    });
    res.end(content);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
try {
  await mkdir(path.join(root, ".test-results"), { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = [];
  const failedResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(base) && !request.url().startsWith("data:"))
      externalRequests.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(
    (await page.locator("h1").innerText()).replace(/\s+/g, " "),
    "Groceries, sorted together.",
  );
  for (const [plan, price] of Object.entries({
    free: "$0/mo",
    family: "$4/mo",
    plus: "$9/mo",
  })) {
    assert.equal(await page.getByTestId(`price-${plan}`).textContent(), price);
  }
  const toggle = page.getByTestId("billing-toggle");
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-checked"), "true");
  for (const [plan, price] of Object.entries({
    free: "$0/yr",
    family: "$40/yr",
    plus: "$90/yr",
  })) {
    assert.equal(await page.getByTestId(`price-${plan}`).textContent(), price);
  }
  await toggle.focus();
  await page.keyboard.press("Space");
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  assert.equal(await page.getByTestId("price-family").textContent(), "$4/mo");
  console.log(
    "PASS: exact heading and monthly/yearly billing, including keyboard activation.",
  );

  for (const question of await page.locator(".faq-item button").all()) {
    const answer = page.locator(
      `#${await question.getAttribute("aria-controls")}`,
    );
    assert.equal(await question.getAttribute("aria-expanded"), "false");
    assert.equal(await answer.isVisible(), false);
    await question.click();
    assert.equal(await question.getAttribute("aria-expanded"), "true");
    assert.equal(await answer.isVisible(), true);
    await question.click();
    assert.equal(await answer.isVisible(), false);
  }
  console.log("PASS: all four FAQ answers start hidden and toggle correctly.");

  for (const width of [360, 390, 640, 767, 768, 800, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    if (size.scroll > size.viewport) {
      console.log(
        await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .map((el) => ({
              tag: el.tagName,
              class: el.getAttribute("class"),
              left: el.getBoundingClientRect().left,
              right: el.getBoundingClientRect().right,
            }))
            .filter((el) => el.right > innerWidth + 1 || el.left < -1),
        ),
      );
      await page.screenshot({
        path: path.join(root, `.test-results/overflow-${width}.png`),
        fullPage: true,
      });
    }
    assert.ok(
      size.scroll <= size.viewport,
      `Overflow at ${width}px: ${JSON.stringify(size)}`,
    );
    const menu = page.getByTestId("menu-button");
    assert.equal(await menu.isVisible(), width < 768);
    const links = page.locator("#main-navigation a");
    for (const link of await links.all())
      assert.equal(await link.isVisible(), width >= 768);
    if (width < 768) {
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      for (const link of await links.all())
        assert.equal(await link.isVisible(), true);
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
    }
  }
  console.log(
    "PASS: no sideways scrolling and correct navigation at 9 viewport widths.",
  );

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact),
    );
    await page.screenshot({
      path: path.join(root, `.test-results/page-${width}.png`),
      fullPage: true,
    });
    assert.deepEqual(
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      [],
      `axe violations at ${width}px`,
    );
    console.log(
      `PASS: axe accessibility scan at ${width}px; ${results.violations.length} total violations.`,
    );
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator(".hero [data-open-demo]").click();
  assert.equal(await page.locator("#list-dialog").isVisible(), true);
  await page.getByLabel("What do you need?").fill("Fresh basil");
  await page.locator("#add-item-form button").click();
  await page
    .getByRole("checkbox", { name: "Fresh basil", exact: true })
    .check();
  const demoAxe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    demoAxe.violations
      .filter((v) => ["serious", "critical"].includes(v.impact))
      .map((v) => v.id),
    [],
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#list-dialog").isVisible(), false);
  assert.equal(
    await page
      .locator(".hero [data-open-demo]")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".hero [data-open-demo]").click();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Fresh basil", exact: true })
      .isChecked(),
    true,
  );
  await page
    .getByRole("button", { name: "Remove Fresh basil", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Fresh basil", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Reset preview list" }).click();
  await page.keyboard.press("Escape");
  console.log(
    "PASS: demo list add, check, remove, persistence, reset, modal focus and accessibility.",
  );
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalRequests, []);
  assert.deepEqual(failedResponses, []);
  console.log(
    "PASS: no JavaScript errors, failed assets, or requests to external servers.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

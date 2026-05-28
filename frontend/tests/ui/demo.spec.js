import { test, expect } from "@playwright/test";

// DEMO_SPEED controls pacing: 1 = minimum (current ~2 s), 5 = default (~10 s).
// Each inter-step pause = (DEMO_SPEED - 1) × 250 ms; 8 pauses × 1000 ms adds ~8 s at speed 5.
// Override via env: DEMO_SPEED=1 make demo
const DEMO_SPEED = Math.max(1, Math.min(5, parseInt(process.env.DEMO_SPEED ?? "5", 10)));
const stepDelay = (DEMO_SPEED - 1) * 250;

// Full-feature walkthrough — produces a single continuous video covering every UI scenario.
// Mutable flags let one pair of route handlers drive all states without re-routing.
test("Cat Gallery — Full Feature Showcase", async ({ page }) => {
  const pause = () => page.waitForTimeout(stepDelay);

  const cats = [];
  let nextId = 1;
  let slowPost = false;
  let apiDown = false;

  await page.route("/api/cats", async (route) => {
    if (apiDown) {
      await route.abort("failed");
      return;
    }
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: cats.slice() });
    } else if (method === "POST") {
      if (slowPost) await new Promise((r) => setTimeout(r, 700));
      const body = await route.request().postDataJSON();
      const cat = {
        id: `cat-${nextId}`,
        name: body.name,
        image_url: `https://cataas.com/cat?id=${nextId}`,
        created_at: new Date().toISOString(),
      };
      nextId++;
      cats.push(cat);
      await route.fulfill({ status: 201, json: cat });
    } else {
      await route.continue();
    }
  });

  await page.route("/api/cats/*", async (route) => {
    if (apiDown) {
      await route.abort("failed");
      return;
    }
    const catId = route.request().url().split("/").pop();
    if (route.request().method() === "DELETE") {
      const idx = cats.findIndex((c) => c.id === catId);
      if (idx !== -1) cats.splice(idx, 1);
      await route.fulfill({ json: { message: "Cat deleted" } });
    } else {
      await route.continue();
    }
  });

  // ── 1. Page load & form visibility ──────────────────────────────────────────
  await test.step("page loads with heading and form", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /cat gallery/i })).toBeVisible();
    await expect(page.getByTestId("add-cat-form")).toBeVisible();
    await expect(page.getByTestId("cat-name-input")).toBeVisible();
    await expect(page.getByTestId("add-cat-btn")).toBeVisible();
  });
  await pause();

  // ── 2. Empty state ───────────────────────────────────────────────────────────
  await test.step("empty state shown when no cats exist", async () => {
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(page.getByTestId("empty-state")).toContainText("No cats yet");
  });
  await pause();

  // ── 3. Add cats with custom names ────────────────────────────────────────────
  await test.step("add Whiskers", async () => {
    await page.getByTestId("cat-name-input").fill("Whiskers");
    await page.getByTestId("add-cat-btn").click();
    await expect(page.getByTestId("cat-card")).toHaveCount(1);
    await expect(page.getByTestId("cat-name").first()).toContainText("Whiskers");
  });
  await pause();

  await test.step("add Luna", async () => {
    await page.getByTestId("cat-name-input").fill("Luna");
    await page.getByTestId("add-cat-btn").click();
    await expect(page.getByTestId("cat-card")).toHaveCount(2);
  });
  await pause();

  await test.step("add Shadow — grid shows three cats", async () => {
    await page.getByTestId("cat-name-input").fill("Shadow");
    await page.getByTestId("add-cat-btn").click();
    await expect(page.getByTestId("cat-grid")).toBeVisible();
    await expect(page.getByTestId("cat-card")).toHaveCount(3);
    const names = await page.getByTestId("cat-name").allTextContents();
    expect(names).toEqual(["Whiskers", "Luna", "Shadow"]);
  });
  await pause();

  // ── 4. Add cat without a name (random name) ──────────────────────────────────
  await test.step("add cat with no name uses random name", async () => {
    await page.getByTestId("add-cat-btn").click();
    await expect(page.getByTestId("cat-card")).toHaveCount(4);
  });
  await pause();

  // ── 5. Add button disabled while submitting ──────────────────────────────────
  await test.step("button disables during slow submit then re-enables", async () => {
    slowPost = true;
    const btn = page.getByTestId("add-cat-btn");
    await page.getByTestId("cat-name-input").fill("Slow Cat");
    await btn.click();
    await expect(btn).toBeDisabled();
    await expect(btn).toBeEnabled({ timeout: 3000 });
    await expect(page.getByTestId("cat-card")).toHaveCount(5);
    slowPost = false;
  });
  await pause();

  // ── 6. Delete a cat ──────────────────────────────────────────────────────────
  await test.step("delete first cat — grid shrinks to four", async () => {
    await page.getByTestId("delete-btn").first().click();
    await expect(page.getByTestId("cat-card")).toHaveCount(4);
  });
  await pause();

  // ── 7. API error state ───────────────────────────────────────────────────────
  await test.step("error banner shown when API is unreachable", async () => {
    apiDown = true;
    await page.reload();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Could not load cats");
  });
});

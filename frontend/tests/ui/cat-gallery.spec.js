import { test, expect } from "@playwright/test";

function screenshotDir(testInfo) {
  return `screenshots/${testInfo.title.replace(/\W+/g, "-").toLowerCase()}`;
}

test.describe("Cat Gallery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the page heading", async ({ page }, testInfo) => {
    await test.step("heading is visible", async () => {
      await expect(page.getByRole("heading", { name: /cat gallery/i })).toBeVisible();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/heading-visible.png` });
    });
  });

  test("shows the add cat form", async ({ page }, testInfo) => {
    await test.step("form elements are visible", async () => {
      await expect(page.getByTestId("add-cat-form")).toBeVisible();
      await expect(page.getByTestId("cat-name-input")).toBeVisible();
      await expect(page.getByTestId("add-cat-btn")).toBeVisible();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/form-visible.png` });
    });
  });

  test("shows empty state when no cats exist", async ({ page }, testInfo) => {
    // Intercept the API so we always start from an empty state
    await page.route("/api/cats", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: [] });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await test.step("empty state is shown", async () => {
      await expect(page.getByTestId("empty-state")).toBeVisible();
      await expect(page.getByTestId("empty-state")).toContainText("No cats yet");
      await page.screenshot({ path: `${screenshotDir(testInfo)}/empty-state.png` });
    });
  });

  test("adds a cat with a custom name", async ({ page }, testInfo) => {
    const catId = "test-cat-ui-add";
    const mockCat = {
      id: catId,
      name: "Playwright Cat",
      image_url: "https://cataas.com/cat?test",
      created_at: new Date().toISOString(),
    };

    // Start with empty list, then return the new cat after creation
    let catCreated = false;
    await page.route("/api/cats", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({ json: catCreated ? [mockCat] : [] });
      } else if (method === "POST") {
        catCreated = true;
        await route.fulfill({ status: 201, json: mockCat });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await test.step("empty state before add", async () => {
      await expect(page.getByTestId("empty-state")).toBeVisible();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/01-empty-state.png` });
    });

    await page.getByTestId("cat-name-input").fill("Playwright Cat");
    await test.step("form filled with cat name", async () => {
      await page.screenshot({ path: `${screenshotDir(testInfo)}/02-form-filled.png` });
    });

    await page.getByTestId("add-cat-btn").click();
    await test.step("cat appears in grid", async () => {
      await expect(page.getByTestId("cat-card")).toBeVisible();
      await expect(page.getByTestId("cat-name").first()).toContainText("Playwright Cat");
      await page.screenshot({ path: `${screenshotDir(testInfo)}/03-cat-added.png` });
    });
  });

  test("adds a cat without a name (uses random name)", async ({ page }, testInfo) => {
    let capturedBody = null;
    const mockCat = {
      id: "random-name-cat",
      name: "Whiskers",
      image_url: "https://cataas.com/cat?random",
      created_at: new Date().toISOString(),
    };

    let catCreated = false;
    await page.route("/api/cats", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({ json: catCreated ? [mockCat] : [] });
      } else if (method === "POST") {
        capturedBody = await route.request().postDataJSON();
        catCreated = true;
        await route.fulfill({ status: 201, json: mockCat });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.getByTestId("add-cat-btn").click();
    await test.step("cat appears with random name", async () => {
      await expect(page.getByTestId("cat-card")).toBeVisible();
      // A name should have been sent (the random name picker fills it in)
      expect(capturedBody?.name).toBeTruthy();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/cat-with-random-name.png` });
    });
  });

  test("deletes a cat", async ({ page }, testInfo) => {
    const catId = "cat-to-delete";
    const mockCat = {
      id: catId,
      name: "Doomed Kitty",
      image_url: "https://cataas.com/cat?delete",
      created_at: new Date().toISOString(),
    };

    let cats = [mockCat];
    await page.route("/api/cats", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: cats });
      } else {
        await route.continue();
      }
    });
    await page.route(`/api/cats/${catId}`, async (route) => {
      if (route.request().method() === "DELETE") {
        cats = [];
        await route.fulfill({ json: { message: "Cat deleted" } });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await test.step("cat is visible before deletion", async () => {
      await expect(page.getByTestId("cat-card")).toBeVisible();
      await expect(page.getByTestId("cat-name").first()).toContainText("Doomed Kitty");
      await page.screenshot({ path: `${screenshotDir(testInfo)}/01-cat-visible.png` });
    });

    await page.getByTestId("delete-btn").first().click();
    await test.step("grid is empty after deletion", async () => {
      await expect(page.getByTestId("cat-card")).not.toBeVisible();
      await expect(page.getByTestId("empty-state")).toBeVisible();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/02-after-deletion.png` });
    });
  });

  test("displays multiple cats in a grid", async ({ page }, testInfo) => {
    const mockCats = [
      { id: "1", name: "Luna", image_url: "https://cataas.com/cat?1", created_at: new Date().toISOString() },
      { id: "2", name: "Mochi", image_url: "https://cataas.com/cat?2", created_at: new Date().toISOString() },
      { id: "3", name: "Shadow", image_url: "https://cataas.com/cat?3", created_at: new Date().toISOString() },
    ];

    await page.route("/api/cats", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: mockCats });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await test.step("three cats shown in grid", async () => {
      await expect(page.getByTestId("cat-grid")).toBeVisible();
      await expect(page.getByTestId("cat-card")).toHaveCount(3);

      const names = await page.getByTestId("cat-name").allTextContents();
      expect(names).toEqual(["Luna", "Mochi", "Shadow"]);
      await page.screenshot({ path: `${screenshotDir(testInfo)}/cat-grid-three.png` });
    });
  });

  test("shows error banner when API is unreachable", async ({ page }, testInfo) => {
    await page.route("/api/cats", async (route) => {
      await route.abort("failed");
    });

    await page.reload();
    await test.step("error banner is shown", async () => {
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByRole("alert")).toContainText("Could not load cats");
      await page.screenshot({ path: `${screenshotDir(testInfo)}/error-banner.png` });
    });
  });

  test("add button is disabled while creating", async ({ page }, testInfo) => {
    // Slow the POST so we can observe the in-flight state
    await page.route("/api/cats", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 500));
        await route.fulfill({
          status: 201,
          json: { id: "slow", name: "Slow Cat", image_url: "https://cataas.com/cat?slow", created_at: new Date().toISOString() },
        });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.reload();
    await page.getByTestId("cat-name-input").fill("Slow Cat");

    const btn = page.getByTestId("add-cat-btn");
    await btn.click();
    await test.step("button is disabled during creation", async () => {
      await expect(btn).toBeDisabled();
      await page.screenshot({ path: `${screenshotDir(testInfo)}/01-button-disabled.png` });
    });
    await test.step("button re-enables after creation", async () => {
      await expect(btn).toBeEnabled({ timeout: 3000 });
      await page.screenshot({ path: `${screenshotDir(testInfo)}/02-button-enabled.png` });
    });
  });
});

# Visual Testing Plan

This document describes how we will add screenshot and video capture to our Playwright UI test suite. The mechanism is not yet implemented — this is the plan.

---

## Goals

- Capture a screenshot at key steps within each test so failures are immediately obvious without re-running
- Record a video of every test run so we can play back exactly what the browser did
- Keep artifacts organized by test name and run date so they are easy to browse

---

## Approach: Playwright built-ins

Playwright ships screenshot and video recording as first-class features — no extra libraries required.

### 1. Videos

Enable recording in `playwright.config.js` by setting `video` inside the `use` block:

```js
// playwright.config.js
use: {
  video: "on",           // "on" | "off" | "retain-on-failure" | "on-first-retry"
  // "retain-on-failure" is the recommended default for CI: keeps videos only
  // when a test fails, which avoids storing gigabytes of passing-test footage.
}
```

Videos are saved to the Playwright output directory (default: `test-results/`) automatically after each test. The HTML report (`playwright-report/`) links directly to them.

### 2. Screenshots

Two complementary approaches:

**Automatic on failure** (already wired in our config via `screenshot: "only-on-failure"`):

```js
use: {
  screenshot: "only-on-failure",  // also: "on" or "off"
}
```

**Manual at specific steps** — call `page.screenshot()` inside any test for a named capture:

```js
await page.screenshot({ path: "screenshots/after-add-cat.png" });
```

For step-by-step captures, use the `step` helper so screenshots are grouped in the report:

```js
await test.step("cat appears in grid", async () => {
  await expect(page.getByTestId("cat-card")).toBeVisible();
  await page.screenshot({ path: "screenshots/cat-in-grid.png" });
});
```

### 3. Trace Viewer

Playwright's trace viewer gives a full timeline of every action, network request, and DOM snapshot — more powerful than a static screenshot for debugging:

```js
use: {
  trace: "retain-on-failure",  // also: "on" | "off" | "on-first-retry"
}
```

View a trace locally:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## Suggested final config (when implemented)

```js
// playwright.config.js
use: {
  baseURL: "http://localhost:3000",
  screenshot: "only-on-failure",
  video: "retain-on-failure",
  trace: "retain-on-failure",
},
```

This keeps CI artifact sizes small (only failures produce videos/traces) while giving full evidence for any broken test.

---

## Viewing results

After a run, open the HTML report:

```bash
npm run test:ui:report
# opens playwright-report/index.html in the browser
```

The report embeds screenshots, links videos, and lets you open the trace viewer directly from any failed test entry.

---

## CI integration (future)

On GitHub Actions, upload the `playwright-report/` and `test-results/` directories as workflow artifacts so the team can download and inspect them without re-running locally:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-results
    path: |
      frontend/playwright-report/
      frontend/test-results/
    retention-days: 14
```

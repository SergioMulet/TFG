import { test, expect } from '@playwright/test';

// Ships are seeded in global-setup.js via MQTT before any test runs:
//   cargo-001  (cargo,  41.3851 / 2.1734)  — 3 route points
//   tanker-001 (tanker, 39.4699 / -0.3763) — 1 route point
//   yacht-001  (yacht,  43.3183 / -1.9812) — 1 route point

// 1. Real-time rendering
test('dashboard renders ships received over WebSocket', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="yacht-001"]')).toBeVisible();
});

// 2. Ship selection → details panel + route
test('selecting a ship shows its details and can draw its route', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search ship ID...' });
  await search.fill('cargo');
  await page.getByRole('banner').getByRole('button', { name: 'cargo-001' }).click();

  await expect(page.getByText("Ship's details")).toBeVisible();
  await expect(page.getByText('cargo-001')).toBeVisible();
  await expect(page.getByText('Cargo', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Display route' }).click();
  await expect(page.locator('.leaflet-overlay-pane svg')).toBeVisible();
  await expect(page.locator('.leaflet-overlay-pane path').first()).toHaveAttribute('d', /.+/);
});

// 3. Type filter
test('unchecking a ship type hides its markers and restores them on re-check', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  await page.getByRole('checkbox', { name: 'Cargo' }).click();
  await expect(page.locator('[aria-label="cargo-001"]')).not.toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  await page.getByRole('checkbox', { name: 'Cargo' }).click();
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
});

// 4. Search
test('search finds a ship by partial ID and opens the details panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search ship ID...' });
  await search.fill('tanker');

  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'tanker-001' })).toBeVisible();
  await banner.getByRole('button', { name: 'tanker-001' }).click();

  await expect(page.getByText("Ship's details")).toBeVisible();
  await expect(page.getByText('tanker-001')).toBeVisible();
});

// 5. Admin view
test('admin view shows the embedded Grafana iframe', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Admin view' }).click();

  const iframe = page.locator('iframe[title="Grafana"]');
  await expect(iframe).toBeVisible();
  const src = await iframe.getAttribute('src');
  expect(src).toContain('grafana');
});

// 6. WebSocket reconnect — tests frontend reconnect logic in isolation
test('client reconnects automatically after a server-side WebSocket drop', async ({ page }) => {
  let connectionCount = 0;
  await page.routeWebSocket('**/ws/ships', (ws) => {
    connectionCount++;
    ws.send(JSON.stringify([{ id: 'cargo-001', lat: 41.3851, lng: 2.1734, type: 'cargo' }]));
    if (connectionCount === 1) {
      setTimeout(() => ws.close(), 300);
    }
  });
  await page.goto('/');
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
  await page.waitForTimeout(4000);
  expect(connectionCount).toBeGreaterThanOrEqual(2);
});

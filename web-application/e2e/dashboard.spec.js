import { test, expect } from '@playwright/test';
import { SEED_SHIPS, SEED_DETAILS } from './fixtures.js';

// Intercept the WebSocket and immediately deliver the seed fleet.
async function routeWS(page) {
  await page.routeWebSocket('**/ws/ships', (ws) => {
    ws.send(JSON.stringify(SEED_SHIPS));
  });
}

// 1. Real-time rendering

test('dashboard renders ships received over WebSocket', async ({ page }) => {
  await routeWS(page);
  await page.goto('/');

  // All three ship markers must appear on the map.
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="yacht-001"]')).toBeVisible();

  // Counter in the toolbar reflects the fleet size.
  await expect(page.getByText('Total ships: 3')).toBeVisible();
});

// 2. Ship selection -> details panel + route

test('selecting a ship shows its details and can draw its route', async ({ page }) => {
  await routeWS(page);
  await page.route('**/api/ships/cargo-001', (route) =>
    route.fulfill({ json: SEED_DETAILS['cargo-001'] }),
  );

  await page.goto('/');
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();

  // Select via the search bar (more reliable than clicking a map marker).
  const search = page.getByRole('textbox', { name: 'Search ship ID...' });
  await search.fill('cargo');
  await page.getByRole('banner').getByRole('button', { name: 'cargo-001' }).click();

  // Details panel header appears immediately on selection.
  await expect(page.getByText("Ship's details")).toBeVisible();

  // Wait for the async /api/ships/cargo-001 call to populate the panel.
  await expect(page.getByText('cargo-001')).toBeVisible();
  await expect(page.getByText('Cargo', { exact: true })).toBeVisible(); // translated ship type

  // Click "Display route" — the mocked details include 3 route points.
  await page.getByRole('button', { name: 'Display route' }).click();

  // Leaflet renders the route as <path> elements inside an SVG overlay.
  // Check the SVG container (has real dimensions) rather than the path itself
  // (SVG paths have no box, so toBeVisible() always fails on them).
  await expect(page.locator('.leaflet-overlay-pane svg')).toBeVisible();
  await expect(page.locator('.leaflet-overlay-pane path').first()).toHaveAttribute('d', /.+/);
});

// 3. Type filter

test('unchecking a ship type hides its markers and restores them on re-check', async ({
  page,
}) => {
  await routeWS(page);
  await page.goto('/');

  // Baseline: all ships visible.
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  // Uncheck "Cargo".
  await page.getByRole('checkbox', { name: 'Cargo' }).click();

  // Cargo marker must be removed from the map; others stay.
  await expect(page.locator('[aria-label="cargo-001"]')).not.toBeVisible();
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  // Re-check "Cargo" — marker must reappear.
  await page.getByRole('checkbox', { name: 'Cargo' }).click();
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();
});

// 4. Search

test('search finds a ship by partial ID and opens the details panel', async ({
  page,
}) => {
  await routeWS(page);
  await page.route('**/api/ships/tanker-001', (route) =>
    route.fulfill({
      json: {
        ship_id: 'tanker-001',
        type: 'tanker',
        lat: 39.4699,
        lng: -0.3763,
        route: [],
        image_url: null,
      },
    }),
  );

  await page.goto('/');
  await expect(page.locator('[aria-label="tanker-001"]')).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search ship ID...' });
  await search.fill('tanker');

  // Dropdown shows the matching ship.
  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'tanker-001' })).toBeVisible();

  await banner.getByRole('button', { name: 'tanker-001' }).click();

  // Details panel opens.
  await expect(page.getByText("Ship's details")).toBeVisible();
  await expect(page.getByText('tanker-001')).toBeVisible();
});

// 5. Admin view

test('admin view shows the embedded Grafana iframe', async ({ page }) => {
  await routeWS(page);
  await page.goto('/');

  // Toggle to admin view via the toolbar button.
  await page.getByRole('button', { name: 'Admin view' }).click();

  const iframe = page.locator('iframe[title="Grafana"]');
  await expect(iframe).toBeVisible();

  const src = await iframe.getAttribute('src');
  expect(src).toContain('grafana');
});

// 6. WebSocket reconnect

test('client reconnects automatically after a server-side WebSocket drop', async ({
  page,
}) => {
  let connectionCount = 0;

  await page.routeWebSocket('**/ws/ships', (ws) => {
    connectionCount++;
    ws.send(JSON.stringify(SEED_SHIPS));

    // Drop the connection on the first attempt to simulate a server restart.
    if (connectionCount === 1) {
      setTimeout(() => ws.close(), 300);
    }
  });

  await page.goto('/');

  // Ships are visible from the first connection.
  await expect(page.locator('[aria-label="cargo-001"]')).toBeVisible();

  // shipService waits 3 s before reconnecting; 4s for safety.
  await page.waitForTimeout(4000);

  expect(connectionCount).toBeGreaterThanOrEqual(2);
});

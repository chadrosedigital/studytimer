import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('stopwatch pause, save, reload, rename, delete and promotion', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('button', { name: 'Stopwatch', exact: true }).click();
  await page.getByLabel('WHAT ARE YOU WORKING ON?').fill('Contract Law');
  await page.getByRole('button', { name: 'Start focusing' }).click();
  await page.clock.runFor(5000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('timer')).toContainText('00:00:05');
  await page.clock.runFor(10_000);
  await expect(page.getByRole('timer')).toContainText('00:00:05');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(3000);
  await page.getByRole('button', { name: 'Finish & save' }).click();
  await expect(page.locator('.session-list li')).toHaveCount(1);
  await expect(page.locator('.daily-total > strong')).toHaveText('8s');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Contract Law', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Contract Law', exact: true }).click();
  await page.getByLabel('Block name', { exact: true }).fill('Exam revision');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const link = page.getByRole('link', { name: /chadrosedigital/ });
  await expect(link).toHaveAttribute('href', 'https://chadrosedigital.co.za');
  await expect(link).toHaveAttribute('target', '_blank');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Every session adds up.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exam revision', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Exam revision' }).click();
  await expect(page.locator('.session-list li')).toHaveCount(0);
  await expect(page.locator('.stat-card').first()).toContainText('0s');
});

test('countdown completes once and saves exactly its duration', async ({ page }) => {
  await page.clock.install();
  await page.getByLabel('Minutes', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start focusing' }).click();
  await page.clock.runFor(61_000);
  await expect(page.locator('.session-list li')).toHaveCount(1);
  await expect(page.locator('.daily-total > strong')).toHaveText('1m');
  await page.clock.runFor(5000);
  await expect(page.locator('.session-list li')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Start focusing' })).toBeVisible();
});

test('hidden tab pauses; mode switch and restart can be cancelled', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('button', { name: 'Start focusing' }).click();
  await page.clock.runFor(2500);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  const time = await page.getByRole('timer').textContent();
  await page.clock.runFor(10_000);
  await expect(page.getByRole('timer')).toHaveText(time!);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Stopwatch', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Countdown', exact: true })).toHaveAttribute('aria-pressed', 'true');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Restart timer' }).click();
  await expect(page.getByRole('timer')).toHaveText(time!);
});

test('storage failure retains unsaved elapsed time for retry', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('button', { name: 'Stopwatch', exact: true }).click();
  await page.getByRole('button', { name: 'Start focusing' }).click();
  await page.clock.runFor(4000);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); }; });
  await page.getByRole('button', { name: 'Finish & save' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('timer')).toContainText('00:00:04');
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(page.locator('.session-list li')).toHaveCount(0);
});

test('responsive dashboard has no horizontal overflow and accessible controls', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 812 }, { width: 812, height: 375 }, { width: 320, height: 700 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Start focusing' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('link', { name: /chadrosedigital/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-dashboard.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/desktop-dashboard.png', fullPage: true });
});


test('desktop and history render cleanly on fresh pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/desktop-final.png', fullPage: true });
  await page.evaluate(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    localStorage.setItem('studyspace.session.v1.visual-test', JSON.stringify({
      id: 'visual-test', name: 'Contract Law', mode: 'countdown', durationMs: 1_500_000,
      startedAt: new Date(now.getTime() - 1_500_000).toISOString(), endedAt: now.toISOString(), days: { [key]: 1_500_000 },
    }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.locator('.stat-card').first()).toContainText('25m');
  await page.screenshot({ path: 'test-results/history-final.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/history-mobile.png', fullPage: true });
});

test('refresh discards unfinished time and invalid duration is blocked', async ({ page }) => {
  await page.clock.install();
  await page.getByLabel('Minutes', { exact: true }).fill('0');
  await expect(page.getByRole('button', { name: 'Start focusing' })).toBeDisabled();
  await page.getByLabel('Minutes', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start focusing' }).click();
  await page.clock.runFor(10_000);
  page.once('dialog', dialog => dialog.accept());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start focusing' })).toBeVisible();
  await expect(page.locator('.session-list li')).toHaveCount(0);
  await expect(page.locator('.daily-total > strong')).toHaveText('0s');
});

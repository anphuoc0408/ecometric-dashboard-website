export default async function run(page, ui) {
  const before = await ui.snapshot();
  const qrBtn = before.match(/@(e\d+) button "Mã QR chia sẻ"/)?.[1];
  const hasCardOnPage = (await page.locator('h2', { hasText: 'Chia sẻ EcoMetric qua mã QR' }).count());
  if (!qrBtn) return { error: 'no qr button', snapshot: before.slice(0, 900) };
  await ui.click(qrBtn);
  await page.waitForSelector('[role=dialog]');
  const dialog = page.locator('[role=dialog]');
  const res = {
    cardInPageBeforeClick: hasCardOnPage,
    dialogOpened: await dialog.count(),
    hasSVG: await dialog.locator('svg[title="Mã QR dẫn tới EcoMetric"]').count(),
    hasImageLogo: await dialog.locator('svg[title="Mã QR dẫn tới EcoMetric"] image').count(),
    hasCanvas: await dialog.locator('canvas').count(),
    canvasW: await dialog.locator('canvas').first().getAttribute('width'),
    hasDownload: await dialog.locator('button', { hasText: 'Tải xuống QR' }).count(),
    hasCopy: await dialog.locator('button', { hasText: 'Sao chép liên kết' }).count(),
    urlShown: await dialog.locator('span.truncate').first().innerText(),
  };
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  res.closedByEsc = (await page.locator('[role=dialog]').count()) === 0;
  return res;
}

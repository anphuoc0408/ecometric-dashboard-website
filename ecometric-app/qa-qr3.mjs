export default async function run(page, ui) {
  const before = await ui.snapshot();
  const ref = before.match(/@(e\d+) button "Mã QR chia sẻ"/)?.[1];
  if (!ref) return { error: 'bye', snapshot: before.slice(0, 1200) };
  await ui.click(ref);
  await page.waitForSelector('[role=dialog]');
  const info = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    const svgs = [...d.querySelectorAll('svg')];
    return {
      svgCount: svgs.length,
      details: svgs.map(s => ({ title: s.getAttribute('title'), paths: s.querySelectorAll('path,rect').length, imgs: s.querySelectorAll('image').length })),
      canvasSizes: [...d.querySelectorAll('canvas')].map(c => [c.width, c.height]),
    };
  });
  return info;
}

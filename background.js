// MV3 service worker. Capture logic lives here (not a separate file) because
// chrome.scripting.executeScript({ func }) needs a self-contained function value
// with no closures over module-level state — inlining avoids that footgun.
import { commitSnapshot } from './github.js';

async function captureInPage() {
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // skip inlining images over 2MB, keep snapshots light

  async function toDataURL(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // one slow/CDN-blocked image must not hang the whole capture
    try {
      const res = await fetch(url, { credentials: 'omit', signal: controller.signal });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (blob.size > MAX_IMAGE_BYTES) return null;
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const doc = document.cloneNode(true);

  // Inline same-origin stylesheets; cross-origin ones throw on .cssRules access
  // and are left as the original <link> (best-effort, may 404 later).
  const styleSheets = Array.from(document.styleSheets);
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  for (const link of links) {
    const sheet = styleSheets.find((s) => s.href === link.href);
    if (!sheet) continue;
    try {
      const cssText = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
      const style = doc.createElement('style');
      style.textContent = cssText;
      link.replaceWith(style);
    } catch {
      // cross-origin stylesheet, cssRules access throws — leave the <link> untouched
    }
  }

  const imgs = Array.from(doc.querySelectorAll('img[src]'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const absolute = new URL(src, document.baseURI).href;
      const dataUrl = await toDataURL(absolute);
      if (dataUrl) img.setAttribute('src', dataUrl);
    })
  );

  const base = doc.createElement('base');
  base.href = document.baseURI;
  doc.head.prepend(base);

  return {
    html: '<!doctype html>\n' + doc.documentElement.outerHTML,
    title: document.title,
    capturedAt: new Date().toISOString(),
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'CAPTURE_TAB') return false;
  (async () => {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: msg.tabId },
        func: captureInPage,
      });
      const path = await commitSnapshot({ ...result, url: msg.url, note: msg.note });
      sendResponse({ ok: true, path });
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message ?? err) });
    }
  })();
  return true; // keep the sendResponse channel open across the await
});

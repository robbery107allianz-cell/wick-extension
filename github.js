// Commits a captured snapshot to the configured GitHub repo via the Contents API.
// One file write per snapshot (.html + .json sidecar) — no branches, no PRs, just commits.

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function slugify(input) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'page'
  );
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function getConfig() {
  const { pat, owner, repo } = await chrome.storage.local.get(['pat', 'owner', 'repo']);
  if (!pat || !owner || !repo) {
    throw new Error('未配置 GitHub 仓库，请先打开插件设置页');
  }
  return { pat, owner, repo };
}

async function putFile({ pat, owner, repo }, path, contentBase64, message) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ message, content: contentBase64 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status}: ${body}`);
  }
  return res.json();
}

export async function commitSnapshot({ html, title, capturedAt, url, note }) {
  const config = await getConfig();
  const sha256 = await sha256Hex(html);
  const host = new URL(url).hostname;
  const stamp = capturedAt.replace(/[:.]/g, '-');
  const slug = slugify(title || host);
  const base = `snapshots/${host}/${stamp}-${slug}`;

  await putFile(config, `${base}.html`, toBase64(html), `index: ${url}`);

  const meta = { url, title, capturedAt, note, sha256 };
  await putFile(config, `${base}.json`, toBase64(JSON.stringify(meta, null, 2)), `index meta: ${url}`);

  return base;
}

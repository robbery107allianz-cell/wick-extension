const ownerEl = document.getElementById('owner');
const repoEl = document.getElementById('repo');
const patEl = document.getElementById('pat');
const statusEl = document.getElementById('status');

chrome.storage.local.get(['owner', 'repo', 'pat'], (cfg) => {
  ownerEl.value = cfg.owner ?? '';
  repoEl.value = cfg.repo ?? '';
  patEl.value = cfg.pat ?? '';
});

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    owner: ownerEl.value.trim(),
    repo: repoEl.value.trim(),
    pat: patEl.value.trim(),
  });
  statusEl.textContent = '已保存';
  setTimeout(() => (statusEl.textContent = ''), 1500);
});

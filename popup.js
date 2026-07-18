const urlEl = document.getElementById('url');
const noteEl = document.getElementById('note');
const statusEl = document.getElementById('status');
const captureBtn = document.getElementById('capture');

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

currentTab().then((tab) => {
  urlEl.textContent = tab?.url ?? '';
});

document.getElementById('openOptions').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  statusEl.textContent = '捕获中…';
  const tab = await currentTab();
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_TAB',
      tabId: tab.id,
      url: tab.url,
      note: noteEl.value.trim(),
    });
    if (response?.ok) {
      statusEl.textContent = `已索引：${response.path}`;
    } else {
      statusEl.textContent = `失败：${response?.error ?? '未知错误'}`;
    }
  } catch (err) {
    statusEl.textContent = `失败：${err.message}`;
  } finally {
    captureBtn.disabled = false;
  }
});

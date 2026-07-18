# wick-extension

浏览器插件源码，[Wick](../wick) 项目的捕获端。这个仓库只装插件代码，快照数据和公开索引页在姊妹仓库 `wick` 里——两者可见性完全独立，改这边不影响那边公开与否。

## 装法

1. 先按 [`wick`](../wick) 的 README 建好数据仓库、拿到 Fine-grained PAT
2. `chrome://extensions` 打开开发者模式 → Load unpacked → 选这个目录
3. 点插件图标 → 右键/长按选"选项" → 填：
   - owner：你的 GitHub 用户名
   - repo：`wick`（不是这个仓库自己）
   - PAT：上一步创建的 fine-grained token
4. 打开任意网页 → 点插件图标 → "索引这一刻"

## 文件

| 文件 | 作用 |
|---|---|
| `manifest.json` | MV3 清单 |
| `popup.html` / `popup.js` | 点击图标弹出的捕获面板 |
| `options.html` / `options.js` | 配置页：owner / repo / PAT |
| `background.js` | 捕获逻辑（DOM+样式+图片内联，v0.1 简化版）+ 收到捕获结果后调用 `github.js` 提交 |
| `github.js` | 调 GitHub Contents API，把快照 `.html` 和元数据 `.json` 各提交一次 commit |

capture 逻辑写在 `background.js` 里而不是独立文件，是因为 `chrome.scripting.executeScript({ func })` 要求传入的函数是自包含的（不能闭包引用模块级变量），拆到别的文件反而容易踩坑。

## 已知限制（v0.1，如实说）

- 图片/样式内联是简化实现（同源 CSS 内联、≤2MB 图片转 base64），不是 [SingleFile](https://github.com/gildas-lormeau/SingleFile) 那种工业级完整度——跨域样式表、懒加载或 canvas 绘制的图片可能捕获不全。够用，不是完美复刻。
- Fine-grained PAT 明文存在 `chrome.storage.local` 里。这是个人单人工具，token 权限已锁死到 `wick` 一个仓库的 Contents 读写，泄露的最坏情况是有人往归档仓库塞垃圾 commit，`git revert` 即可，没有上加密/relay 服务的必要。

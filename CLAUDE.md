# wick-extension · 操作手册

[Wick](https://github.com/robbery107allianz-cell/wick) 项目的**浏览器插件源码**。设计说明见 [README.md](README.md)；项目全貌/决策历史见家园记忆池 `project_wick.md`（唯一真源）。

姊妹仓库：[`wick`](https://github.com/robbery107allianz-cell/wick)（同机 `~/Projects/wick/`）——数据仓库，快照实际存这里，改归档/公证逻辑去那边。

## 不变量（改这个仓库前必读）

- **owner/repo/PAT 永远不硬编码**，只从 `chrome.storage.local` 读。这是有意为之的设计——任何人 clone 这份代码都是搭自己独立的实例，不会意外写进别人的仓库。改代码时不要图省事把仓库名写死。
- **任何 `fetch()` 调用必须带超时**（`AbortController` + `setTimeout`）。已经真实踩过一次：图片抓取和 GitHub API 提交都没设超时，导致捕获卡死无限转圈——一个都不能漏。
- **`captureInPage` 函数必须自包含，不能拆到别的文件用 import 引入**。`chrome.scripting.executeScript({ func })` 要求传入的函数值不闭包引用模块级变量，拆分容易踩坑，所以捕获逻辑就留在 `background.js` 里。
- **`options.html` 的 `<input>` 绝不能把 placeholder 设成和真实期望值完全一样的字符串**。踩过一次：`仓库名` 的 placeholder 写成了 `wick`（真实正确值），用户分不清是提示文字还是已经填的值，导致 `repo` 存成空字符串还看不出来。

## 测试流程

1. `chrome://extensions` → 开发者模式 → Load unpacked → 选这个目录
2. 改完代码后点 Wick 卡片上的刷新图标重新加载（不会清 `chrome.storage.local`，除非做过"移除再重装"）
3. 诊断配置问题：Wick 卡片 → "service worker" 链接 → DevTools Console 跑 `chrome.storage.local.get(null, console.log)`，直接看真实存了什么，别只看 UI 显示
4. 语法自检（MV3 service worker 用 ES module，`node --check` 需要 `.mjs` 后缀或 `--input-type=module`）：
   ```bash
   cp background.js /tmp/x.mjs && node --check /tmp/x.mjs && rm /tmp/x.mjs
   ```

## 现状

仓库：https://github.com/robbery107allianz-cell/wick-extension （public）

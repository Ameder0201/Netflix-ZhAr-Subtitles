# Netflix 中阿双语字幕

将 Netflix 当前选择的文字字幕显示为 **简体中文＋阿拉伯语**，支持 Shadowrocket。基于独立的 `v21-config-2` 核心，包含已获 Apple TV 用户反馈的字幕容量修复。

<a href="https://ameder0201.github.io/Netflix-ZhAr-Subtitles/#google"><img src="docs/assets/install-google.svg" alt="Google 安装入口" width="230" height="40"></a>
<a href="https://ameder0201.github.io/Netflix-ZhAr-Subtitles/#deepl"><img src="docs/assets/install-deepl.svg" alt="DeepL 安装入口" width="230" height="40"></a>

**[打开安装页面](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/)** · [下载最新版本](https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest)

网页提供 `shadowrocket://install?module=…` 一键导入，形式参考 [DualSubs 安装页](https://dualsubs.github.io/guide/netflix.html)。GitHub README 的按钮先打开安装页，再点击页面的一键导入按钮。

## 安装与更新

| 翻译接口 | 固定模块 URL |
| --- | --- |
| Google，无需 API key | `https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest/download/Netflix.ZhAr.Google.srmodule` |
| DeepL，填写自己的 API key | `https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest/download/Netflix.ZhAr.DeepL.srmodule` |

1. 在目标设备的 Shadowrocket 准备 HTTPS 解密：开启解密、按客户端指引安装并信任其证书。模块追加 `*.oca.nflxvideo.net`，不替你安装／信任证书。
2. Google 与 DeepL **只选一个**。同时停用旧 Netflix 翻译、诊断、实验及维护模块。本项目不依赖 Universal、BoxJS 或其他 DualSubs 托管脚本；若 Universal 用于其他平台，可保持原状态。
3. DeepL 用户进入模块的「编辑参数」，填写自己的 `DeepLKey`，按账户选择 `DeepLPlan=Free` 或 `Pro`。公开文件只有占位值；未填写时保留原字幕，不发翻译请求、不切换到 Google。
4. 播放影片并选择已有文字字幕。默认 AUTO 将同一原文分别译为简体中文和阿拉伯语；中文在上。无需每集在 Mac 手工准备。
5. 以后退出 Netflix，在该模块上点「更新」。固定模块链接会跟随最新正式 release；每个 release 指向版本固定的自包含 JS。

### Apple TV

tvOS 通常没有供此用途使用的浏览器。一键按钮打开的是**当前手机或 Mac** 的 Shadowrocket，并不会远程把模块装到 Apple TV。复制固定模块 URL，在 Apple TV 的 Shadowrocket「配置 → 模块 → 添加」中导入，之后仍在 Apple TV 上点更新。

不同客户端版本是否显示「编辑参数」需要实机确认。若 tvOS 没有该入口，可继续使用已有的本机私有配置服务生成 DeepL 设备包；**不将带密钥的个人包上传公开仓库**。已有私有配置入口与设备包未被本次公开发布修改。

## 可调参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `SourceLanguage` | `AUTO` | 当前字幕的源语言；也可填 `ZH-HANS`、`ZH-HANT`、`EN` 等。不是音轨语言。 |
| `Position` | `zh-first` | 中文在上；`ar-first` 为阿语在上。 |
| `Pipeline` | `direct` | 默认由同一原文分别译中／阿；`pivot-zh` 则先中再阿。 |
| `DeepLPlan` | `Free` | DeepL 模块专用，支持 `Pro`。 |
| `DeepLKey` | 占位值 | DeepL 模块专用，在设备参数中填写自己的密钥。 |

原生参数写法可参阅 [Shadowrocket 社区维护手册的编辑参数章节](https://github.com/LOWERTOP/Shadowrocket#编辑参数)。该手册并非 Shadowrocket 官方文档；本项目也不把本地模拟视为 tvOS 参数界面的实机验证。

## 工作方式与边界

- 使用 `http-request`、`requires-body=0`。先检查请求及少量前缀，确认 WebVTT 后才获取索引和需要翻译的字幕段。
- 按段、分批翻译，每批最多 50 条；AUTO 默认同一原文分别生成简体中文和阿拉伯语。繁转简字典随包附带，运行时无需联网下载字典。
- 保持原索引、原段 UTF-8 字节数和准确 206。双语装不下时先精简等价时间写法、注释与换行，再使用简洁布局去掉可选编号与定位信息。不会删字、截断译文或改变起止时间。
- 简洁布局可能改变原字幕的屏幕定位／样式。若完整文字和必要时间信息仍装不下，继续保留原字幕；不会以错误长度强行回传。
- 当前支持带 `SegmentIndex` 的 WebVTT 和已经验证的闭合单段 Range。原资源最多 512 KiB；当前段最多 48 KiB／250 cues；脚本 deadline 28 秒，模块 timeout 35 秒，API 调用上限 16 次。
- 不读写 BoxJS 或 Apple TV 持久化字幕缓存，也不向 Mac 回传字幕。**未实现跨请求缓存**，重复加载同一段可能再次调用付费接口。
- GitHub 仅提供代码与安装包；正常翻译请求由设备发向所选翻译服务。下载后离线使用脚本取决于客户端保留本地脚本的行为，具体设备应实测。

### 验证状态

`v21-config-2` 核心的容量修复已获 Apple TV 用户“翻译恢复正常”反馈；前一核心版本也获得中文／第三语言及前后拖动反馈。公开版新增的原生参数适配和安装流程仅完成本地测试，尚未取得它们的 Apple TV 实机反馈。请在自己的环境验证双语、拖动、续播与连接稳定性，不能把这些反馈泛化为所有影片、语言或字幕格式。

## 从源码构建

需要 Python 3 和 Node.js，无需安装第三方构建包，也不读取钥匙串或任何个人配置。

```sh
python3 tools/build.py
node tests/runtime.cjs
node tests/render_capacity.cjs
node tests/gateway_capacity.cjs
node tests/public_config.cjs
python3 tests/artifacts.py
python3 tools/build.py --check
```

源码位于 `src/`，OpenCC 依赖和许可位于 `vendor/`，公开构建位于 `dist/` 与 `modules/`。发布步骤见 [RELEASING.md](RELEASING.md)。

## 许可与来源

项目代码使用 [MIT](LICENSE)。随包 OpenCC JS／词典分别遵循 MIT 和 Apache-2.0，完整声明见 [NOTICE](NOTICE) 及 `vendor/`。本项目源于针对 DualSubs 使用场景的独立兼容性修复，与 Netflix、DualSubs 和 Shadowrocket 开发者无隶属关系。

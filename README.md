# Netflix 中阿双语字幕

将 Netflix 当前选择的文字字幕显示为 **简体中文＋阿拉伯语**，支持 Shadowrocket。基于独立的 `v21-config-2` 核心，包含已获 Apple TV 用户反馈的字幕容量修复。

<a href="https://ameder0201.github.io/Netflix-ZhAr-Subtitles/#google"><img src="docs/assets/install-google.svg" alt="Google 安装入口" width="230" height="40"></a>
<a href="https://ameder0201.github.io/Netflix-ZhAr-Subtitles/#deepl"><img src="docs/assets/install-deepl.svg" alt="DeepL 安装入口" width="230" height="40"></a>

**[打开安装页面](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/)** · [下载最新版本](https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest)

网页提供 `shadowrocket://install?module=…` 一键导入，形式参考 [DualSubs 安装页](https://dualsubs.github.io/guide/netflix.html)。GitHub README 的按钮先打开安装页，再点击页面的一键导入按钮。

## 安装与更新

| 翻译接口 | 固定模块 URL |
| --- | --- |
| Google，无需 API key | `https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.Google.srmodule` |
| DeepL，填写自己的 API key | `https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.DeepL.srmodule` |

主入口使用 GitHub Pages 直接文件，避免 GitHub Releases 的 latest／下载资产重定向链。备用 [Google Release 下载](https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest/download/Netflix.ZhAr.Google.srmodule)／[DeepL Release 下载](https://github.com/Ameder0201/Netflix-ZhAr-Subtitles/releases/latest/download/Netflix.ZhAr.DeepL.srmodule) 仍保留。Pages 模块是同版本 Release 模块的逐字节镜像；运行脚本仍指向版本固定的 tag。

1. 在目标设备的 Shadowrocket 准备 HTTPS 解密：开启解密、按客户端指引安装并信任其证书。模块追加 `*.oca.nflxvideo.net`，不替你安装／信任证书。
2. Google 与 DeepL **只选一个**。同时停用旧 Netflix 翻译、诊断、实验及维护模块。本项目不依赖 Universal、BoxJS 或其他 DualSubs 托管脚本；若 Universal 用于其他平台，可保持原状态。
3. DeepL 用户进入模块的「编辑参数」，填写自己的 `DeepLKey`，按账户选择 `DeepLPlan=Free` 或 `Pro`。公开文件只有占位值；未填写时保留原字幕，不发翻译请求、不切换到 Google。
4. 播放影片并选择已有文字字幕。默认 AUTO 将同一原文分别译为简体中文和阿拉伯语；中文在上。无需每集在 Mac 手工准备。
5. 以后退出 Netflix，在该模块上点「更新」。Pages 固定模块随发布流程同步；每个模块指向版本固定的自包含 JS。

### iPad／iPhone 导入显示 Not Found

请用 Safari 打开安装页。若一键按钮能唤起 Shadowrocket 但下载失败，先复制上表的直接地址，在 Shadowrocket「配置 → 模块 → 添加」中粘贴；手动与一键都使用同一份模块。仍失败时，用 Safari 直接打开该模块 URL，查看是否能看到以 `#!name` 开头的文本，再尝试备用 Release 下载，并提供失败地址与错误提示。

2026-10-30 用户反馈 iPad 的 Google 和 DeepL 一键导入均显示 not found。这台 Mac 检查旧 Release URL、脚本与页面均为 200；旧模块下载存在两跳重定向。已改为 Pages 零重定向主入口，同时让页面不执行 JavaScript 时也使用正确的一键协议。尚未在该 iPad 复现或确认恢复，不能将重定向推测当成已证实根因。

### 旧版客户端导入后不翻译

2026-10-30 用户已确认 iPad 下载成功；Shadowrocket 2.2.24 播放时的实际日志反复出现 `PUBLIC_ARGUMENT_INVALID`。可确认请求脚本已运行，但在公开参数适配层退出；具体是缺失参数、未替换模板还是参数类型不同，旧错误码未细分，尚未实机区分。

先打开 **[Google／DeepL 兼容版一键安装页](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/compat/)**，点击对应按钮导入。首次导入后在客户端对同一份模块点击更新，固定地址不变。

提供独立的 [Google 旧版兼容模块](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.Google.Compat.srmodule)，版本 `ipad-compat-1`。该入口将 Google／AUTO／direct／中文在上直接编译进自包含脚本，不依赖 `$argument` 或 `#!arguments`，无需密钥。它仍调用 Google 翻译，且仍受本项目字幕格式与 Range 范围限制；不是对所有 iPad 请求方式的兼容保证。

2026-10-30，用户确认这台 iPad／Shadowrocket 2.2.24 使用 Google 兼容模块已能翻译，说明字幕拦截与核心可运行；原公开入口的阻塞点是参数适配层。具体参数形态尚未实机捕获，不把“旧版一定不支持 argument”或“模板一定未展开”作为结论。此次反馈未分别覆盖拖动、全部影片及长期连接稳定性。

测试时停用其他 Netflix 翻译模块，只启用此兼容模块。它会在本机日志记录参数的类型和是否包含未展开模板，不记录参数值、密钥或字幕，也不向诊断服务器上传。核心和现有 Google／DeepL 正式入口保持不变；不要把自己的 DeepL 密钥填到 Google 兼容模块。

构建兼容入口：`python3 tools/build_google_compat.py`；检查：`node tests/google_compat.cjs`、`python3 tools/build_google_compat.py --check`。兼容 JS 路径带独立版本号，后续行为改变应增加版本号，不覆盖旧版本路径。

### DeepL 旧版兼容入口

[DeepL 兼容版安装页](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/compat/#deepl)／[固定模块文件](https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.DeepL.Compat.srmodule)，版本 `ipad-deepl-compat-1`。固定 DeepL／AUTO／direct／中文在上，去掉 `#!arguments` 和所有三花括号模板，只从普通脚本 `argument` 读取密钥与账户类型。

在模块**源码编辑页**找到 `[Script]` 长行末尾的 `argument=DeepLPlan=Free&DeepLKey=REPLACE_WITH_YOUR_KEY`，把占位值替换为自己的完整 API 密钥；Free 密钥保留 `:fx`。DeepL API Pro 用户把 `Free` 改成 `Pro`。不要在网页或公开仓库填写密钥。只启用这一份 Netflix 翻译模块。

此适配器接受查询字符串、JSON 字符串和对象形式的参数，固定其他设置，避免原公开入口对 Provider／语言模板的依赖。它仍依赖客户端传递普通脚本 argument；若完全缺失则不会猜测密钥或回退 Google。缺失密钥、参数非法、模板未展开、账户类型非法分别记录 `DEEPL_COMPAT_KEY_MISSING`、`DEEPL_COMPAT_ARGUMENT_INVALID`、`DEEPL_COMPAT_TEMPLATE_UNRESOLVED`、`DEEPL_COMPAT_PLAN_INVALID`，不打印值。

公开脚本不包含个人密钥，也不读写持久化设置。模块更新可能覆盖本地填写的密钥，更新后需检查并重新填写。正常运行仍由 iPad 直接访问 DeepL，Mac 无需在线。Free／Pro endpoint 与认证头遵循 [DeepL 官方认证文档](https://developers.deepl.com/docs/getting-started/auth)。本地覆盖双语精确 206、两种 API 账户、参数形态、鉴权／额度失败保留原字幕；**尚待 iPad 实机反馈**，Google 成功不等于 DeepL 已验证。

构建与检查：`python3 tools/build_deepl_compat.py`、`node tests/deepl_compat.cjs`、`python3 tools/build_deepl_compat.py --check`。首次版本独立发布，不覆盖 Google 兼容 JS 或原 1.0.0 Release/tag。

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

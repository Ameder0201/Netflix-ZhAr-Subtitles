# 发布新版本

主固定模块入口为 GitHub Pages 的 `modules/`，备用为 GitHub Releases 的 `latest/download`；模块中的脚本 URL 指向明确的 tag，避免一次模块更新混用不同版本。不要修改已经发布的 tag 或覆盖其中的 JS。`tools/build.py` 同时生成 Release 模块和 docs/modules 镜像，两者必须逐字节一致。

1. 修改 `tools/build.py` 的 `VERSION`；同时更新安装页显示的公开版版本。核心升级时另改 `CORE_VERSION` 与源码实际运行版本，保持一致。
2. 运行 README 中的所有测试与构建一致性检查。确认没有个人配置、字幕、日志、带密钥的包和私有下载 URL。公开构建不从环境或钥匙串取密钥。
3. 提交、推送源代码并为该提交创建、推送 `v<版本>` tag。
4. 在 GitHub 创建正式 Release，上传以下四个资产。脚本文件与 tag 下 `dist/` 一致；两个模块与 tag 下 `modules/` 一致。

```sh
gh release create v1.0.0 \
  modules/Netflix.ZhAr.Google.srmodule \
  modules/Netflix.ZhAr.DeepL.srmodule \
  dist/Netflix.ZhAr.bundle.js \
  dist/manifest.json \
  --verify-tag --latest --title 'v1.0.0 · Netflix 中阿双语' \
  --notes-file RELEASE_NOTES.md
```

命令中的版本按本次发布调整。发布后，实际下载两种来源的固定 URL 和 tag 脚本 URL，核对它们与本地构建的 SHA-256；确认 Pages 主下载地址零重定向，且网页两个导入按钮（包含无 JavaScript 时的 href）和复制链接都指向相同主入口。网页按钮的自定义协议实际唤起效果还需在已安装 Shadowrocket 的设备验证。

发新版本时，先保证 tag 脚本可下载再切换 Pages 镜像，避免页面模块提前引用不存在的 tag。可以先发布 Release，再提交／推送 docs/modules 镜像；不要以覆盖旧 release 资产的方式修复安装页。

GitHub Pages 使用 `main` 分支的 `/docs`。当前仓库不包含需要额外 OAuth workflow 权限的 Actions 文件；测试和 release 在本地执行，Pages 由 GitHub 的分支发布构建。更换账号或仓库名时同步修改 `tools/build.py`、README 与 docs 中的地址。

---
name: shanyuchang-automation
description: 为山与场滑雪服套装或单件款制作详情页、主图、搜索图和分色 SKU。用户提供商品旧详情页、SKU、主图或已生成的摄影时，按项目授权安排摄影和带字整屏，并使用本地版式交付上架 JPG、预览与清单。
metadata:
  package: "@lumyne/shanyuchang-automation"
  version: __PACKAGE_VERSION__
---

# 山与场自动化

正式安装后，开始商品任务时运行同目录下的 `scripts/run.mjs task preflight --json`，用 Node.js 执行。它检查 Python、Pillow、NumPy，并提示可用的 npm 更新。需要实际生成图片时，按工作流解析当前 Agent 的 `toapiscli` 能力，使用获授权的请求和模型。离线联调或仅需执行部分步骤时，按任务范围处理对应依赖。

读取[自动化工作流](bundle/2026-11-28-shanyuchang-zidonghua/workflow.md)，按其相对链接使用本包配套的品牌摄影和版式。已有原片可按工作流直接进入离线装配。项目素材保留在用户指定的位置，按工作流写入独立交付目录。

# 山与场自动化

## 分支和源码

- 工作分支为 `feat/shanyuchang-skill-npm-20261128`，基线为 `feat/shanyuchang-automation-20261128` 的 `5aa670876f8c0949aca318b2d76b0019e37d2904`。
- 源码联调从 [山与场自动化](skills/2026-11-28-shanyuchang-zidonghua/SKILL.md) 开始，使用同仓库的摄影、版式、素材和脚本。改动在 Git 源码中完成。联调读取本项目副本，将生成产物写到工作输入之外的独立目录。
- 业务规则由三个源码目录维护。独立包的配置与管理入口位于 `packages/shanyuchang-automation/`，从源码装配发行内容。已安装 Skill 和生成的制品是交付副本。

## 安装和发布

- npm 包为 `@lumyne/shanyuchang-automation`，安装后的 Skill 名为 `shanyuchang-automation`。包负责安装、更新和校验所选 Agent 的 Skill 与运行时。本项目的本机验证只使用 Codex。
- 更新按「分支源码修改 → 项目源码联调 → 推送 GitHub → 本机准备并验证 npm 制品 → 正式发布 → 更新本机 npm 包并同步 Codex Skill」执行。首次先用本地制品验证 Codex 安装、发现、更新和回滚。
- 正式发布由本机 `npm-release-kit` 执行，复用通过验证的固定制品。发布需单独授权。发布后核对精确版本、dist-tag、制品哈希和 Codex 中的 Skill 版本。
- 在仓库根目录执行 `npm --prefix packages/shanyuchang-automation ci --ignore-scripts` 和 `npm --prefix packages/shanyuchang-automation run build` 装配制品。发行工具以本仓库为 `--root`，以 `packages/shanyuchang-automation/dist` 为 `--package-dir`。新增的发行素材先加入 Git 索引。

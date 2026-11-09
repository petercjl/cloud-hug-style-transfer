# 版本、来源与维护

当前业务流程来自 `cloud-hug-brand-upgrade` 1.1.0，工作流修订于 2026-10-27，基础提交为 `9a17dcfdc61f59db3e65756a20eaf81f80b0c2b8`（v0.5.2）。按用户要求，这次把新版流程合入现有 `cloud-hug-style-transfer`，继续使用原包管理入口。来源、原始素材和导入 ZIP 校验值见根目录 `PROVENANCE.json`；来源版本不等于 npm 发布版本。

## 安装、更新与恢复

包和规范 Skill 继续由 `@petercjl/cloud-hug-style-transfer` 管理。安装前读取包根目录 `INSTALL.md` 与 `UPDATE.md`；使用当前 CLI 的 `--help --json`、`capabilities --json` 和 `skill source --json` 获取真实参数与规范来源，不猜其他工具的选项。

先解析当前 Agent 实际支持的 Skill 目录，向 `skill install/status/update` 或 `update install` 传明确的 `--path`（Skill 本身的完整目标目录）与当前 `--agent`。只同步选中的当前 Agent。宿主名称表示约定，不是支持白名单，也不能代替真实目标路径。

受管安装后的所属包命令，通过本 Skill 的 `scripts/run.mjs` 和当前 Node.js 调用；启动器使用本目录 `.runtime` 中的代码与依赖。运行时缺失时报告并修复本安装，不退回其他全局副本。媒体包与它的规范 Skill 独立维护，不把媒体账号或凭据写进本包。

维护必须核验 CLI、运行时、Skill 字节与元数据，并由宿主执行原生重载／发现；命令回执中的 hostDiscovery pending 不等于已可见。自定义元数据、本地修改和非受管目录按包合同保护；更新失败或结果不明时，使用原 operation/resume 状态与备份恢复，先核对状态再决定重试。

自动检测默认只提示。自动安装需要独立持续授权且版本兼容；离线保留现有版本。业务诊断若报告 automaticUpdate.changed 或 reloadSkill，重新解析并加载当前规范 Skill 后再继续。源码 checkout 由 Git 维护，不调用 npm 更新替换开发目录。

## 本次工作流与完整性

保留产品卡与必要卖点确认、整套模板规划后的生成范围确认、03–15 页面映射、按形态分组、无字拆图／整页交付及 A/B/C 对照验收。改摄影或工具细节时，不恢复按旧页逐张转换的业务逻辑。原始 51 个素材文件保持不变。

本地规划与画板辅助脚本使用 Node.js 内置模块；`scripts/plan-inventory.mjs` 只计算清单，不推断商品、不代表用户批准、不提交生成。媒体核验与布局模块的来源保留在 PROVENANCE.json。

当前源码校验以包的 `npm/integrity.json` 和 `release-integrity.json` 为准。维护后运行 `node lifecycle/version.mjs` 刷新清单，再运行 `npm run validate:release`、相关测试和打包检查。清单生成不发布 npm 版本；实际发布需单独授权。静态检查不能证明付费生图效果，实际项目仍须看图验收。

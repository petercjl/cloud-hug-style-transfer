# 来源、安装与维护

本包是新的独立 Skill，机器名 `cloud-hug-batch-style-transfer`，显示名“2026-11-10抱抱云朵社批量风格转换”，版本 `1.0.0`，工作流日期 `2026-11-10`。

原始制作以用户提供的 `cloud-hug-brand-upgrade-20261027.zip` 为来源。该包记录的基础来源为 `petercjl/cloud-hug-style-transfer` v0.5.2，提交 `9a17dcfdc61f59db3e65756a20eaf81f80b0c2b8`。2026-11-11 将批量转换 ZIP 同步到该协作仓库的 `skills/cloud-hug-batch-style-transfer/`，以仓库 v0.6.0 为整合基础；这是独立 Skill 的源码同步，不是 npm 发布。原始来源、素材记录及本次 ZIP 摘要见根目录 `PROVENANCE.json`。

保留原包品牌摄影规则中适用的光线、材质、承托、蓝白关系和木质家具方法，保留原品牌正例/诊断图库；产品卡、指定模特卡及其生成规则不带入新版。用户前后对照另存为版式证据，不替代原品牌基准。旧新版模板映射、三案规划、无字交付规则已从执行资料中移除。

## 安装

ZIP 内只有一个顶层 `cloud-hug-batch-style-transfer` 文件夹。支持导入 ZIP 的宿主直接导入；手动安装时将这个完整文件夹放入目标 Agent 实际支持的 Skill 目录，保留 `SKILL.md`、`agents`、`references`、`assets` 和 `scripts` 的相对位置。不要只复制 `SKILL.md`，也不要把 ZIP 外层文件名再套一层目录。

GitHub 来源为 `petercjl/cloud-hug-style-transfer` 仓库下的 `skills/cloud-hug-batch-style-transfer/`。从该目录整体导入，不能只下载入口文件。现有 `@petercjl/cloud-hug-style-transfer` npm 包仍只安装品牌升级 Skill；不能用它的更新命令替代批量 Skill 的导入。更新批量 Skill 时先比较并保留已安装目录的本地修改，再按宿主导入机制同步选定目录。

源码同步不表示已经安装到任何 Agent。安装后按宿主原生机制刷新/重新发现，确认显示名与当前入口一致。机器名不同，可与仓库中的 `cloud-hug-style-transfer` 及原 `cloud-hug-brand-upgrade` 并存；使用时显式选择批量 Skill，避免触发其他流程。

## 依赖边界

生图继续使用用户环境中的 `@petercjl/sealseek-media-cli` 及配套 `sealseek-media` Skill。当前入口与实时模型合同由该包管理，按 [媒体执行](media-execution.md) 定位。本包不内嵌媒体运行时、不保存凭据、不改全局渠道或账号设置。

预处理脚本需要 Python 3.8+ 与 Pillow，媒体入口及画板布局助手使用 Node.js 22+。已有环境可直接复用；实际缺依赖再依据当前用户授权在合适环境修复，不为阅读/打包启动服务。媒体包升级使用自身安装更新合同并保留当前宿主的受管绑定；不能运行旧品牌包的业务更新覆盖本定制目录。

## 后续更新与验证

保持四项不变：当前原页的内容/版式锁定、原品牌资料的风格职责、白色无墙无窗棚景硬约束、每屏一张。新证据只修对应问题，不恢复产品卡、固定模特或多案流程。

`INTEGRITY.json` 记录本包除自身外所有文件的 SHA-256；改动后重新生成。确定性预处理和画板布局需要实际运行检查；Skill 结构、相对路径和资源完整性通过不等于付费出图效果通过。只有真实生成并逐屏看图后才能报告视觉验收。本次安装包制作不进行付费生成，效果由后续测试验证。

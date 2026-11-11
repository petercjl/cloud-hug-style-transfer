# @petercjl/cloud-hug-style-transfer

将旧详情页的商品升级到内置新版模板，先生成并确认各款色产品设定卡、形态分组与卖点，再规划每屏 A/B/C，按用户选定范围交付无字摄影素材。中文展示名为“抱抱云朵社品牌升级”；包名、Skill 名称和安装更新入口继续使用 `cloud-hug-style-transfer`。

面向具备所需执行能力的任意 Agent；Node.js 22+。当前 Agent 识别自己的 Skill 目录、能力与注册方式。

仓库同时维护两套独立流程：

| Skill | 用途与输出 | 安装来源 |
| --- | --- | --- |
| `cloud-hug-style-transfer` | 产品卡确认、新模板整套 A/B/C 规划、无字摄影素材 | 下述 npm 包 |
| `cloud-hug-batch-style-transfer` | 旧详情页拼接与按内容分屏，保留原文版式、产品和人物关系，转换白色无墙无窗棚景；每屏一张完整图 | 仓库中的独立 Skill 目录 |

## 批量转换 Skill

完整目录见 [skills/cloud-hug-batch-style-transfer](https://github.com/petercjl/cloud-hug-style-transfer/tree/main/skills/cloud-hug-batch-style-transfer)。将该目录整体导入当前 Agent 支持的 Skill 位置，保留脚本、参考与素材的相对结构，再按宿主机制刷新发现。

> 请使用 cloud-hug-batch-style-transfer，将已有详情页按完整内容分屏，保留全部原文、版式、产品和人物关系，转换为无墙无窗的白色概念摄影棚，每屏一张。

预处理需要 Python 3.8+ 与 Pillow 9.1+；媒体及画板辅助需要 Node.js 22+ 和当前受管 `sealseek-media` Skill。批量 Skill 独立维护，不随下面的品牌升级 npm 安装或更新；详情见其 [维护说明](https://github.com/petercjl/cloud-hug-style-transfer/blob/main/skills/cloud-hug-batch-style-transfer/references/maintenance.md)。

## 安装

把下面这句话发送给当前 Agent：

> 请安装 npm 包 @petercjl/cloud-hug-style-transfer。

安装同时包含工具、完整 Skill 和独立运行依赖。Agent 核验本地入口、文件与版本，再确认宿主能发现 Skill。

## 更新

> 请更新 npm 包 @petercjl/cloud-hug-style-transfer。

每次更新只处理明确选中的当前 Agent，保留自定义元数据与更新前备份。同版本也会检查和修复 Skill。自动检测默认提示；自动安装需要单独授权。

## 使用

附上整套旧详情页、可用的实物参考和本次特殊要求。

> 请使用 cloud-hug-style-transfer，将所附旧详情页升级到内置新版模板，先生成产品卡并核对分组、配色和卖点，再规划整套每屏 A/B/C，确定生成范围后执行。

新版流程以新版模板为起点：01、02、16–19 跳过；03–15 按各屏职责规划，其中 07–10 按确认的产品形态分组调整页数，12 按确认卖点安排四格。产品卡确认与详情素材的生成范围分别核对，已有答案不重复询问。

默认按图片位交付独立无字素材，也可按要求交付完整无字页面。普通页每屏三张、三图页九张、四宫格十二张；完整页模式每屏三张。规划、张数与授权范围在生成前核对，产品卡和详情素材共用本轮画板。

本次业务规则来自 `cloud-hug-brand-upgrade` 1.1.0（2026-10-27），已替换原逐张源页风格转换流程；来源记录见 [PROVENANCE.json](skills/cloud-hug-style-transfer/PROVENANCE.json)。原始素材保留，历史名称用于兼容已有安装。

账号、服务访问与付费生成按各自授权执行。安装不授予服务权限。

## Agent 执行合同

[安装合同](INSTALL.md) · [更新与恢复合同](UPDATE.md)。CLI 通过 `skill source --json` 返回规范来源。安装后的 Skill 使用自身 `scripts/run.mjs`，运行代码与依赖位于自身 `.runtime`。宿主适配记录能力差异与实际测试证据，不作为支持白名单。

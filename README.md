# @petercjl/cloud-hug-style-transfer

将旧详情页的商品升级到内置新版模板，先生成并确认各款色产品设定卡、形态分组与卖点，再规划每屏 A/B/C，按用户选定范围交付无字摄影素材。中文展示名为“抱抱云朵社品牌升级”；包名、Skill 名称和安装更新入口继续使用 `cloud-hug-style-transfer`。

面向具备所需执行能力的任意 Agent；Node.js 22+。当前 Agent 识别自己的 Skill 目录、能力与注册方式。

## 安装

把下面这句话发送给当前 Agent：

> 请安装 npm 包 @petercjl/cloud-hug-style-transfer。

安装同时包含工具、完整 Skill 和独立运行依赖。Agent 核验本地入口、文件与版本，再确认宿主能发现 Skill。生图还需要当前宿主已安装并配置的 `@petercjl/toapiscli` >=0.1.1，直接复用其凭据。

当前仓库 0.7.0 已迁移 ToAPIs；提交 GitHub 不代表已经发布 npm。安装本次仓库修订时，在已核验的仓库目录执行 `npm ci --ignore-scripts`，再执行 `node npm/cli.mjs skill install --agent workbuddy --path EXACT_SKILL_DIR --json`。Agent 解析自己的实际技能目录，并核验其发现状态；不要用尚未更新的 npm 版本替代本次修订。

## 更新

> 请更新 npm 包 @petercjl/cloud-hug-style-transfer。

每次更新只处理明确选中的当前 Agent，保留自定义元数据与更新前备份。同版本也会检查和修复 Skill。自动检测默认提示；自动安装需要单独授权。

## 使用

附上整套旧详情页、可用的实物参考和本次特殊要求。

> 请使用 cloud-hug-style-transfer，将所附旧详情页升级到内置新版模板，先生成产品卡并核对分组、配色和卖点，再规划整套每屏 A/B/C，确定生成范围后执行。

新版流程以新版模板为起点：01、02、16–19 跳过；03–15 按各屏职责规划，其中 07–10 按确认的产品形态分组调整页数，12 按确认卖点安排四格。产品卡确认与详情素材的生成范围分别核对，已有答案不重复询问。

默认按图片位交付独立无字素材，也可按要求交付完整无字页面。未指定方案数时规划 A/B/C；只有授权全部三案时，普通页每屏三张、三图页九张、四宫格十二张，完整页模式每屏三张。已有数量与范围授权直接沿用。只保存图片、原任务记录和对应清单，不创建画板或 HTML。

媒体入口来自当前宿主 `toapiscli` Skill 的 `.runtime/dist/cli.mjs`。默认使用 `gpt-image-2.6-sunburst`、2K，按图片位选择实际支持的比例；执行前读取当前模型文档，用户指定模型优先。状态未知时使用原任务目录恢复，不自动重复提交付费任务。详见 [媒体执行](skills/cloud-hug-style-transfer/references/media-execution.md)。

本次业务规则来自 `cloud-hug-brand-upgrade` 1.1.0（2026-10-27），已替换原逐张源页风格转换流程；来源记录见 [PROVENANCE.json](skills/cloud-hug-style-transfer/PROVENANCE.json)。原始素材保留，历史名称用于兼容已有安装。

账号、服务访问与付费生成按各自授权执行。安装不授予服务权限。

## Agent 执行合同

[安装合同](INSTALL.md) · [更新与恢复合同](UPDATE.md)。CLI 通过 `skill source --json` 返回规范来源。安装后的 Skill 使用自身 `scripts/run.mjs`，运行代码与依赖位于自身 `.runtime`。宿主适配记录能力差异与实际测试证据，不作为支持白名单。

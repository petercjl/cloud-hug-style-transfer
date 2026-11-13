# @petercjl/cloud-hug-style-transfer

将整理好的商品实拍或旧详情页升级到内置新版模板。确认产品卡、独立人货尺度图、四宫格内容及页面范围后，规划每屏一个方案、一张完整无字页面，先生成前三屏，再由用户选择逐张继续或批量完成。中文展示名为“抱抱云朵社品牌升级”；包名、Skill 名称和安装更新入口继续使用 `cloud-hug-style-transfer`。

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

附上整理好的多角度商品实拍、旧详情页或两者组合。旧资料没有可靠的人货同框图时，补充一张表达相对大小的照片；已有合格产品卡可直接复用。

> 请使用 cloud-hug-style-transfer，准备产品卡与独立人货尺度依据，集中确认四宫格内容及页面范围后，按新版模板规划每屏一个方案、一张完整无字页。先生成前三屏，之后由我选择逐张继续或批量完成剩余页面。

页面任务和数量沿用单方案版本：01、02、16–19 跳过，03–15 按模板职责规划；07–10 按形态分组，12 按确认卖点安排四格。单形态商品共 10 张详情图，产品卡另计；三图页和四宫格各为一张完整页。

默认先生成 03、04、05，自检并一起展示后等待选择。逐张模式从 06 开始，每张后由用户选择修改或继续；修改后仍停在当前页。用户明确选择批量时才连续完成剩余页面。自然语言决定有效，恢复任务时保留等待状态。详见 [规划与生成节奏](skills/cloud-hug-style-transfer/references/planning.md)。

产品卡负责外观与内部比例，独立人货图直接负责体量；不从图片估读厘米或另写身体／家具比例，已有清楚尺度图不再追问尺寸。详见 [产品尺度](skills/cloud-hug-style-transfer/references/product-scale.md)。

固定品牌基准是无墙无窗的白色无缝概念摄影棚、低饱和浅蓝承托面、少量设计感木家具和柔光。现有详情页案例在生图中只作风格参考，具体动作、家具位置与产品摆法由本屏方案决定。详见 [摄影方法](skills/cloud-hug-style-transfer/references/photography-method.md)。

默认 `gpt-image-2.6-sunburst`、2K，按本屏选择画幅。媒体入口使用当前宿主 `toapiscli` Skill 的独立运行时，实际提示词与请求在发送前统一核对；未知任务查询原目录，不重复提交。详见 [媒体执行](skills/cloud-hug-style-transfer/references/media-execution.md)。

只保存图片、原任务记录与同一份 `manifest.json`。工作流修订为 `2026-11-13-staged-review`，业务规划基线为 `2d31a46`；来源记录见 [PROVENANCE.json](skills/cloud-hug-style-transfer/PROVENANCE.json)。原始素材、产品识别和页面规划能力保留。

## Agent 执行合同

[安装合同](INSTALL.md) · [更新与恢复合同](UPDATE.md)。CLI 通过 `skill source --json` 返回规范来源。安装后的 Skill 使用自身 `scripts/run.mjs`，运行代码与依赖位于自身 `.runtime`。宿主适配记录能力差异与实际测试证据，不作为支持白名单。

---
name: cloud-hug-style-transfer
description: 将整理好的商品实拍或旧详情页升级到抱抱云朵社内置新版模板。先生成各款色产品设定卡，再建立独立的人货比例依据，统一确认产品、规格与卖点后规划03–15每屏A/B/C；默认每个方案生成一张完整无字页面。使用ToAPIs生成，内置品牌案例、模特卡与摄影方法。
metadata:
  package: "@petercjl/cloud-hug-style-transfer"
  version: 0.7.0
  source_skill: "cloud-hug-brand-upgrade"
  source_version: "1.1.0"
  workflow_revision: "2026-11-12"
  upstream_version: "0.5.2"
---

# 抱抱云朵社品牌升级

把用户整理好的商品资料，转化成供同事现有 PSD 使用的新版品牌无字页面。**商品实拍或旧资料提供产品依据；确认后的产品卡统一外观；独立的人货同框实拍约束相对大小；内置新版模板决定页面任务与构图框架。** 工作起点是新版模板，不能回到逐张改造旧页的流程。默认每屏每个方案一张完整无字页面。

> WorkBuddy / ToAPIs 迁移版，2026-11-12。基于用户 2026-11-11 交接包的业务规则。当前用户明确的数量、范围、模型和自主执行要求优先于参考资料中的默认流程；不例行要求重新确认，不自动追加付费任务。

业务来源为原版 cloud-hug-style-transfer 0.6.0；品牌模板、产品设定卡和摄影方法保留。媒体执行统一使用 `@petercjl/toapiscli` 配套 Skill；复用已导入的凭据，只保存图片、任务记录与对应清单。必要澄清使用 WorkBuddy 当前可用问答能力；工具不可用时简短提问。用户已经授权的范围直接执行，参考中的三案和审稿节点是默认创作方式，不能覆盖用户明确要求。

## Package installation and local execution

The owning npm package is the canonical source. Installation instructions are in its INSTALL.md and UPDATE.md before Skill loading. Resolve the current Agent's supported Skill directory and use explicit `--path` with package-managed install/status/update. Named Agent identities describe conventions, not eligibility or directory defaults.

After managed installation, invoke this Skill's `scripts/run.mjs` with the current Node.js runtime for every owning-package CLI command below. The launcher uses the target-owned `.runtime` and bundled dependencies. Resolve this launcher relative to this Skill's actual directory; do not fall back to a shared global package when the installed runtime is missing. External service dependencies are declared separately and resolve their own canonical Skill through their documented CLI contract.

Maintenance completes CLI/runtime and Skill verification, followed by host-native reload and discovery. CLI receipts leave host discovery pending. Automatic checks notify by default; installation requires separate standing authorization and a compatible stable version. Use update operation/resume for partial or unknown outcomes, preserving the original transaction and backup. Only the selected current Agent is synchronized.

## 1. 接收资料与生成产品卡

确认用户要进行品牌升级；仅要求理解、复盘、修改 Skill 时只完成该范围。实际升级任务按 [媒体执行](references/media-execution.md) 核验当前宿主已安装的 `toapiscli`、服务访问与所选模型参数；默认 `gpt-image-2.6-sunburst`、2K，用户明确选择优先。

实际查看用户整理好的全部商品资料，可为多角度实拍、旧详情页或两者组合，不要求新品先有旧详情页。按 [产品识别与设定卡](references/products.md) 识别来源、形态和款色；有旧详情页时综合首屏、卖点、场景、细节及明确款色信息判断主推范围，店铺总览、关联推荐不自动纳入。范围有依据后再建立形态分组、每组配色与来源关系。重复角度、光线差异和道具不重复计为款式；不同颜色不自动分成不同形态，也不按出现次数机械取舍。

每个“形态＋配色”主动生成一张多角度产品设定卡，参考内置 `assets/products/dog.jpg`、`assets/products/rabbit.jpg` 的拼卡表达。先看本轮商品，再看卡片样式；卡片样式里的历史动物、颜色、长条比例和纹理不迁移给新品。生成产品卡本身不需要先做详情页方案，也不需要用户先选 A/B/C。

从整套资料为每个款色挑选清楚、互补的整体、头脸、侧背和材质依据；存在多个有效视角时必须实际传入互补参考，不能只用方便裁切的一格总览。先处理不同来源的外观冲突，再按 [产品卡验收](references/products.md) 把成卡与原始依据对照，检查卡内各视角及同形态各配色的结构一致性；明显偏差先处理，不能仅凭画面干净就宣称合格。提交参考、完整提示词与任务对应关系按 [媒体执行](references/media-execution.md) 留存。

没有实物或旧图缺角度时允许合理生成补全，并在卡片旁简要标明待核对部位；不把补全说成实拍验证。用户可自行修改并上传卡片。最后确认的版本成为本轮制作依据；旧卡保留但不继续混入生成。卡片视觉确认不替代数值、材料成分、认证或功效证明。

## 2. 产品卡完成后，建立独立的人货比例依据

按 [产品尺度与人货比例](references/product-scale.md)，从已有资料提取明确尺寸、规格及测量口径，并挑选可靠、体量清楚的人与产品同框图；旧资料没有时，使用用户补充的人与抱枕实拍。资料已齐直接采用，不重复索取，不自行生成比例图。

产品卡继续只负责外观；比例照片独立保存，只约束相对大小，不拼进产品卡，也不要求每张卡各配一张。记录其适用产品与规格，同规格不同配色可以共用；不同新品不能无依据套用。照片不替换当前模特身份、服装、场景或产品卡。没有明确厘米数时可按可靠同框参照建立视觉尺度，不从照片猜测数值。缺少或冲突的关键依据集中到下一步核对。

## 3. 产品与需求统一确认（进入规划前）

展示**简短识别结论＋全部产品卡＋独立比例依据＋卖点／使用场景＋展示模块页数**，通过原生问答工具集中核对（详细依据放在项目文档）：

- 有几种形态，每种有哪些颜色，卡片数量与外观是否正确；哪些细节由生成补全。
- 本轮使用的规格、已有尺寸及独立比例照片的适用范围；已有清楚依据直接列明，仅对缺失或冲突提问，不新增逐卡配图或逐张审批。
- 07–10 展示模块按形态分组后需要几页；同形态双色是两张卡、一页展示。
- 12 四宫格要表达什么：可先提取旧页卖点，请用户确认、修改或提供新的内容，不能沿用模板的四种睡姿作为所有商品默认值。
- 本次特殊需求：指定展示重点、已明确的尺寸／输出要求、用户主动指定的模型等。已有答案直接使用，不要求填写长表。

核对产品卡、分组／配色／数量、尺度依据及必要卖点；关键商品事实有歧义时先澄清。已有确认或明确自主执行授权时继续规划，未核实商品事实保持未知。 有修改先更新对应清单、卡片和记录；已经确认且未变化的部分不重复询问。用户上传修订卡但尚未表示确认时，只核对该卡的状态。用户要求自行决定时可按证据推进，并记录使用的基准。

## 4. 以新版模板规划整套，每屏 A/B/C

读取 [页面映射](references/page-patterns.md)、[每屏三案与交付数量](references/planning.md)，按需实际打开 [模板原图](references/detail-final-20261016.md)。整套先规划完整，再让用户选生成范围；用户逐屏讲需求不等于要求逐屏确认。

| 模板 | 本轮职责 |
| --- | --- |
| 01、02 | 固定品牌页，跳过规划与生成 |
| 03 | 本轮首屏，根据确认商品重建安睡／陪伴关系 |
| 04、05、06 | 分别继承俯看休息、轻快活动、亲密近景的摄影任务 |
| 07–10 | 同一类三图展示模块，每种形态一页；按各组颜色决定三图内容 |
| 11 | 继承沙发依靠／拥抱的独立页面任务 |
| 12 | 四宫格；按用户确认卖点规划四个展示任务 |
| 13、14 | 分别继承站姿体量展示、靠坐亲密接触的任务 |
| 15 | 无模特的本轮产品总览，核对已确认款色清单 |
| 16、17、18、19 | PSD 由同事修改，跳过规划与生成 |

保留模板编号用于 PSD 对应，实际屏序另外记录。07–10 可缩减或扩展为形态分组页，不能因为模板有四只抱枕就强做四页、强塞四款；不能把双色月亮拆成两个形态页。

未指定时每屏规划 A/B/C 三个完整方向；用户已指定方案数或直接执行时按实际要求规划。三案共有本屏的任务、景别、款色范围、版式与品牌基础，差异来自人物与产品组合、同景别观察方向、承托体块、前后景和呼吸空间。**固定 PSD 图片框和留位，变化发生在摄影构图内部。** 不能用远景／特写／纯产品三种不同任务凑同一屏三案，也不能只设计 A、让 B/C 仅改表情或小道具。

摄影与审美继续按 [摄影方法](references/photography-method.md)；人物身份、默认奶白长袖长裤与素面袜按 [人物方法](references/model.md)。模板中的旧脸、短裤或裸足不覆盖当前模特卡。产品形态、内部比例与材质以本轮确认卡为准，实际体量按本轮尺寸与独立比例依据；动作适应产品大小，不为复刻旧款拥抱范围而放大新品。每案写明当前姿态下可见的身体参照关系，并进入实际提示词。

## 5. 用户审阅整套规划，确定生成范围

提供完整规划的可访问入口与简短三案差异摘要，列出实际页数、图片位、交付方式与预计张数；通过原生问答工具收集用户对方案和生成范围的选择：

1. 指定单屏／指定若干屏的 A/B/C。
2. 整套全部页面的 A/B/C。

默认 `pages`：每屏每个已选方案只生成一张完整无字页面，三图或四宫格的全部图片位包含在这一张内。选择 A 时每屏 1 张；明确选择 A/B/C 时每屏 3 张独立完整页面，不把三个方向拼成一张。图片位数量不再乘入默认输出张数。仅当用户明确要求拆图时使用 `assets` 并重新计数；不同时追加拆图，不把未选择的默认提案数当作付费生成数量。

规划认可但未确定生成范围时，只澄清范围；已明确指定范围、模式与方案时直接执行，不要求额外点击“批准”。仅确认产品卡不授权详情页生图，单屏授权也不扩展成整套。

## 6. 生成与交付

按 [媒体执行](references/media-execution.md) 执行 ToAPIs 能力链：读取模型文档 → 本地参数核对 → 在授权范围内提交 → 保存任务 ID → 跟踪／恢复 → 下载 → 实际看图。参考图必须实际传入，不只在提示词里写路径；有人物互动的调用须带对应的独立比例参考，并在提示词中区分外观、尺度、人物和模板职责。未指定模型时使用经实时文档核验的 `gpt-image-2.6-sunburst`；明确指定时保持指定，能力不支持则报告并等待必要选择。

产品卡与详情素材共用本轮进度和本地对照档案，分阶段编号。详情素材按 [图片与清单归档](references/canvas-comparison.md) 记录对应新版模板／图片位与成图文件；不要求旧页与新页一一对应。保存每张任务、文件、模板、方向和位置关系，恢复原任务，不自动重提不确定的付费生成。

全部交付为无排版文字图片：不生成标题、卖点标签、口号、版面 LOGO、水印或装饰文字；产品本体确认保留的标识不被误删。拆图不附带整页白边和文字栏，完整页保留对应框架与空白。图片比例、裁切与 PSD 衔接见 [版式与图片位](references/brand-layout.md)。

实际验收：本轮产品与卡片一致；人货尺度符合独立比例依据，同规格在各格和跨页没有无依据地变大变小；景别及格位职责正确；A/B/C 有实质差异；人物／袜子和蓝白棚景、柔光、受力一致；15 无模特且覆盖本轮款色；无额外旧款、错色或文字；默认每屏每案仅一张完整页，格位齐全，数量和归档写入完整。尺度检查考虑透视、遮挡、姿态与软体受压，不以固定像素比代替判断。整体不成立时修正对应原因，不能只修局部后宣称合格。额外付费重生成按用户授权处理。

单张验收之外，同屏三案齐后按 [三案对照验收](references/planning.md) 并排查看 A/B/C，逐案核对规划中的关键差异是否出现在成图。若原定不同姿态或构图收敛为近似画面，记录未落实的区别并处理对应输出；不能因 C 有变化就忽略 A/B 近似，也不能只以“已生成三张”判定完成。

交付图片目录、文件与模板对应清单及关键未完成项；不创建在线画板或本地 HTML 页面。保留原始生成输出，按当前用户约定的交付与缓存位置保存成果副本；未指定时使用本轮项目目录，不依赖作者私人目录。不得将有路径或任务 ID 当作已完成视觉验收。

## 资料按需读取

| 阶段 | 入口 |
| --- | --- |
| 商品识别、卡片生成、第一次确认 | [products.md](references/products.md) |
| 产品卡后提取尺寸、独立比例参考及尺度验收 | [product-scale.md](references/product-scale.md) |
| 模板页与形态分组、12 卖点映射 | [page-patterns.md](references/page-patterns.md) |
| 整套 A/B/C 规划与数量 | [planning.md](references/planning.md) |
| 原图位置与用途 | [assets.md](references/assets.md)、[模板索引](references/detail-final-20261016.md) |
| 摄影与人物 | [photography-method.md](references/photography-method.md)、[model.md](references/model.md) |
| PSD 比例、留白、拆图／整页 | [brand-layout.md](references/brand-layout.md) |
| 工具与本地归档 | [media-execution.md](references/media-execution.md)、[canvas-comparison.md](references/canvas-comparison.md) |
| 质量问题定位 | [cases.md](references/cases.md) |
| 本地版本、来源、依赖维护 | [maintenance.md](references/maintenance.md) |

所有内置路径相对本 Skill 根目录；先解析当前实际位置。新流程以本入口、页面映射、用户确认资料为准，历史案例只提供指定的摄影依据。

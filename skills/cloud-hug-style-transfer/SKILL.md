---
name: cloud-hug-style-transfer
description: 将整理好的商品实拍或旧详情页升级到抱抱云朵社内置新版模板。前期集中确认产品资产图组、资产组的相对尺寸、四宫格内容与整套范围，随后规划每屏一个方案、一张完整无字页面；默认逐张生成并等待用户确认，可切换为最多5张并发的批量模式。使用ToAPIs生成，内置品牌案例、模特卡与摄影方法。
metadata:
  package: "@petercjl/cloud-hug-style-transfer"
  version: 0.8.0
  source_skill: "cloud-hug-brand-upgrade"
  source_version: "1.1.0"
  workflow_revision: "2026-11-14-product-asset-set"
  upstream_version: "0.5.2"
---

# 抱抱云朵社品牌升级

把用户整理好的商品资料，转化成供同事现有 PSD 使用的新版品牌无字页面。确认产品资产图组负责外观与内部比例，资产组中的相对尺寸图负责相对体量，新版模板负责页面任务与 PSD 框位，案例图片在生图时只作品牌风格参考，模特卡负责身份和衣着。

**每屏一个方案、一张完整无字页面，三图和四宫格也各为一张。前期集中确认后规划整套，默认从第一屏起每次生成一张并等待用户确认；可明确切换批量模式，最多5张生成任务并发。** 具体停点与恢复规则统一见 [生成节奏](references/planning.md)。

> WorkBuddy / ToAPIs 迁移版，2026-11-12。基于用户 2026-11-11 交接包的业务规则。当前用户明确的数量、范围、模型和自主执行要求优先于参考资料中的默认流程；不例行要求重新确认，不自动追加付费任务。

品牌模板、人物与摄影方法保留。产品资产制作调用独立的 `product-asset-set` Skill；详情页媒体执行使用 `@petercjl/toapiscli` 配套 Skill；复用已导入的凭据，只保存图片、任务记录与对应清单。必要澄清和看图决定使用宿主可用问答能力，已有自然语言回复不要求补点按钮；多案、先审规划和拆图仅按明确要求启用。

## Package installation and local execution

The owning npm package is the canonical source. Installation instructions are in its INSTALL.md and UPDATE.md before Skill loading. Resolve the current Agent's supported Skill directory and use explicit `--path` with package-managed install/status/update. Named Agent identities describe conventions, not eligibility or directory defaults.

After managed installation, invoke this Skill's `scripts/run.mjs` with the current Node.js runtime for every owning-package CLI command below. The launcher uses the target-owned `.runtime` and bundled dependencies. Resolve this launcher relative to this Skill's actual directory; do not fall back to a shared global package when the installed runtime is missing. External service dependencies are declared separately and resolve their own canonical Skill through their documented CLI contract.

Maintenance completes CLI/runtime and Skill verification, followed by host-native reload and discovery. CLI receipts leave host discovery pending. Automatic checks notify by default; installation requires separate standing authorization and a compatible stable version. Use update operation/resume for partial or unknown outcomes, preserving the original transaction and backup. Only the selected current Agent is synchronized.

## 1. 接收资料与生成产品资产图组

确认用户要进行品牌升级；仅要求理解、复盘、修改 Skill 时只完成该范围。产品资产阶段先核验 product-asset-set 依赖并按其当前合同执行；进入详情页阶段时，按 [媒体执行](references/media-execution.md) 核验当前宿主的 `toapiscli`、服务访问与模型参数，详情页默认 `gpt-image-2.6-sunburst`、2K，用户明确选择优先。

实际查看用户整理好的全部商品资料，可为多角度实拍、旧详情页或两者组合，不要求新品先有旧详情页。按 [产品识别与资产交接](references/products.md) 识别来源、形态和款色；有旧详情页时综合首屏、卖点、场景、细节及明确款色信息判断主推范围，店铺总览、关联推荐不自动纳入。范围有依据后再建立形态分组、每组配色与来源关系。重复角度、光线差异和道具不重复计为款式；不同颜色不自动分成不同形态，也不按出现次数机械取舍。

每个已确认“形态＋配色”调用当前宿主的 `product-asset-set`，完成独立全貌、尺度与材质资产。按 [产品资产交接](references/product-assets.md) 解析并完整加载当前 callee 的 SKILL.md 与其交接协议，传入原始商品资料、明确款色、形态基准及已有授权；执行其逐张制作、验收与修订流程，再返回本流程。资产制作通过该 Skill 当前的 ToAPIs／Nano Banana 2.1 合同执行，输出画幅遵循其规划及用户明确选择；本 Skill 的 ToAPIs 默认值只用于详情页，不覆盖资产 Skill 的执行路线。

资产生成完成并通过文件检查、Agent 视觉自检后，进入 **图片审核** 环节：按 [图片审核](references/asset-review.md) 动态加载 `aigc-generation-review`，用实际生成记录制作当前资产图组的离线 HTML，包含有序参考图、真实提交提示词、模型参数与结果。生成审核页后展示其入口，再执行下述用户确认停点。审核 Skill 返回只表示审核文件已生成，不代表资产获准用于下游。

校验每套 `资产说明.txt`、独立文件、用途与哈希，实际对照原始商品验收后记录用户确认。生成资产全部展示后，必须将本项目置为 `awaiting-user-asset-confirmation` 并结束本轮，等待用户对当前资产版本的真实回复；在此之前不展开依赖这些资产的详细规划、不提交详情图、不预排自动执行任务。原图、计划和制作授权不代替成图确认，笼统自主执行授权也不跨过本停点。已确认同版本全部必需资产后，才进入第2步；修订图片后受影响确认失效。资产按自己的用途保留独立原件，详情页实际传入选中的图片，文字说明用于选图和追溯。缺少 callee 时返回 DEPENDENCY_MISSING 并给出安装提示，保留已完成识别；不自行改回拼卡生成。

## 2. 前期集中确认（同时确定整套范围）

展示**简短识别结论＋各款色资产目录与说明＋独立图片用途及验收结果＋四宫格四项内容＋整套范围与预计张数**，集中收集尚未明确的信息（详细依据放在项目文档）：

- 有几种形态，每种有哪些颜色，资产套数、各图用途与外观是否正确；来源和可核实范围。
- 每套全貌、相对尺寸、材质和按需结构图的编号、适用款色及来源局限；尺度由资产组的 scale 图片提供，不另设尺度制作或确认步骤。
- 07–10 展示模块按形态分组后需要几页；同形态双色是两套资产、一页展示。
- 12 四宫格要表达什么：可先提取旧页卖点，请用户确认、修改或提供新的内容，不能沿用模板的四种睡姿作为所有商品默认值。
- 本次特殊需求：指定展示重点、已明确的尺寸／输出要求、用户主动指定的模型等。已有答案直接使用，不要求填写长表。
- 按 [数量规则](references/planning.md) 列明实际页面清单、每屏一个方案／一张完整页、资产套数、独立资产张数与详情图张数分别多少，以及当前模型的已核验费用信息。说明默认每次生成一张并等待确认，也可选择最多5张并发的批量模式；整套张数与当前允许生成张数分开列明。仅做产品资产图组、规划或局部页面时保留该范围。

把采用前期依据、整套范围及默认逐张确认模式放在同一次确认中，已有明确答案直接沿用。前期确认齐全后进入规划，已获生成授权时按当前运行模式执行；用户仅要求规划时展示规划并停止；后续看图节点按 [生成节奏](references/planning.md) 执行。只确认产品资产图组不等于授权详情生成。

将确认内容、版本、依据和授权范围写入 [项目清单](references/canvas-comparison.md)。产品资产图组、尺度依据和四宫格内容准备齐全后再展开整套详细规划；允许事先盘点模板和计算数量，但不能用“待确认资产／待确认四格”的假设完成整套方案。用户已授权按证据自行决定时记录所用基准，未核实事实保持未知。修改只更新受影响记录，已确认且未变化的部分不重复询问。

## 3. 自动规划整套，每屏一个方案

读取 [页面映射](references/page-patterns.md)、[单案规划与交付数量](references/planning.md)，按需实际打开 [模板原图](references/detail-final-20261016.md)。在前期确认的范围内一次规划整套，每屏只写一个完整可执行方案。规划是 Agent 的执行依据；提供可访问入口和简短进度后继续生成，默认不等待审稿或选案。

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

实际提交给生图模型的提示词统一使用英语，包含产品资产阶段、详情页、局部修订与重生成。面向用户的规划说明、沟通和验收记录使用中文。资产阶段将此语言要求交给product-asset-set，按callee合同执行；提示词语言不改变参考语义、已确认构图与模型路线。

每屏先明确任务，再实际选择适用资产图，记录资产组版本、图片编号、用途及最终传入顺序，最后写完整英文提示词。每次详情生成都实际带入适用 scale 相对尺寸图，无人页和局部页同样如此；多款色／规格场景逐项对应，不用无关尺度图凑数。提示词聚焦动作、机位、场景、光线与本屏目标，外观和体量跟已选资产，图号与真实列表一致。每屏明确景别、款色、人物与产品组合、承托体块、前后景和呼吸空间；多图页分别写清各格职责，再组成这一屏的唯一方案。**固定 PSD 图片框和留位，变化发生在摄影构图内部。** 跨屏保留各自摄影职责，不为了统一风格把所有页面做成同一种画面。只有用户明确要求多个备选时，才按 [可选多案规则](references/planning.md) 规划对应数量。

摄影与审美继续按 [摄影方法](references/photography-method.md)；人物身份、默认奶白长袖长裤与素面袜按 [人物方法](references/model.md)。模板中的旧脸、短裤或裸足不覆盖当前模特卡。产品形态与内部比例以确认的全貌／结构资产为准，材质以选定的材质资产为准，相对体量按资产组的尺度图；动作和支点适应产品。品牌环境按摄影方法的固定基准，案例作为风格参考，摄影构图由本屏方案决定。

### 提示词知识库检查停点

集中写完整套英文提示词后，进入 [集中检查](references/queries/review-planned-prompts.md)，逐屏保存与实际提示词、有序参考和知识版本绑定的检查回执。到此知识依赖节点才按需读取 [知识结构](references/SCHEMA.md)、[入口](references/index.md)、[近期记录](references/log.md) 及当前查询所需主题；后续节点与维护来源延迟读取。只有受影响页的当前检查为 pass 才能进入已授权生成，检查不能代替成图审核。

用户反馈成图错误时，走 [反馈后复查](references/queries/review-revised-prompt.md)：定位、修订受影响规划与英文提示词，再利用同一知识库自检，返回当前页生成前停点。新prompt、参考或适用知识变化使原检查失效。用户只要求分析／改词时止于检查，不自动付费重生。

## 4. 按逐张或批量模式生成

执行 [规划与生成节奏](references/planning.md)：默认 `stepwise`：从本轮第一屏起只生成当前一张，完成自检并调用 `aigc-generation-review` 生成该张审核HTML，展示图片与报告后结束本轮等待用户确认；每张可修改、继续下一张或明确切换 `batch`。批量模式完成本轮全部待生成图片，同时排队或运行的任务最多5个；按原任务恢复状态补位，不因轮询超时释放名额。提交不明先查原任务。批量生成结束后调用同一审核Skill制作统一HTML，再汇总交付。具体调度与切换规则见生成节奏，报告范围与失败恢复见 [图片审核](references/asset-review.md)。

每次提交前核对当前知识库检查回执，再做 [实际提示词与请求核对](references/media-execution.md)，检查尺度依据、固定品牌风格、当前可生成页面和模型参数。资料冲突、服务失败或超出已授权费用时暂停受影响操作；未知任务先查询原记录。

### 用户反馈后的诊断、修订与再生成

用户指出成图问题时，从当前审核/确认节点进入 [反馈修订分支](references/queries/review-revised-prompt.md)：实际查看结果、逐字提交prompt和有序参考 → 区分提示词、参考、构图/动作与模型执行问题 → 简短反馈诊断与修改方向 → 局部修订完整英文prompt及必要参考 → 知识库复查 → 在当前明确授权内生成一次 → 双语图片审核 → 返回当前图确认节点。证据不足先澄清；仅分析不生图。用户已要求修图且依据齐全时继续执行，不重复询问许可。逐张修订完成后结束本轮等待确认，不自动生成下一页或连续付费重试。产品资产问题仍通过product-asset-set修订并重新确认；不在详情生成中绕过资产门阀。记录与故障恢复统一按该分支，知识方法按当前问题加载。

## 5. 生成与交付

按 [媒体执行](references/media-execution.md) 使用 ToAPIs：核验模型文档与参数 → 提交当前允许的页面 → 保存任务与有序参考 → 跟踪／恢复 → 下载 → 看图。默认 `gpt-image-2.6-sunburst`、2K；用户明确选择优先。参考图职责与实际提示词逐项一致。

产品资产图组与详情素材共用本轮进度和本地对照档案，分阶段编号。详情素材按 [图片与清单归档](references/canvas-comparison.md) 记录对应新版模板／图片位与成图文件；不要求旧页与新页一一对应。保存每张任务、文件、模板、方向和位置关系，恢复原任务，不自动重提不确定的付费生成。

全部交付为无排版文字图片：不生成标题、卖点标签、口号、版面 LOGO、水印或装饰文字；产品本体确认保留的标识不被误删。拆图不附带整页白边和文字栏，完整页保留对应框架与空白。图片比例、裁切与 PSD 衔接见 [版式与图片位](references/brand-layout.md)。

按 [基础验收与项目清单](references/canvas-comparison.md) 实际查看成图，核对产品形态、尺度、品牌风格、页面任务与人物肢体。明显错误如实标记；Agent 自检通过后仍按当前看图节点交用户决定，不能代替用户确认。

**详情图图片质检。** 按 [图片审核](references/asset-review.md) 动态加载 `aigc-generation-review`：逐张模式每次生成或修订一张后，使用该次真实任务记录生成单张审核HTML，再展示并等待用户确认；批量模式结束后对本轮当前成果统一生成一份HTML。报告展示实际有序参考、逐字提交提示词、参数与结果，并保留Agent自检发现；HTML生成成功不代替用户接受。审核失败保留图片，停在报告节点恢复，不自动重新生图。

单张验收之外，核对整套产品外观、人货尺度与品牌一致性，以及各屏任务是否落实。只有用户明确要求多个备选时，才增加 [多案对照验收](references/planning.md)。每完成确认、提交、下载或验收，更新同一项目清单及总览当前状态；从中断处恢复时沿用已有确认和原任务。

交付图片目录、文件与模板对应清单及关键未完成项；不创建在线画板；产品资产及详情图片审核 HTML 由 `aigc-generation-review` 生成，直接引用本地原图，默认留在本地项目审核目录。PSD交接包只包含最终确认图片、页面对应清单和排版说明；用户明确要求分享审核证据时另行整理，不默认打包报告、参考图、提示词或回执。保留原始生成输出，按当前用户约定的交付与缓存位置保存成果副本；未指定时使用本轮项目目录，不依赖作者私人目录。不得将有路径或任务 ID 当作已完成视觉验收。

## 资料按需读取

| 阶段 | 入口 |
| --- | --- |
| 产品资产、逐张详情及批量详情的图片审核HTML与返回 | [asset-review.md](references/asset-review.md) |
| 嵌套资产 Skill 的解析、交接、失败与返回 | [product-assets.md](references/product-assets.md) |
| 商品识别、资产生成、前期集中确认 | [products.md](references/products.md) |
| 资产组中的相对尺寸图、适用范围及尺度验收 | [product-scale.md](references/product-scale.md) |
| 模板页与形态分组、12 卖点映射 | [page-patterns.md](references/page-patterns.md) |
| 整套单案规划、数量及按需多案 | [planning.md](references/planning.md) |
| 原图位置与用途 | [assets.md](references/assets.md)、[模板索引](references/detail-final-20261016.md) |
| 摄影与人物 | [photography-method.md](references/photography-method.md)、[model.md](references/model.md) |
| PSD 比例、留白、拆图／整页 | [brand-layout.md](references/brand-layout.md) |
| 工具与本地归档 | [media-execution.md](references/media-execution.md)、[canvas-comparison.md](references/canvas-comparison.md) |
| 质量问题定位 | [cases.md](references/cases.md) |
| 本地版本、来源、依赖维护 | [maintenance.md](references/maintenance.md) |

所有内置路径相对本 Skill 根目录；先解析当前实际位置。新流程以本入口、页面映射、用户确认资料为准，历史案例只提供指定的摄影依据。

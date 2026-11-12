# ToAPIs 媒体执行

本 Skill 只通过当前宿主安装的 `@petercjl/toapiscli` 生图。加载其完整 `SKILL.md`，复用用户已经导入的凭据；不读取、复制或打印凭据文件，不把账号配置放进品牌包。以下以已核验的 `toapiscli` 0.1.1 合同为基线，参数仍须以当前 CLI 和模型文档为准。

## 1. 找到当前宿主的媒体入口

在本 Skill 的实际目录执行 `node scripts/check-media.mjs`。默认寻找同一宿主技能目录下的 `toapiscli`；非同级安装时使用 `--skill-root EXACT_TOAPIS_SKILL_DIRECTORY` 或本进程的 `CLOUD_HUG_TOAPIS_SKILL_ROOT`。检查器验证 Skill 名称、独立 `.runtime`、包名、版本及命令合同，返回 `invocation.command` 和 `invocation.args`。Windows 也用当前 Node 直接运行已核验的 `.mjs`，不依赖全局 npm shim。

后文 `node VERIFIED_MEDIA_ENTRY` 表示上述返回的实际 Node 与 CLI 路径。缺少运行时或合同不兼容时停止生图并报告缺口；已有资料的本地分析可以继续。不得改用其他宿主的全局包、旧媒体包、裸 HTTP/MCP 请求或其他渠道绕过检查。

## 2. 提交前

1. 按媒体 Skill 执行 `prepare --json`；遵守该安装已有更新策略。仅做固定版本验证时可在测试进程设置 `TOAPISCLI_UPDATE_CHECK=0`、`TOAPISCLI_AUTO_UPDATE=0`，不得擅自改写持久策略。
2. 执行 `auth status --json`、`models list --json`，确认配置与模型权限；这不等于已完成生图。执行 `models docs --model MODEL_ID --json`，核对支持的参考数量、分辨率、比例、费用与当前可用性。
3. 用户未指定模型时默认 `gpt-image-2.6-sunburst`、2K；已指定模型优先。当前 CLI 支持的模型包含 `doubao-seedream-5-5`、`gemini-nano-banana-2.1`、`gpt-image-2.6-sunburst`，不得凭旧文档使用 2.5 ID。默认模型不可用时报告，不能静默替换。
4. 实际查看输入。按本轮产品卡、独立尺度照片、人物卡、模板的各自职责组织参考，并明确每张只控制什么。产品卡阶段使用互补外观依据；有人货互动的详情页调用实际传入适用比例照片，按 [尺度规则](product-scale.md) 将规格、已有尺寸与各互动格位的身体参照写入提示词，不能只写路径。整次无人调用不传人物卡或人货照片；混合整页明确各格有无人物。必要依据超出参考上限时先去掉重复氛围参考，仍不足则说明缺口，不静默省略尺度图。不得让历史产品、比例照片中的人物或模板旧脸覆盖当前商品和模特身份。
5. 在项目目录保存 UTF-8 提示词和清单；记录有序参考、SHA-256、职责、所用尺度依据、模型、参数、页面／图片位及授权张数。默认 `pages` 每屏一个方案、一个生成任务，交付一张包含全部格位的完整无字页；不能按四宫格展开成四次提交。默认按完整模板页选择受支持的 `--aspect`，仅明确拆图时按 PSD 图片位选择；不使用 `auto`，不能把任意原始像素值当作受支持比例。不能满足精确尺寸时先说明需要后处理，保留原图。
6. 当前 CLI 没有 `--dry-run`、`--ratio`、`--count` 或 `--archive`。本地参数核对不需要发请求；一条 `image generate --submit` 创建一个付费生成任务。先核对前期确认的总数量，按授权逐项提交；只读清单的 `generation_authorized: false` 不覆盖项目已有授权，不据此重新询问。默认不生成 A/B/C 或额外试图。

## 3. 提交与恢复

前期依据和整套范围已确认、整套单案规划自检通过后，连续执行范围内各项。可以按难度先后或服务能力分批，批次完成后自动继续，不默认要求用户选两张试跑或批准下一批。新事实冲突、服务阻塞或超范围的付费返工只暂停受影响步骤；独立且已授权的页面继续。每次提交前核对该清单项是否已有任务目录／回执，恢复原任务而非重复创建。

命令示例中的路径须替换为真实绝对路径，每项任务使用新的独立输出目录：

```text
node VERIFIED_MEDIA_ENTRY image generate --model gpt-image-2.6-sunburst --prompt-file PROMPT.txt --resolution 2K --aspect 3:2 --reference PRODUCT_CARD.jpg --reference SCALE_PHOTO.jpg --reference MODEL_CARD.png --reference TEMPLATE.jpg --out-directory NEW_TASK_DIRECTORY --submit --wait --timeout 45 --json
```

上例为有人货互动的单次调用，比例、模型和参考数量以上一步文档与本轮规划为准，不把示例 `3:2` 当作所有模板的固定比例；无人页和产品卡不照搬人物与尺度输入。提交后保留 CLI 在该目录写出的 `request.json`、任务回执和下载文件。记录真实生成 ID、任务 ID、状态与实际 `billing`；缺失或未结算的费用保持未知，不以模型报价假装实扣金额。

超时、断线、待完成或结果未知时，先检查原目录，再执行：

```text
node VERIFIED_MEDIA_ENTRY task get --directory ORIGINAL_TASK_DIRECTORY --json
node VERIFIED_MEDIA_ENTRY task wait --directory ORIGINAL_TASK_DIRECTORY --timeout 45 --json
```

恢复定位依据是**原输出目录**，不能只把任务 ID 换到其他命令。不要重新调用 `image generate` 猜测是否成功，不清空、不覆盖或复用已有请求目录。仍未知则保留现状并报告。新建付费返工任务必须在当前明确授权范围内。

## 4. 下载与验收

确认实际文件存在、格式和尺寸可读，实际查看产品结构、配色、人物、光色、受力、图片位、无排版文字要求；按独立比例依据检查各互动格位与跨页的实物体量，不能因外观正确就判尺度通过。默认核对每屏一个方案且只有一张完整页、三图／四格内容齐全且符合各格任务。模型成功仅说明生成链路完成；美术不合格标记 `needs-fix` 并记录具体偏差，不能同时报告全部通过。保留原始图片，并按 [图片与对应清单](canvas-comparison.md) 归档。

不创建在线画板、不上传对照素材、不生成 HTML。宿主能否发现 Skill、宿主能否查看图片、CLI 能否完成真实生图是三项独立证据；只验证其中一项不能宣称全部通过。

# ToAPIs 媒体执行

本 Skill 只通过当前宿主安装的 `@petercjl/toapiscli` 生图。加载其完整 `SKILL.md`，复用用户已经导入的凭据；不读取、复制或打印凭据文件，不把账号配置放进品牌包。以下以已核验的 `toapiscli` 0.1.1 合同为基线，参数仍须以当前 CLI 和模型文档为准。

## 1. 找到当前宿主的媒体入口

在本 Skill 的实际目录执行 `node scripts/check-media.mjs`。默认寻找同一宿主技能目录下的 `toapiscli`；非同级安装时使用 `--skill-root EXACT_TOAPIS_SKILL_DIRECTORY` 或本进程的 `CLOUD_HUG_TOAPIS_SKILL_ROOT`。检查器验证 Skill 名称、独立 `.runtime`、包名、版本及命令合同，返回 `invocation.command` 和 `invocation.args`。Windows 也用当前 Node 直接运行已核验的 `.mjs`，不依赖全局 npm shim。

后文 `node VERIFIED_MEDIA_ENTRY` 表示上述返回的实际 Node 与 CLI 路径。缺少运行时或合同不兼容时停止生图并报告缺口；已有资料的本地分析可以继续。不得改用其他宿主的全局包、旧媒体包、裸 HTTP/MCP 请求或其他渠道绕过检查。

## 2. 提交前

1. 按媒体 Skill 执行 `prepare --json`；遵守该安装已有更新策略。仅做固定版本验证时可在测试进程设置 `TOAPISCLI_UPDATE_CHECK=0`、`TOAPISCLI_AUTO_UPDATE=0`，不得擅自改写持久策略。
2. 执行 `auth status --json`、`models list --json`，确认配置与模型权限；这不等于已完成生图。执行 `models docs --model MODEL_ID --json`，核对支持的参考数量、分辨率、比例、费用与当前可用性。
3. 用户未指定模型时默认 `gpt-image-2.6-sunburst`、2K；已指定模型优先。当前 CLI 支持的模型包含 `doubao-seedream-5-5`、`gemini-nano-banana-2.1`、`gpt-image-2.6-sunburst`，不得凭旧文档使用 2.5 ID。默认模型不可用时报告，不能静默替换。
4. 实际查看输入。按本轮产品卡、人物卡、模板职责排序参考，并明确每张只控制什么。对有效的互补视角必须实际传入文件，不能只在提示词写路径。不得让历史产品或模板旧脸覆盖当前商品和人物身份。
5. 在项目目录保存 UTF-8 提示词和清单；记录有序参考、SHA-256、模型、参数、图片位及授权张数。依据 PSD 图片位明确选择受支持的 `--aspect`；不使用 `auto`，不能把任意原始像素值当作受支持比例。不能满足精确尺寸时先说明需要后处理，保留原图。
6. 当前 CLI 没有 `--dry-run`、`--ratio`、`--count` 或 `--archive`。本地参数核对不需要发请求；一条 `image generate --submit` 创建一个付费生成任务。先核对总数量，按授权逐项提交，不能把默认 A/B/C 规划变成未授权的三次生成。

## 3. 提交与恢复

命令示例中的路径须替换为真实绝对路径，每项任务使用新的独立输出目录：

```text
node VERIFIED_MEDIA_ENTRY image generate --model gpt-image-2.6-sunburst --prompt-file PROMPT.txt --resolution 2K --aspect 3:2 --reference PRODUCT_CARD.jpg --reference TEMPLATE.jpg --out-directory NEW_TASK_DIRECTORY --submit --wait --timeout 45 --json
```

模型、比例和参考数量以上一步文档与本轮规划为准。提交后保留 CLI 在该目录写出的 `request.json`、任务回执和下载文件。记录真实生成 ID、任务 ID、状态与实际 `billing`；缺失或未结算的费用保持未知，不以模型报价假装实扣金额。

超时、断线、待完成或结果未知时，先检查原目录，再执行：

```text
node VERIFIED_MEDIA_ENTRY task get --directory ORIGINAL_TASK_DIRECTORY --json
node VERIFIED_MEDIA_ENTRY task wait --directory ORIGINAL_TASK_DIRECTORY --timeout 45 --json
```

恢复定位依据是**原输出目录**，不能只把任务 ID 换到其他命令。不要重新调用 `image generate` 猜测是否成功，不清空、不覆盖或复用已有请求目录。仍未知则保留现状并报告。新建付费返工任务必须在当前明确授权范围内。

## 4. 下载与验收

确认实际文件存在、格式和尺寸可读，实际查看产品结构、配色、人物、光色、受力、图片位、无排版文字要求。模型成功仅说明生成链路完成；美术不合格要记录具体偏差。保留原始图片，并按 [图片与对应清单](canvas-comparison.md) 归档。

不创建在线画板、不上传对照素材、不生成 HTML。宿主能否发现 Skill、宿主能否查看图片、CLI 能否完成真实生图是三项独立证据；只验证其中一项不能宣称全部通过。

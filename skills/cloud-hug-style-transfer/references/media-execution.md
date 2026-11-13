# ToAPIs 媒体执行

本 Skill 只通过当前宿主安装的 `@petercjl/toapiscli` 生图。加载其完整 `SKILL.md`，复用用户已经导入的凭据；不读取、复制或打印凭据文件，不把账号配置放进品牌包。以下以已核验的 `toapiscli` 0.1.1 合同为基线，参数仍须以当前 CLI 和模型文档为准。

## 1. 找到当前宿主的媒体入口

在本 Skill 的实际目录执行 `node scripts/check-media.mjs`。默认寻找同一宿主技能目录下的 `toapiscli`；非同级安装时使用 `--skill-root EXACT_TOAPIS_SKILL_DIRECTORY` 或本进程的 `CLOUD_HUG_TOAPIS_SKILL_ROOT`。检查器验证 Skill 名称、独立 `.runtime`、包名、版本及命令合同，返回 `invocation.command` 和 `invocation.args`。Windows 也用当前 Node 直接运行已核验的 `.mjs`，不依赖全局 npm shim。

后文 `node VERIFIED_MEDIA_ENTRY` 表示上述返回的实际 Node 与 CLI 路径。缺少运行时或合同不兼容时停止生图并报告缺口；已有资料的本地分析可以继续。不得改用其他宿主的全局包、旧媒体包、裸 HTTP/MCP 请求或其他渠道绕过检查。

## 2. 输入与提交前核对

按媒体 Skill 执行 `prepare --json`、`auth status --json`、`models list --json` 与 `models docs --model MODEL_ID --json`，核对服务权限、参考上限、分辨率、比例与费用。默认 **`gpt-image-2.6-sunburst`、2K**；用户明确选择优先，默认模型不可用时报告，不静默替换。仅做固定版本本地验证时可在测试进程关闭更新检查，不改写持久策略。

实际查看所用图片，按真实提交顺序说明职责：

| 图像输入 | 职责与适用范围 |
| --- | --- |
| 确认产品卡 | 产品外观、内部结构与比例、配色和材质 |
| 独立人货尺度图 | 按 [尺度规则](product-scale.md) 负责相对体量；无人陈列只借体量，不带入人物或背景 |
| 当前模特卡 | 本次有人物时负责身份与衣着；纯产品页不传 |
| 现有品牌案例 | 只参考 [品牌风格](photography-method.md)，不规定原人物动作、家具位置和旧商品占位 |

产品卡阶段使用互补商品外观依据，不照搬详情输入。超参考上限时先去掉重复氛围图，不能悄悄省略必要产品或尺度依据。模板编号及格位留在规划中，实际风格参考另记路径；不强制上传对应整页模板。

在项目内保存 UTF-8 提示词、有序参考及哈希、模型参数和目标页。**发送前只对这份实际提示词和本次请求做一次以下核对**，不以规划表或已经读过 Skill 代替：

| 核对项 | 通过条件 |
| --- | --- |
| 尺度与图号 | 实际传入适用尺度图，图号职责一致；大小只指向图像，没有新估厘米、身体／家具比例或产品到达的身体端点；内部形态仍服从产品卡 |
| 风格与本屏任务 | 提示词包含摄影方法的固定品牌基准，未被住宅／全米白描述覆盖；各格任务与本轮方案一致，案例仅作风格参考 |
| 当前可生成范围 | 按 [生成节奏](planning.md) 与清单中的模式、当前页／批和用户决定执行；等待确认时不发送后续请求 |
| 参数与张数 | 默认模型和 2K 明确写入调用；每屏一个整页任务，三图／四格不拆开付费提交；画幅按本屏要求 |

发现冲突先修正这份提示词／请求，再发送。核对语义，不机械删除描述人体接触、画幅或留白的正常句子。

按完整模板页选工具支持的 `--aspect`，明确拆图时才按图片位；不使用 `auto` 或把任意像素值当成比例。精确尺寸无法直接满足时说明后处理需要，保留原图。当前已核验 CLI 不提供 `--dry-run`、`--ratio`、`--count` 或 `--archive`；本地核对无需付费请求。数量工具的 `generation_authorized: false` 不覆盖已有授权，也不取消看图停点。

## 3. 提交与恢复

根据 [生成节奏](planning.md) 提交当前允许的页面，首批及逐张模式均在展示后等待。批量模式才连续推进剩余页面。每次先查本页是否已有任务目录／回执；未知任务查询恢复，不能重复创建。资料冲突、服务失败或超范围返工只暂停受影响操作，不绕过本轮看图边界。

命令示例中的路径须替换为真实绝对路径，每项任务使用新的独立输出目录：

```text
node VERIFIED_MEDIA_ENTRY image generate --model gpt-image-2.6-sunburst --prompt-file PROMPT.txt --resolution 2K --aspect 3:2 --reference PRODUCT_CARD.jpg --reference SCALE_PHOTO.jpg --reference MODEL_CARD.png --reference STYLE_REFERENCE.jpg --out-directory NEW_TASK_DIRECTORY --submit --wait --timeout 45 --json
```

上例为有人货互动的单次调用，比例、模型和参考数量以上一步文档与本轮规划为准，不把示例 `3:2` 当作所有模板的固定比例；无人页不传模特卡但整体陈列仍传适用尺度图并明确无人，产品卡不照搬人物、尺度或场景输入。提交后保留 CLI 在该目录写出的 `request.json`、任务回执和下载文件。记录真实生成 ID、任务 ID、状态与实际 `billing`；缺失或未结算的费用保持未知，不以模型报价假装实扣金额。

超时、断线、待完成或结果未知时，先检查原目录，再执行：

```text
node VERIFIED_MEDIA_ENTRY task get --directory ORIGINAL_TASK_DIRECTORY --json
node VERIFIED_MEDIA_ENTRY task wait --directory ORIGINAL_TASK_DIRECTORY --timeout 45 --json
```

恢复定位依据是**原输出目录**，不能只把任务 ID 换到其他命令。不要重新调用 `image generate` 猜测是否成功，不清空、不覆盖或复用已有请求目录。仍未知则保留现状并报告。新建付费返工任务必须在当前明确授权范围内。

## 4. 下载与验收

确认文件存在、格式与像素可读，按 [基础验收与项目清单](canvas-comparison.md) 实际看图并记录问题，再按当前看图节点展示。保留原始输出，另存交付副本；服务成功不等于视觉通过，Agent 自检不代替用户继续决定。

不创建在线画板、不上传对照素材、不生成 HTML。宿主能否发现 Skill、宿主能否查看图片、CLI 能否完成真实生图是三项独立证据；只验证其中一项不能宣称全部通过。

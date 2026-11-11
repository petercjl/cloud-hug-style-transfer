# SealSeek 执行与恢复

本 Skill 负责原页整理、品牌约束、提示词、逐屏对应和验收。`@petercjl/sealseek-media-cli` 及其当前规范 Skill 负责认证、能力、上传、生成、任务、下载与可选画板。保留这条技术链，不调用旧品牌升级 Skill，不写私有 HTTP 请求，不把本包伪装成媒体运行时。

## 入口与依赖

从宿主已经发现的 Skills 定位 `sealseek-media` 的实际安装目录，读其 `SKILL.md`。需 Node.js 22+、命令执行、图片查看、文件读写和有效服务认证。拼接与裁切另需 Python 3.8+ 和 Pillow；可用已有环境，不为普通任务安装全局依赖。

本包提供只读入口核验：

```text
node <SKILL_ROOT>/scripts/check-media.mjs --skill-root <MEDIA_SKILL_ROOT> --agent <AGENT_NAME>
```

输出入口身份、版本和 invocation；核验不登录、不上传、不生图、不证明服务有额度。它要求媒体 Skill 自有 `.runtime` 与 `scripts/run.mjs`，不退回共享全局包。缺少受管运行时按规范安装合同修复，不能因为同名命令能运行就绕过安装隔离。

后续所有媒体命令通过该目录 `scripts/run.mjs`，并按当前媒体合同显式绑定宿主名称与 Skill 路径。`AGENT_NAME` 从当前宿主与媒体包支持的适配器确定：Codex 使用 `codex`；没有命名适配器的宿主使用 `generic`。只给自定义 `--skill-path` 可能会被归为 generic，不能把它当作已绑定 Codex。核验助手只转交调用者提供的宿主名，不替代媒体包对适配能力的检查。以下 `node` 代表当前可用 Node；路径含空格时按当前 shell 正确引用：

```text
node <MEDIA_SKILL_ROOT>/scripts/run.mjs skill source --json
node <MEDIA_SKILL_ROOT>/scripts/run.mjs capabilities --live --agent <AGENT_NAME> --skill-path <MEDIA_SKILL_ROOT> --json
```

完整读取返回的当前规范 Skill 与适用宿主 adapter，参数细节以当前包为准。发现成功后复用同轮结果；版本、账户或能力变化再查。认证问题交由规范登录界面，凭据不写入本 Skill、提示词或项目记录。

Skill 更新/审阅/打包以及本地分屏阶段，不运行 live 命令、不登录、不创建画板、不上传图片。

## 模型、参考、比例

未点名模型时不传 `--model`，使用媒体包当前默认值。只有用户明确选定模型才传它；不得为了中文、比例、成本或失败恢复自动换模型。先从当前能力确定默认/指定 ID，再用 `models show ID --live --json` 获取比例、分辨率和参考数量限制。

每张实际提交的有序参考：

1. 当前这张完整分屏原页：唯一内容、原文、版式、商品、人物和摄影结构依据。
2. 可选一张已查看的原 Skill 品牌正例：从 [素材索引](asset-index.md) 的原品牌图库选取，只决定棚景、环境色、光线和材质，不带入示例商品、人物、动物、构图或文字。用户的“新详情页”及 `assets/layout-pairs/after/` 只是前后内容版式对照，不作风格图传入。

参考图真正通过 `--reference` 传入。若参考数量受限，优先去掉可选风格图并在文字中描述风格，不能去掉原页。有人物的静态图片按当前 image 合同处理，不错误套用视频人物审核流程。记录真实参考顺序和职责，不把 Agent 看过但没提交的图片列为模型输入。

目标为原分屏比例与尺寸。当前模型不支持精确像素输入时不要编造 `--size` 参数。先检查是否支持对应比例或原图比例继承；不能用新增外侧留白、改变原留白、拉伸或裁内容来适配预设比例。任何会改变图文、产品比例或主体裁切的方案都不自动执行。若核心要求无法满足，说明具体不支持项并保留该屏待处理，不用不同模型试错。不要把允许的分辨率档位当作实测尺寸。

## 一屏一次首次提交

将每屏完整提示词保存为 UTF-8 文件，避免 shell 转义破坏中文和换行。请求必须明确当前原页的保留项，以及清除原图中实际存在的墙、窗、墙角等建筑结构，转换为连续白色开放概念摄影棚；不能只写抽象“品牌化”或“保留原场景”。旧背景很明显时也不能降低清除要求。以下为需要代入实测路径和当前支持参数的调用结构；`RATIO` 和 `RESOLUTION` 不是默认值：

```text
node <MEDIA_SKILL_ROOT>/scripts/run.mjs image generate --prompt-file <PROJECT>/prompts/01.txt --reference <PAGE_01> --reference <STYLE_EXAMPLE> --ratio RATIO --resolution RESOLUTION --count 1 --output <PROJECT>/generated/01 --archive none --agent <AGENT_NAME> --skill-path <MEDIA_SKILL_ROOT> --dry-run --json
```

可选风格参考不用时删除第二个 `--reference`。当前 CLI 不支持示例参数时依据其规范调整命令，不改变业务约束。dry-run 不上传或生图；通过后只将 `--dry-run` 换为 `--submit`，在已授权范围执行。每屏一个任务、一个输出，原页里的多图片模块仍是一张完整页面。

用户明确要求本轮转换，且范围与数量已明确，就执行对应首次生成；不再插入产品卡、三案、试稿或例行批准。用户只让分析/预览时不提交。额外方案和付费重生不能借“质量修复”无限扩张。

提交立即保存任务 ID、实际提示词、参考、非敏感参数、屏号与输出目录。逐张提交和收集，默认按原页顺序；若运行环境并行，仍保持明确一一对应且不重复提交。任务运行时按实际状态报告进展。

## 跟踪、恢复和文件验证

沿用当前包的 `task get/wait/resume/diagnose/download`：

```text
node <MEDIA_SKILL_ROOT>/scripts/run.mjs task get TASK_ID --agent <AGENT_NAME> --skill-path <MEDIA_SKILL_ROOT> --json
node <MEDIA_SKILL_ROOT>/scripts/run.mjs task wait TASK_ID --timeout 30 --agent <AGENT_NAME> --skill-path <MEDIA_SKILL_ROOT> --json
node <MEDIA_SKILL_ROOT>/scripts/run.mjs task download TASK_ID --output <NEW_RECOVERY_DIR> --agent <AGENT_NAME> --skill-path <MEDIA_SKILL_ROOT> --json
```

等待单次不超过 60 秒。失败先 diagnose；未知提交、超时、中断先查询同一个 task ID 与已有远端记录，不自动 `--new`、不新建 ID 重试。下载失败恢复下载；画板失败修复现有输出归档；不为取回或保存再生一张。回执未知且没有本地 ID 时查同轮任务/历史，无法确定则记录阻塞，不盲目重提。

确认 succeeded、真实 URL、本地文件可打开、实际尺寸和 count=1，再按主入口逐张新旧对照。每个摄影区域（包括色卡的每个小格）检查没有住宅墙窗等结构；白墙、虚化墙角和窗影仍是失败。文字、产品、构图或棚景约束失败时保留任务证据；可确定性修复的在副本处理，涉及新付费生成按已有明确授权范围执行。最终成图放 `final/`，原始生成文件保留，未通过结果不混入已通过交付。

本地文件交付不强制新建画板。用户要求或本轮已明确授权画板时，读取 [canvas-comparison.md](canvas-comparison.md)；同一任务/同一批次恢复，不重复创建。

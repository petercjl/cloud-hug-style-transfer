# 图片与对应清单

文件名保留以兼容旧链接；当前交付只包含图片与对应清单，不使用在线画板或本地 HTML。

在当前项目内保存原始输入、提示词、每次请求目录和结果，不能把创作产物写进 Skill 安装目录。每次生成保留原目录和 CLI 写出的请求、状态与下载文件；另存交付副本时不移动或覆盖原图。

`manifest.json` 包含项目 ID、媒体包版本和 `items` 数组。每项记录：

- `id`、`stage`（product-card 或 detail）、`page_id`、`template`、`product_group`、`variant`、`direction`、`slot`。
- `promptFile`、`references`（有序数组，每项含 path、sha256、role）、`model`、`parameters`、`taskDirectory`。
- `generationId`、`taskId`、`status`、`billing`（原回执实际费用；未知用 null）、`outputs`（实际路径、宽高、SHA-256）。
- `review`（pending / pass / needs-fix，具体已核对项及问题）、`deliveryFiles` 与必要的未完成说明。

不适用的字段用 null；只登记真实文件和返回 ID，不编造链接。模板编号与实际屏序分开记录，产品卡与详情素材分阶段编号。图片位拆分交付需保留模板、方向和位置关系，保证同事能放回对应 PSD。

恢复时读取原 `taskDirectory`，查询原任务并更新同一清单项；不能另建重复记录掩盖未知或失败状态。最终核对授权清单、成图数量、文件可读性和美术验收状态，交付图片目录与 `manifest.json`。

# 图片与对应清单

文件名保留以兼容旧链接；当前交付只包含图片与对应清单，不使用在线画板或本地 HTML。

在当前项目内保存原始输入、提示词、每次请求目录和结果，不能把创作产物写进 Skill 安装目录。每次生成保留原目录和 CLI 写出的请求、状态与下载文件；另存交付副本时不移动或覆盖原图。

`manifest.json` 包含项目 ID、媒体包版本、独立 `scale_basis` 记录和 `items` 数组。`scale_basis` 按 [尺度规则](product-scale.md) 保存适用产品／规格、已有尺寸及出处、比例照片路径与 SHA-256、可见参照关系及限制；不按产品卡数量复制或配套。每项生成记录：

- `id`、`stage`（product-card 或 detail）、`page_id`、`template`、`product_group`、`variant`、`direction`、`slot`。
- `promptFile`、`references`（有序数组，每项含 path、sha256、role）、`model`、`parameters`、`taskDirectory`。
- 详情页所用 `scale_basis_ids`；有互动时记录各格位对应的尺度依据及计划身体参照。`references.role` 区分 product-appearance、human-product-scale、model-identity、page-template；不能只登记比例文件而不实际提交。
- `generationId`、`taskId`、`status`、`billing`（原回执实际费用；未知用 null）、`outputs`（实际路径、宽高、SHA-256）。
- `review`（pending / pass / needs-fix，具体已核对项及问题）、`deliveryFiles` 与必要的未完成说明。

不适用的字段用 null；只登记真实文件和返回 ID，不编造链接。模板编号与实际屏序分开记录，产品卡与详情素材分阶段编号。默认整页任务按 `page_id + direction` 记录一个输出，`slot` 为 `page`，另记其中的内容格位，不展开成三条或四条生成任务。仅明确拆图时按格位分别记录。验收中保存尺度对照结论，未看清的项目标为未验证，不以卡片外观验收代替尺度验收。

恢复时读取原 `taskDirectory`，查询原任务并更新同一清单项；不能另建重复记录掩盖未知或失败状态。最终核对授权清单、成图数量、文件可读性和美术验收状态，交付图片目录与 `manifest.json`。

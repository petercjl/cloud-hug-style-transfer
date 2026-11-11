# 原品牌图库与内容版式对照

所有路径相对 Skill 根目录。图片必须实际打开后选用，不能只凭文件名宣称已查看。一次只取与当前页相容的品牌参考；当前原页决定全部内容和构图，图库仅辅助风格。

## 原 Skill 品牌正例：风格依据

| 资源 | 可借鉴内容 | 不迁移内容 |
| --- | --- | --- |
| `assets/brand/main-kv-sleep.webp` | 连续低信息棚景、浅蓝床面、奶白织物、中性柔光 | 睡姿、机位、床的大小、商品与人物 |
| `assets/brand/main-kv-lounge.webp` | 蓝白承托、自然材质、松弛的接触和受力 | 参考人物、姿势、商品数、家具占幅 |
| `assets/brand/main-kv-seated-hug.webp` | 主体接触清楚、柔光和自然前后清晰度 | 闭眼、笑意、坐姿或观察角度 |
| `assets/brand/main-kv-dog-rest.webp` | 生活感与提炼棚景、木质与织物温度 | 动物、商品、人物或场景叙事 |
| `assets/approved/quiet-prone-user-finish.webp` | 自然卸力、触感、低反差的舒展状态 | 俯卧、无字交付或拉远镜头 |
| `assets/approved/overhead-breathing-user-finish.png` | 承托层次、外围连续空间、柔光 | 将当前页改成俯拍或缩小主体 |
| `assets/approved/all-colors-user-finish.webp` | 群组材质、色彩区分和自然承托 | 历史产品款式、数量、布局 |
| `assets/approved/dog-detail.webp`、`hippo-detail.webp`、`rabbit-detail.webp` | 对应题材的商品质感和摄影表达 | 历史动物造型及面料纹理 |
| `assets/approved/detail-final-20261016/01.jpg` 至 `19.jpg` | 原已认可连续详情的品牌视觉库；按当前页需要选摄影或信息页参照 | 这 19 张不是当前套版模板，不决定页数、屏序、跳过页或生成任务 |

19 张定稿的内容索引：01 品牌展示，02 服务识别，03 安睡陪伴，04 俯看休息，05 轻快活动，06 近景抱持，07–10 单品与细节组合，11 沙发拥抱，12 四格使用，13 站立体量，14 沙发接触，15 商品组合，16 材料信息，17 尺寸，18 须知，19 情绪收尾。索引用于寻找相近题材，不规定本轮画面。

`assets/brand/layout-reference.jpg`、`assets/brand/logo-blue.png` 和 `assets/approved/brand-kv-user-finish-20261012.png` 为原品牌图文资产，保留来源；不自动换掉当前原文版式或添加 Logo。只有当前请求确有用途才使用。

每个正例都受最新场景硬约束限制：历史图中若可见墙面、窗、建筑边界或与当前图不符的主体，不采纳该部分；挑更合适的正例或仅使用其可用光色材质信息。正例不能免除逐格场景检查。

## 用户提供的前后页：仅示范内容与版式对应

内置 `assets/layout-pairs/before/01.jpg` 至 `10.jpg` 来自本次用户已分屏旧页；`assets/layout-pairs/after/01.png` 至 `10.png` 来自用户提供的“新详情页”。[对应清单](../assets/layout-pairs/pairs.json) 将它们一一配对。

| 对照编号 | 保留关系示例 |
| --- | --- |
| 01 | 首屏完整原文、图形与主场景的上下关系 |
| 02–05 | 卖点标题、辅助文字和对应场景保持一屏 |
| 06 | 产品信息表与完整说明保持整体 |
| 07 | 颜色合集保留整屏格位、标签和排列 |
| 08 | “产品展示”标题和第一张展示图同屏 |
| 09–10 | 无标题完整展示图分别独立 |

这些后图不是新风格基准，不覆盖原品牌文字与图库；默认仅供 Agent 理解保留关系，不传作每次生成的风格参考。对照中的具体月亮商品、人物、动物、文字和摄影关系不移植到其他页。示例可能存在生成偏差：当前原图和明确约束优先，新增物件、改色或住宅结构都不能因为出现在示例中就被允许。

## 历史诊断图：不作为正向生成参考

- `assets/rejected/all-colors-b.webp`：住宅化、偏暖或背景光线误读的诊断。
- `assets/rejected/overhead-rest-b.webp`、`prone-pile-a.webp`：构图、承托和图文任务偏差的诊断；本次不能照历史修正方式更换机位或删掉原文。
- `assets/rejected/brand-kv-a2-20261012.webp`、`brand-kv-b2-20261012.webp`、`brand-kv-c2-20261012.webp`：历史图文偏差诊断。
- `assets/references/`：上述旧案例的来源图片，仅保留追溯价值，不作为本轮内容或风格主依据。

原 `assets/products/`、`assets/model/` 产品卡与固定模特卡不装入本包。资产字节校验见根目录 `INTEGRITY.json`，拷贝来源见 `PROVENANCE.json`。关键图丢失先检查解压和相对路径，不能用历史私人路径或文字摘要冒充图片。

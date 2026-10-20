# 内置素材索引

全部路径相对本技能根目录，图片实际随技能保存。执行时解析当前根目录、查看原图，并通过当前工具传入必要图片；不依赖创建者的私人账号、文件库或历史会话。

## 按职责选图

| 当前需要 | 内置原图与用途 |
| --- | --- |
| 当前品牌整体与完整详情页 | `assets/approved/detail-final-20261016/01.jpg` 至 `19.jpg`；按 [摄影方法论](photography-method.md) 的参考选择规则选入本屏可用的页与邻屏，不按页面名称固定匹配。完整19张是同一条连续定稿，全套视觉认可，商品事实不自动推广。 |
| 原版LOGO | `assets/brand/logo-blue.png`；云形、字形、比例与中英文依据，只在确需标识时使用。 |
| 当前模特身份与默认衣着 | `assets/model/character-sheet-approved-20261019.png`：用户确认的第一方案，奶白长袖长裤与素面棉袜；唯一当前人物标准，有人物时实际传入。详见 [人物方法](model.md)。 |
| 原伴睡／沙发摄影 | `assets/brand/main-kv-sleep.webp`、`assets/brand/main-kv-lounge.webp`、`assets/brand/main-kv-dog-rest.webp`、`assets/brand/main-kv-seated-hug.webp`；补充空间、行为、接触与景深，不再承担人物身份或衣着依据。 |
| 图文版式正例 | `assets/approved/brand-kv-user-finish-20261012.png`；当需要完整图文时用于校准文字角色与图文关系，按当前任务选用，不因“首屏”自动套用，细节以当前选定成稿为准。 |
| 安静与观看距离的历史校准 | `assets/approved/quiet-prone-user-finish.webp`、`assets/approved/overhead-breathing-user-finish.png`；用于相同问题的对照，不覆盖活动、近景或尺度展示等承担不同职责的画面，也不作为固定模板。 |
| 早期单款与群像 | `assets/approved/rabbit-detail.webp`、`assets/approved/hippo-detail.webp`、`assets/approved/dog-detail.webp`、`assets/approved/all-colors-user-finish.webp`；补充对应历史案例，当前品牌阅读节奏优先看完整定稿。 |
| 历史四款实拍 | `assets/products/six-variants.webp`、`assets/products/rabbit.jpg`、`assets/products/bear.jpg`、`assets/products/dog.jpg`、`assets/products/hippo.jpg`；只有明确同款才按 [产品依据](products.md) 查看，不是每次必传或默认SKU。 |

选图按 [摄影方法论](photography-method.md) 的参考选择规则执行：先看摄影类型与空间、人物与产品关系、景别与画面组织、品牌光色与材质是否相容，页码与文件名只用于定位。人物身份与默认衣着只由当前已确认设定卡约束；旧页和旧 KV 中的人物不替代它。其他原图可兼任多个清楚可辨的形态或设计职责。情绪图不认证材料，人物卡不决定广告动作，图文样例不默认授权新任务加字。

## 保留的对照素材

反例仅供诊断，不作为正向生成依据。每类保留能说明核心错误的代表图，避免把历史失误再次变成当前默认。

| 问题 | 正向／来源 | 保留的反例 |
| --- | --- | --- |
| 棚景变普通房间、光色失控 | 品牌KV及最终相关页 | `assets/rejected/all-colors-b.webp` |
| 无字休息变摆拍图文 | `assets/references/prone-pile-source.webp` 与 `assets/approved/quiet-prone-user-finish.webp` | `assets/rejected/prone-pile-a.webp` |
| 床垫毯子铺满、休息组合过大 | `assets/references/overhead-cushion-source.webp` 与 `assets/approved/overhead-breathing-user-finish.png` | `assets/rejected/overhead-rest-b.webp` |
| 首屏字形与图文关系偏差 | `assets/references/kv-layout-source-20261012.webp`、`assets/references/kv-photo-source-20261012.webp`、`assets/references/kv-old-long-20261012.webp` 与首屏成稿 | `assets/rejected/brand-kv-a2-20261012.webp`、`assets/rejected/brand-kv-b2-20261012.webp`、`assets/rejected/brand-kv-c2-20261012.webp` |

`assets/brand/layout-reference.jpg` 为早期长页，只在追溯旧内容时读取，不覆盖当前定稿和已确认人物。文件名中的日期用于版本区分，不要求使用者知道过去的聊天。人物卡确认记录中的路径指向本包实际文件，不用于重建创建者环境。

## 文件完整性与恢复

最新19张保留原始JPG及连续顺序，文件名映射、尺寸和哈希见 `assets/approved/detail-final-20261016/sources.json`。当前人物卡保留用户选定上传图的原始 PNG，尺寸和哈希见 `references/model-generation.json`；其余既有部分素材以原分辨率无损WebP归档。旧人物卡和专用旧人物参考已从技能包移除。

缺图时先核对当前技能目录与随附文件。仍缺本轮关键图片时，请当前使用者重新取得完整技能包或补传具体素材；不要求进入创建者账号或访问私人来源ID，不用反例或文字摘要冒充原图。只加载本轮有用图片，不把整个图库一次性提交给生成工具。

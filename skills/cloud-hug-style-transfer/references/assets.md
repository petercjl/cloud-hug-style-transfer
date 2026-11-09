# 内置素材与参考职责

所有路径相对本 Skill 根目录。51 个素材目录文件与基础仓库 v0.5.2 一致，包含 19 屏定稿、模特卡、历史商品与正反例。不要一次加载或提交整个图库。

| 本轮需要 | 原图 | 职责 |
| --- | --- | --- |
| 产品设定卡拼版样式 | `assets/products/dog.jpg`、`assets/products/rabbit.jpg` | 横向多视图与细节卡的形式。默认仅是卡片样式，不是当前商品身份 |
| 品牌升级模板 | `assets/approved/detail-final-20261016/03.jpg` 至 `15.jpg` | 按 [页面映射](page-patterns.md) 固定本屏职责、版式、景别和摄影基础；07–10 为可按形态增减的模块 |
| 当前模特身份与衣着 | `assets/model/character-sheet-approved-20261019.png` | 有人物时实际传入。奶白长袖长裤、素面棉袜，旧模板人物不能覆盖 |
| 补充品牌摄影与状态 | `assets/brand/main-kv-sleep.webp`、`assets/brand/main-kv-lounge.webp`、`assets/brand/main-kv-dog-rest.webp`、`assets/brand/main-kv-seated-hug.webp` | 与目标模板摄影任务相容时补充光色、空间、受力；不替换本轮固定模板或人物卡 |
| 观看距离与呼吸感校准 | `assets/approved/quiet-prone-user-finish.webp`、`assets/approved/overhead-breathing-user-finish.png` | 只用于同类问题的校准，不能把所有页都改远景或闭眼 |
| 历史产品资料 | `assets/products/bear.jpg`、`assets/products/dog.jpg`、`assets/products/hippo.jpg`、`assets/products/rabbit.jpg`、`assets/products/six-variants.webp` | 只有当前确认同款时才作为商品依据；不默认四款六色 |
| 旧单款与群像摄影 | `assets/approved/rabbit-detail.webp`、`assets/approved/hippo-detail.webp`、`assets/approved/dog-detail.webp`、`assets/approved/all-colors-user-finish.webp` | 按需补充摄影关系，不覆盖本轮映射和款色清单 |

01、02、16–19 原图仍完整保留，方便识别整套来源，但本流程不规划、不生成。`assets/brand/logo-blue.png`、`assets/brand/layout-reference.jpg`、历史主 KV 排版与相关反例仍保留作历史资产，当前无字摄影任务不默认传入 LOGO，也不新增图文排版。

## 诊断用对照

反例只用来识别错误，不传为正向生成参考：

- 房景与暖光：`assets/rejected/all-colors-b.webp`。
- 无字休息变成摆拍图文：`assets/references/prone-pile-source.webp`、`assets/approved/quiet-prone-user-finish.webp` 与 `assets/rejected/prone-pile-a.webp`。
- 主体与承托面拥挤：`assets/references/overhead-cushion-source.webp`、`assets/approved/overhead-breathing-user-finish.png` 与 `assets/rejected/overhead-rest-b.webp`。
- 历史图文反例：`assets/rejected/brand-kv-a2-20261012.webp`、`assets/rejected/brand-kv-b2-20261012.webp`、`assets/rejected/brand-kv-c2-20261012.webp`；原图 `assets/references/kv-layout-source-20261012.webp`、`assets/references/kv-photo-source-20261012.webp`、`assets/references/kv-old-long-20261012.webp`，定稿 `assets/approved/brand-kv-user-finish-20261012.png`。仅作归档，不触发本轮加字。

## 原始文件与恢复

完整定稿 19 张保持原 JPG 字节；映射与尺寸见 `assets/approved/detail-final-20261016/sources.json`。模特卡身份记录见 [model-generation.json](model-generation.json)。文件完整性由所属包的 `npm/integrity.json` 与 `release-integrity.json` 校验；来源见 Skill 根目录 `PROVENANCE.json`，维护入口见 [maintenance.md](maintenance.md)。

发现缺图先检查当前 Skill 相对路径与完整解压结果。关键原图仍缺失时只请求相应文件／完整包，不要求访问作者私人账号或历史会话，不用反例或文字摘要冒充图片。

# 拼接与按内容分屏

`scripts/prepare_detail.py` 只做本地检查、拼接、预览和精确裁切，不调用生图、不收费、不上传、不改动原件。需要 Python 3.8+、Pillow 9.1+；优先复用已有环境，缺依赖时按宿主权限在项目内补齐。所有写入使用新路径，已有输出不覆盖。

## 先判断输入状态

- 已按内容分好屏：检查完整性和顺序后直接进入风格转换，无需重新拼接。
- 网上下载的机械切片：先恢复长图，再由 Agent 实际看图确定每屏边界。
- 已有完整长图：直接查看并确定边界。

下面的 `<SKILL_ROOT>`、`<PROJECT>`、`<INPUT>` 都替换成实际路径；路径含空格时加引号。文件名自然排序只提供初始顺序，不能证明网页完整或切片连续。检查接缝处是否错序、重叠、缺图或截断。脚本发现重复文件字节、编号疑似缺失、重复序号、宽度或色彩配置不一致时拒绝拼接；不得为了通过检查擅自删除、补图、缩放或改色。

## 查看输入与拼接

```text
python <SKILL_ROOT>/scripts/prepare_detail.py inspect --input <INPUT> --output <PROJECT>/inputs.json
python <SKILL_ROOT>/scripts/prepare_detail.py stitch --input <INPUT> --output <PROJECT>/stitched
```

`inspect` 输出每张图片的实际显示宽高、存储宽高、EXIF 方向、文件 SHA-256、顺序、总高度和可检测的问题。已有分屏高度不同是正常的；不需要为了统一高度去改图。若文件名无法建立可靠的序号关系，先看图后用 `--order <PROJECT>/order.json` 指定顺序。此参数同样可用于 `inspect` 和 `stitch`，必须列齐目录内所有图片，不能重复：

```json
{"files": ["top.jpg", "middle.jpg", "bottom.jpg"]}
```

`stitch` 将同宽图片按顺序直接竖向拼接为 `stitched/stitched.png`，不插入间隔，不自动去重、对齐或重绘；`manifest.json` 记录每张原片在长图中的 `[top, bottom)` 区间。EXIF 方向按实际显示方向归一化，RGB／灰度／索引色转换为等价 RGB；存在透明度时使用 RGBA。统一且存在的 ICC 配置保留；CMYK、16 位、多帧或混合 ICC 配置拒绝自动处理。JPEG 输入转成 PNG 可避免新增 JPEG 压缩，但不能恢复输入已经丢失的细节。

## 看清长图，再决定切口

长图整体预览往往太窄，必要时生成只供查看的分段预览：

```text
python <SKILL_ROOT>/scripts/prepare_detail.py preview --image <PROJECT>/stitched/stitched.png --output <PROJECT>/preview --tile-height 2000 --width 750
```

预览文件名标记原图 Y 区间，`preview.json` 记录映射。这些固定高度小图**只用于查看**，不能当作已分屏的生图输入，也不能直接把预览分界当作分屏线。跨预览边界的模块需结合相邻图一起看。

按语义与画面边界定切口：标题、相关文案与对应图片保留一屏；没有标题的独立图片保留完整单张；颜色合集、产品信息表等组合模块整体保留。切口放在模块间留白或明确边界，不截文字、人物、产品和连续图片。无需例行让用户确认每条分屏线；只有无法从素材判断的重要归属或缺失才询问。

## 按确定的 Y 坐标裁切

创建 UTF-8 的 `cuts.json`，使用原始长图坐标，不用缩略图像素。边界必须从 `0` 开始、以长图实际高度结束，严格递增；示例数字仅说明结构：

```json
{
  "width": 1500,
  "height": 5000,
  "boundaries": [0, 2400, 5000],
  "labels": ["标题与对应场景", "独立完整图片"]
}
```

可增加 `image_sha256` 绑定正确长图；`width`、`height`、哈希如提供必须吻合。`labels` 可省略。执行：

```text
python <SKILL_ROOT>/scripts/prepare_detail.py split --image <PROJECT>/stitched/stitched.png --cuts <PROJECT>/cuts.json --source-manifest <PROJECT>/stitched/manifest.json --output <PROJECT>/screens
```

用户直接提供完整长图时省略 `--source-manifest`。输出 `screen-01.png` 等图片与 `manifest.json`。有拼接清单时，逐屏记录关联的原始切片、原片局部 Y 区间和分屏内 Y 区间；否则记录完整长图上的区间。边界覆盖整张长图，不允许空隙或重叠。裁切后的画布宽度、每屏高度就是后续转换应保留的尺寸，不能统一等高或拉伸。

实际逐屏看图，核对标题归属、完整内容、顺序和留白；再把分屏清单交给生成阶段，一屏对应一张成图。脚本校验不代表语义分屏合格。所有区间按 EXIF 归一化后的显示方向计算，原件始终保留。

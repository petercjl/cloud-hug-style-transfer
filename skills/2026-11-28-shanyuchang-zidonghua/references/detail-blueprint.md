# 详情页交件

本文件连接[动作方案](shot-plan.md)与同级版式的[输入契约](../../2026-11-28-shanyuchang-banshi/references/input-contract.md)。使用版式 `assets/layout.json` 的槽位、张数、条件与画幅，项目可在契约范围内覆盖。独立旧标题及其他旧模块均由版式选取。

在传给 build.py 的项目目录写 UTF-8 `project.json`。商品编号为数字字符串 `product_id`；`colors` 为多色屏各格的正式色名；`old_dir` 指本款旧页；`photos_dir` 指本款出图目录。图像映射为 `photos.hero`、多色时的 `multicolor`、`sport`、有序数组 `banners`、按正式色名分组的有序数组 `brand`、`closing`。文件名相对摄影目录。可选 `settings` 与 `review_file` 仅使用版式契约字段。默认颜色跟随多色屏；若手动指定，记下实际顺序。

每个镜头在项目记录中同时列文件名和上述目标键。生成原片、组图文字成品、旧图目录三者分别交清。离线测试优先使用现成且已验的版本。缺照在交件清单逐项列出，并保留 build.py 的汇总诊断。若商品根下的源文件均只读，将 `project.json` 写在授权的新版工作子目录并填真实源路径，不改老目录。将该清单所在目录传给脚本即可。

```powershell
python -B -X utf8 "<版式skill>/scripts/build.py" "<project.json所在目录>" --output "<详情页成品>"
```

查看逐屏记录、红框和删屏理由。退出 0 表示可见屏已出切片，退出 3 表示有可见模块无法安全切片，退出 2 表示输入或发布目录检查失败。

只读商品根可以直接作为位置参数；将工作区清单通过 `--manifest` 传入，此时清单内路径均相对商品根。两种调用选一种，并按所选基准填写文件路径。

整批图到齐后一次性做总览与相似对照，把每张的观察写入版式照片目检的 observation，需复核的项目同时列入 issues。首屏交实测 reserve，多色交原画幅。

同一清单可含 `commercial.main`、`commercial.search`、`commercial.sku` 和 `commercial.review`；引用实交原片及哈希。用同级版式脚本 `build_commercial.py "<商品根>" --manifest "<清单>" --output "<新版根>"` 一次装配主图、搜索图和分色 SKU。

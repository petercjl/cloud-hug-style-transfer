# product-asset-set 的动态调用与交接

逻辑依赖：`product-asset-set`；拥有包：`@petercjl/product-asset-set`，最低已验证版本 0.1.3，支持资产说明格式 v1/v2 的当前读取合同。该依赖单独安装、更新，不复制其 Skill、脚本或生成方法到本包。

## 解析、加载和执行

从当前宿主实际公布的目录或配置 Skill roots 精确解析 `product-asset-set`，完整读取其当前 SKILL.md，按 callee 解析相对资源并加载 `references/asset-format.md`。默认同级目录；自定义位置显式提供 `CLOUD_HUG_PRODUCT_ASSET_SKILL_ROOT`。不搜索其他 Agent 的目录。可使用本 Skill 的 `scripts/check-assets.mjs --skill-root EXACT_SKILL_DIR` 验证目标自有运行时与当前 CLI 合同。

将本轮原始商品资料、确定的形态／款色、已解决的来源冲突、用户明确形态基准、范围及费用授权交给 callee。完整执行其核对、规划、逐张制作与验收、打包和修订主线。素材清单和原图由调用方提供，逐图画幅、生成策略和资产验收由 callee 负责。用户明确选择的工具／模型传递给 callee；Cloud Hug 的详情默认 ToAPIs、2K 不自动变成资产制作参数。

callee 的 ordinary prepare、生成工具路由、付费授权与未知提交恢复均按它的当前合同执行。缺少 Skill、运行时或不兼容合同返回对应 DEPENDENCY_MISSING / DEPENDENCY_INVALID / DEPENDENCY_INCOMPATIBLE，说明安装 `@petercjl/product-asset-set` 并同步当前 Agent；保留已完成识别。不能用同名文案、临时自写流程或旧多宫格生成代替动态调用。

## 输出交接与返回点

接收每款色的版本目录和 UTF-8 `资产说明.txt`，使用 callee 当前 `asset check --guide GUIDE --json` 校验实体文件、像素、比例与哈希。Cloud Hug 的只读入口为：

```text
node <SKILL_ROOT>/scripts/check-assets.mjs --guide <ASSET_VERSION_DIR>/资产说明.txt [--skill-root EXACT_SKILL_DIR]
```

新制作图组需包含 `overall`、`scale`、`texture` 三项独立图片；按页任务选取 `structure`、`marking`、`use`。输出路径和 SHA-256 作为 manifest 的交接凭证，文件校验不替代视觉验收和用户确认。源图不足时按 callee 的补图／阶段预览分支处理，未通过图组不能进入正式详情生成。

原图、完整资产和商品规格证据分开记录。资产 scale 图的相对关系必须可追溯到原始实拍或可靠资料，生成结果不能成为新测量事实。修订只更新受影响编号，保留旧版本、失败图与已通过原件。

完成后直接返回 Cloud Hug 第 2 步前期集中确认，连同适用规格与原始尺度来源一起交接；只确认尚缺的事项，不重复询问 callee 已明确确认的同一资产版本。

## 下游选图与项目记录

在同一 manifest 的 `confirmation.productAssetSets` 保存 variantId、groupId、guidePath、assetVersion、producerPackage/version、校验时间、确认依据及 images 的 id/path/role/hash/size/ratio/use/limits；`scale_basis` 指向选用的 scale 资产和其来源依据。每页 items.references 保存实际有序图片、assetId、assetVersion、guidePath 和职责，不把资产说明文本当作图像参考传入。

每次详情页生成必须实际传入适用 scale 图，包括无人陈列、局部和纹理页；整体／互动页再选 overall，按材质或结构任务选 texture／structure。人物身份由模特卡负责，场景风格由品牌案例负责。不机械上传所有图片，也不把资产重拼成一张卡。多款色分别引用相应资产，不能串色或拼出平均形态。图号随真实列表生成。

资产修订后复核使用过该编号的规划与成图；已确认且无关的部分复用。旧 `confirmation.productCards` 字段仅供历史追溯，不静默改写其判断。

每页在提示词编写前，使用 `assets select --guide GUIDE --ids A01,A02 --json` 核验选图。编号顺序就是输出顺序，至少一张适用 scale 和一张外观／结构／材质图；返回的文件路径逐项成为实际请求的 reference。该检查能保证角色和文件身份，是否适用本款、原图是否忠实仍需实际看图。多资产组页面分别校验，再记录合并后的真实顺序。

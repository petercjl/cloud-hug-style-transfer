# 抱抱云朵社风格转换

将旧详情页、产品摄影、主 KV 或 SKU 转换为抱抱云朵社品牌视觉，保留当次商品事实、文案与用途。包内包含完整 19 页定稿、品牌标识、人物设定与摄影排版方法，约 41 MB 素材。

支持 Codex、SealSeek、WorkBuddy。需要 Node.js 22+、宿主命令执行和看图能力。生图统一通过必需的 `@petercjl/sealseek-media-cli`（0.6.1+）及其配套 `sealseek-media` Skill 执行；每次任务先检查，缺失或不兼容时暂停整个任务，安装并复查通过后继续。有效 SealSeek 登录、网络及额度由使用者准备，包不附带账号或额度。宿主生图效果仍需分别实测。

先安装生图依赖，将提示词发送给 Agent：

> 请安装 npm 包 @petercjl/sealseek-media-cli。

安装：将下列提示词发送给目标 Agent。

> 请安装 npm 包 @petercjl/cloud-hug-style-transfer。

使用：附上待转换图片；关键商品结构不清楚时补充实拍。开始生图前会新建按图片主题与任务自动命名的无限画板。每完成一张就插入一组对照：左边原图、右边成图，后续组向下排列，保留紧凑间距；交付包含画板链接。仅规划时不创建画板。

> 用抱抱云朵社风格转换处理所附图片。

更新：

> 请更新 npm 包 @petercjl/cloud-hug-style-transfer。

检查：

> 检查 cloud-hug-style-transfer 的安装与生图能力是否可用。

故障处理：

> 请诊断并修复 cloud-hug-style-transfer 的这次报错：粘贴报错内容。

安装、更新与检查由 Agent 执行包内 CLI。包的 `skill source --json` 提供规范来源；Agent 随后调用 `skill install --agent <当前宿主>`，支持 `--root` 指定实际技能目录。普通任务不联网检查或自动更新。显式更新使用 stable latest，备份旧包并同步已登记的受管 Skill，失败时恢复旧包；离线保留当前安装。已有独立安装或本地修改将停止覆盖并报告。源码或上层工具管理的包由其拥有者更新。

兼容证据分别记录安装机制与生图效果。CI 覆盖 macOS、Windows、Linux 的包管理机制；宿主实际生成需使用各自账户独立验证。品牌与输入素材须具备相应使用权；公开 npm 分发不转让商标与素材的独立再分发权。

开发者依赖合同：`doctor --json` 验证媒体包身份、0.6.1+ 版本、CLI 与规范 Skill，缺失返回非零退出码和 `DEPENDENCY_MISSING`，生成状态为 `paused`。优先发现当前 npm 安装树，再发现 PATH 的 npm 安装；自定义 Agent/套件安装可配置 `CLOUD_HUG_MEDIA_ROOT` 为媒体包根目录。使用返回的 `dependencies.media.invocation` 调用 CLI；doctor 不登录、不联网检查服务、不自动安装或提交生成。任务执行仍须加载依赖的当前 Skill 并完成 live 检查与 dry-run。

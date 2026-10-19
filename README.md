# 抱抱云朵社风格转换

将旧详情页、产品摄影、主 KV 或 SKU 转换为抱抱云朵社品牌视觉，保留当次商品事实、文案与用途。包内包含完整 19 页定稿、品牌标识、人物设定与摄影排版方法，约 41 MB 素材。

支持 Codex、SealSeek、WorkBuddy 的技能目录安装。Node.js 22+ 为安装与管理前提；实际生图还需要宿主支持看图、多参考图编辑及结果交付。包不附带生成额度或服务账号。SealSeek 与 WorkBuddy 的生图适配依据当前宿主合同实现，尚待实际任务验证。WorkBuddy 需要内置 Miora 图片场景及相应能力 Skill；SealSeek 需要当前会话提供参考图生成和上传能力。

安装：将下列提示词发送给目标 Agent。

> 请安装 npm 包 @petercjl/cloud-hug-style-transfer。

使用：附上待转换图片；关键商品结构不清楚时补充实拍。

> 用抱抱云朵社风格转换处理所附图片。

更新：

> 请更新 npm 包 @petercjl/cloud-hug-style-transfer。

检查：

> 检查 cloud-hug-style-transfer 的安装与生图能力是否可用。

故障处理：

> 请诊断并修复 cloud-hug-style-transfer 的这次报错：粘贴报错内容。

安装、更新与检查由 Agent 执行包内 CLI。包的 `skill source --json` 提供规范来源；Agent 随后调用 `skill install --agent <当前宿主>`，支持 `--root` 指定实际技能目录。普通任务不联网检查或自动更新。显式更新使用 stable latest，备份旧包并同步已登记的受管 Skill，失败时恢复旧包；离线保留当前安装。已有独立安装或本地修改将停止覆盖并报告。源码或上层工具管理的包由其拥有者更新。

兼容证据分别记录安装机制与生图效果。CI 覆盖 macOS、Windows、Linux 的包管理机制；宿主实际生成需使用各自账户独立验证。品牌与输入素材须具备相应使用权；公开 npm 分发不转让商标与素材的独立再分发权。

# 安装与维护合同

1. 通过当前 CLI 的 `capabilities --json` 获取参数合同；用 `skill source --json` 定位规范 Skill。首次安装执行 `skill install --agent 当前宿主 --json`。
2. 显式更新执行 `update install --yes --json`，在默认范围核对已登记和当前宿主约定位置的受管 Skill；仅更新一个宿主时传 `--agent`。npm 已最新时仍同步旧 Skill 与可迁移元数据。源码或上层工具拥有的包由其拥有者升级；当前版本的 Skill 同步仍可执行。
3. 需要指定位置时，`--root` 是技能父目录，CLI 自动附加本 Skill 目录名；`doctor` 与 `update` 的 `--root` 同时要求 `--agent`。Codex 优先级为显式 root、`CODEX_SKILLS_DIR`、`CODEX_HOME/skills`、平台默认；其他宿主见实时合同及回执。读取 resolution 核对目标与来源。
4. 检查回执 `verified`、`packageChanged`、各 `skills` 的 `current/version/target` 和备份。完全当前即 verified no-op。未知参数报错后读取该命令的 `--help --json`；避免猜其他工具的选项。
5. 本地编辑或非受管目录保留原文件并报告。失败时保留回执中的 backup；先检查包版本与受管状态，再按错误恢复，避免重复升级。元数据只迁移已知不受支持的字段值，自定义展示字段保留。

`doctor --json` 同时报告安装完整性与生图依赖；媒体依赖缺失不阻止独立的 `skill` 或 `update` 维护操作。普通业务任务不自动更新。

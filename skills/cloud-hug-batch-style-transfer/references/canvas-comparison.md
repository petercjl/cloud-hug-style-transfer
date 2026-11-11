# 可选的新旧页对照画板

仅在用户要求或本轮已授权画板时使用。普通本地出图不增加画板审批或分享流程。沿用已指定/绑定画板；确需新画板时按当前 SealSeek 合同创建一次，记录并回读 ID、名称、真实 URL。创建结果未知先查同轮记录与画板列表，不重建。

每屏一行：**左边为当前分屏原页，右边为它的风格转换成图**。原图、成图都用实测像素尺寸与真实上传/生成 URL；不拿历史模板、产品卡或风格例作左侧对照。不改图片像素，不加 A/B/C，不拆内部格位。

本包保留上游确定性左右排版助手，仅本地算坐标，不上传或生成：

```text
node <SKILL_ROOT>/scripts/canvas-row.mjs --input <PROJECT>/row.json
```

输入格式如下（示例 URL 仅说明格式，实际必须用服务返回值）：

```json
{
  "run_id": "style-transfer-01",
  "row_index": 1,
  "top": 0,
  "source": {"url": "https://example.com/source.png", "width": 1500, "height": 2371},
  "result": {"url": "https://example.com/result.png", "width": 1500, "height": 2371}
}
```

返回左右各 480 单位、间距 24 的等比排版及 `next_top`；行间留 32。稳定元素 ID 由 run_id、row_index、source/result 组成。按当前媒体包 `canvas batch` 合同验证并写入返回的 batch，检查 verified，再 `canvas get` 回读元素 ID、URL、数量、位置与比例；记录 next_top 后处理下一屏。

已生成文件使用已有 URL，不为归档重新生成。任务使用 `--archive none` 时不要默认 `task sync` 又追加第二份结果；回执未知先查原元素，以相同批次和 ID 恢复。尊重用户在画板上的后续编辑，不复活其已删除元素或强行重排。

归档失败时本地已通过的图片仍可交付，说明画板未完成部分；不能宣称已保存或为修复归档再次收取生成费用。公开分享、改权限不在普通画板归档范围。

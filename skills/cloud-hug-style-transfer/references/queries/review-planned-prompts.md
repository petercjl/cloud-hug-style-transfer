# 集中英文提示词检查

触发：整套提示词已写完，详情生成尚未开始。

问题：每屏动作、机位和参考关系是否能保留确认产品，实际提交指令是否相互冲突？

按需读取 [产品结构与动作适配](../topics/product-identity-and-pose.md)，逐屏检查实际英文提示词及对应有序参考，含家具、床垫、地垫、台面或地面关系的页面，另读 [物体承托与空间边界](../topics/support-and-spatial-boundaries.md)。结合 media-execution.md 的参数核对。

在项目新建版本化 promptReview 记录：pageId、promptRevision、promptSha256、有序参考文件哈希与职责、实际加载的知识文件及哈希、命中的知识ID/版本、具体疑点与依据、处理决定、status（pass/needs-revision/unknown）。pass 表示未发现当前知识覆盖的冲突，不是成图验收通过。

needs-revision 先改规划或提示词，再检查；unknown 说明缺失证据，补充查看或向用户确认。只阻塞受影响页。只允许当前提示词和参考哈希匹配的 pass 进入已授权生成；知识条目变化须复查相关页。完成后返回主流程第4步，仍遵守用户指定的逐张/批量授权与停点。

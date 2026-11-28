# Update the selected Agent's Skill

> 请更新 npm 包 @lumyne/shanyuchang-automation。

Resolve the selected Agent and exact existing managed Skill path before updating. Use its local management entry or the bootstrap CLI to run `skill status` and `update check`.

Activate an exact registry version with `update install --yes --version VERSION --agent AGENT --path EXACT_SKILL_DIR --json`. For a reviewed local tarball use `--candidate ABSOLUTE_TARBALL` in place of the version. The package acquires the candidate in private state, checks identity and hashes, then synchronizes the selected Skill and its runtime. An exact same-version registry update reconciles missing managed files. Local changes and unrelated files are preserved.

If a transaction stops partway, run `update operation` with that same target to recover the operation ID. Run `update resume --yes --operation ID --path EXACT_SKILL_DIR` to resume the recorded candidate or `update rollback --yes --operation ID --path EXACT_SKILL_DIR` to restore its verified snapshot. Recheck the installed local entry, version and managed status, then refresh and confirm host discovery.

If the current Agent also maintains a bootstrap installation for this package, update it to the verified exact version after managed reconciliation. The selected Skill's target-owned runtime remains independently executable.

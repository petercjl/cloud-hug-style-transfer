# Install the current Agent's Skill

> 请安装 npm 包 @lumyne/shanyuchang-automation。

The current Agent resolves its own supported Skill discovery directory and uses an exact destination for `shanyuchang-automation`. Node.js 22+ and npm run the management CLI.

1. Install the exact npm package or reviewed tarball and resolve the `shanyuchang-automation` bin from that installation.
2. Read `version --json` and `skill source --name shanyuchang-automation --json`. Use `skill install --agent AGENT --path EXACT_SKILL_DIR --json` to install the physical Skill and its independent runtime.
3. Run the installed Skill's `scripts/run.mjs version --json`, then run `skill status` with the same Agent and path. The package verifies the receipt, Skill resources, runtime hashes and installed version.
4. Reload the current Agent's discovery and confirm `shanyuchang-automation` points to the installed directory. The management CLI marks host discovery pending until the host verifies it.

npm installation alone installs the bootstrap CLI. Scripts-disabled installation uses the same explicit handoff. An existing user-owned path or edited managed target is preserved. For partial operations use [UPDATE.md](UPDATE.md).

Offline layout uses Python 3 with Pillow and NumPy. Image generation uses a separately configured `toapiscli` capability and requires explicit task authorization. The package performs no generation during installation.

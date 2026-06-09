# Sheets Extended

Sheets Extended is an Obsidian plugin project scaffolded with the modern TypeScript API and the official esbuild-based plugin build flow.

## Development

```bash
npm install
npm run dev
```

For a production bundle:

```bash
npm run build
```

Obsidian loads the release files from a plugin folder:

- `manifest.json`
- `main.js`
- `styles.css`

During development, place or symlink this project into:

```text
<Vault>/.obsidian/plugins/sheets-extended-v2
```

Then reload Obsidian and enable **Sheets Extended** in Community plugins.

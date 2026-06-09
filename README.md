# Sheets Extended

Thanks to [Sheet-Extended](https://github.com/niconekoru/obsidan-advanced-table-xt), this plugin is a modern refactor of Sheet Extended.

Sheets Extended v2 enhances Obsidian Reading View tables only when a table contains explicit Sheets Extended syntax.

The plugin intentionally leaves ordinary Markdown tables to Obsidian and table editing workflows to Advanced Tables or other editor-focused plugins.


## Why v2

Compared with the original Sheet Extended plugin, this version focuses on safer behavior with modern Obsidian:

- Fixes cases where ordinary Markdown tables, especially tables inside callouts, could disappear in Reading View.
- Avoids interfering with ordinary Markdown tables that do not use Sheets Extended syntax.
- Keeps table editing, formatting, sorting, and navigation delegated to Obsidian or editor-focused plugins.
- Focuses only on features Obsidian does not provide natively, such as cell merging, vertical headers, explicit `sheet` blocks, and style directives.

## Features

- Horizontal cell merge with `<`.
- Vertical cell merge with `^`.
- Mixed horizontal and vertical merges.
- Vertical row-header delimiter columns with `-` or `---`.
- `sheet` fenced code blocks for explicit enhanced tables.
- Cell and table style directives such as `content ~ .className { color: "red" }`.
- Frontmatter opt-out for native Markdown tables with `disable-sheet: true`.
- Live Preview rendering when the cursor is outside an enhanced table block.

## Non-goals

- No source-mode rendering or CodeMirror editing extension.
- No editor commands, keymaps, table editing, formatting, sorting, formulas, or CSV support.
- No Markdown source rewriting.
- No table formatting, sorting, navigation, CSV export, or formula support.
- No re-rendering of ordinary Markdown tables that do not contain enhanced syntax.

## Syntax

Horizontal merge:

```md
| A | B | C |
| --- | --- | --- |
| foo | < | bar |
```

Vertical merge:

```md
| A | B |
| --- | --- |
| foo | bar |
| ^ | baz |
```

Vertical headers:

```md
| Group | - | Item | Value |
| --- | --- | --- | --- |
| G1 | - | A | 1 |
| G2 | - | B | 2 |
```

Sheet code block:

````md
```sheet
{
  classes: {
    red: {
      color: "red"
    }
  }
}
---
| A | B |
| --- | --- |
| foo ~ .red | bar |
```
````

## Development

```bash
npm install
npm run dev
```

For a production bundle:

```bash
npm run build
```

Run checks:

```bash
npm run lint
npm run test
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

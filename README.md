# CssVarsDocs

**CssVarsDocs** generates a comment block containing all CSS variables from a specified file to improve readability and provide automatic documentation. Comments are added at the beginning of CSS files or inside `<style>` blocks for non-CSS files (e.g., HTML or Vue).

---

## Features

-   CLI Tool for direct file modification
-   Supports PostCSS and Vite as plugins
-   Compatible with CommonJS and ES Modules (Dual Output)
-   Flexible configuration via CLI options or configuration files

---

## Installation

### Use without Installation (`npx`/`pnpx`)

```sh
npx css-vars-docs [options]
pnpx css-vars-docs [options]
```

### Install Locally (as a Dev Dependency)

```sh
npm install -D css-vars-docs
pnpm add -D css-vars-docs
```

### Install Globally

```sh
npm install -g css-vars-docs
```

---

## Usage

### CLI Usage

Run the CLI directly:

```sh
npx css-vars-docs [options]
```

Or globally:

```sh
css-vars-docs [options]
```

### Example Commands

1. Process specific files:

    ```sh
    css-vars-docs -f "src/**/*.css"
    ```

2. Run a dry run (no file changes):

    ```sh
    css-vars-docs --preview
    ```

3. Remove comments:
    ```sh
    css-vars-docs --remove
    ```

### CLI Options

| Option                                | Description                                                        |
| ------------------------------------- | ------------------------------------------------------------------ |
| `-f, --files <files>`                 | Files to process, separated by spaces or commas                    |
| `-r, --remove`                        | Remove existing comments from the files                            |
| `-p, --preview`                       | Dry run: show changes without writing to files                     |
| `-t, --title <title>`                 | Header for the comment block                                       |
| `-b, --block-identifier <identifier>` | Unique identifier for generated blocks                             |
| `-i, --indent <indent>`               | Default indentation                                                |
| `-is, --indent-style`                 | Add extra indentation in `<style>` blocks                          |
| `-ex, --exclude-node-modules`         | Exclude `node_modules` by default                                  |
| `-n, --new-lines-before-group`        | Add a new line between variable groups                             |
| `-lp, --log-prefix <prefix>`          | Prefix for log messages                                            |
| `-ll, --log-level <level>`            | Log level: `0` = errors, `1` = changes, `2` = verbose, `3` = debug |
| `-lc, --load-config`                  | Load config file: `true` (default) or `false`                      |

---

## Configuration Files

`css-vars-docs` supports multiple configuration file formats out of the box. You can use the same configuration file for both CLI and programmatic usage, regardless of the module system (CommonJS or ESM).

**Supported Files**:

| File Format                | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| `css-vars-docs.config.cjs` | CommonJS configuration file.                                            |
| `css-vars-docs.config.mjs` | ES Module configuration file.                                           |
| `css-vars-docs.config.js`  | Automatically interpreted as CommonJS or ESM based on your environment. |

### Example Configuration Files

#### CommonJS (`css-vars-docs.config.cjs`)

```js
module.exports = {
    indent: '    ',
    files: ['src/**/*.css', 'src/**/*.vue'],
    logLevel: 2,
    newLinesBeforeGroup: true,
    preview: false
};
```

#### ES Module (`css-vars-docs.config.mjs`)

```js
export default {
    indent: '    ',
    files: ['src/**/*.css', 'src/**/*.vue'],
    logLevel: 2,
    newLinesBeforeGroup: true,
    preview: false
};
```

---

## PostCSS Config

**PostCSS Config:**

```javascript
const cssVarsDocs = require('css-vars-docs/postcss-plugin');

module.exports = {
    plugins: [
        cssVarsDocs({
            logLevel: 3
        })
    ]
};
```

---

## Vite Config

**Vite Config:**

```javascript
import { defineConfig } from 'vite';
import cssVarsDocsVite from 'css-vars-docs/vite-plugin';

export default defineConfig({
    plugins: [
        cssVarsDocsVite({
            delay: 200, // Delay between file processing
            extensions: ['.css', '.vue'], // Files to process
            config: {
                logLevel: 2,
                preview: false
            }
        })
    ]
});
```

---

## Programmatic Usage

You can use `CssVarsDocs` directly in your Node.js scripts:

```javascript
import { CssVarsDocs } from 'css-vars-docs';

const cssVarsDocs = new CssVarsDocs({
    files: ['src/**/*.css'],
    logLevel: 2
});

cssVarsDocs.processFiles();
```

---

## Dual Output: ESM and CJS

**Why Dual Output?**

-   **ESM**: Modern JavaScript environments and bundlers (e.g., Vite, Rollup).
-   **CJS**: Node.js CLI compatibility and legacy projects.

Node.js automatically selects the correct format based on your environment.

**Example Imports**:

```javascript
// ESM
import { CssVarsDocs } from 'css-vars-docs';

// CommonJS
const { CssVarsDocs } = require('css-vars-docs');
```

---

## License

This project is licensed under the MIT License.

---

## Notes

**This tool modifies files directly.** Use the `preview` option to test changes before applying them. Always consider committing your code before running file modifications.

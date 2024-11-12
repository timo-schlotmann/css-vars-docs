# CssVarsDocs

Generates a comment block with all CSS variables from the specified file to improve readability and provide documentation. The block is added at the beginning of the file, or in the first `<style>` block for non-CSS files if available.

## Installation (not required when using `npx` or `pnpx`)

**As a Project Dependency:**

```sh
npm install -D css-vars-docs
```

or

```sh
pnpm add -D css-vars-docs
```

**Global Installation:**

```sh
npm install -g css-vars-docs
```

or

```sh
pnpm add -g css-vars-docs
```

## Usage

**Without Installation:**

```sh
npx css-vars-docs [options]
```

or

```sh
pnpx css-vars-docs [options]
```

### With Global Installation or as a Dependency:

```sh
css-vars-docs [options]
cssvarsdocs [options]
cssvd [options]
```

## Available Options for the CLI

| Option                                | Description                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `-f, --files <files>`                 | Files to process, separated by spaces or commas                                             |
| `-n, --new-lines-before-group`        | Add a new line between variable groups                                                      |
| `-t, --title <title>`                 | Header for the comment block                                                                |
| `-b, --block-identifier <identifier>` | Unique identifier for generated blocks                                                      |
| `-i, --indent <indent>`               | Default indentation                                                                         |
| `-is, --indent-style`                 | Add extra indentation in `<style>` blocks                                                   |
| `-ex, --exclude-node-modules`         | Exclude `node_modules` by default                                                           |
| `-lc, --load-config`                  | Boolean. Set to `false` to ignore configuration files (default: `true`, loads if available) |
| `-lp, --log-prefix <prefix>`          | Prefix for log messages                                                                     |
| `-ll, --log-level <level>`            | Log level: `0` = errors only, `1` = changes only, `2` = verbose, `3` = debug                |
| `-r, --remove`                        | Remove existing comments from the files                                                     |
| `-p, --preview`                       | Perform a dry run without writing to files                                                  |

---

## Configuration

**CssVarsDocs** uses a default configuration to process files. This configuration can be customized using CLI options, or by creating a configuration file in the root directory of the project, allowing default configuration overrides to be retained across runs without the need to pass additional options.

**Supported Configuration File Names:**

```sh
css-vars-docs.config.{js,mjs,cjs}
cssvarsdocs.config.{js,mjs,cjs}
cssvd.config.{js,mjs,cjs}
```

**Configuration hierarchy:**

1. Default settings
2. Configuration file (if present)
3. CLI options (highest priority)

## Example of using a configuration file

Create a configuration file, for example `css-vars-docs.config.mjs`:

```javascript
export default {
    indent: '    ',
    files: ['src/assets/*.css', 'src/assets/*.scss', 'src/*.html'],
    logLevel: 0
};
```

Run the command without additional arguments:

```sh
npx css-vars-docs
```

or

```sh
css-vars-docs
```

## More Examples

Process a specific file, `style.css`:

```sh
css-vars-docs -f style.css
```

Process all `.css` files in the `assets` directory:

```sh
css-vars-docs -f assets/**/*.css
```

Process all `.css` files in `assets` with `logLevel` set to 3:

```sh
css-vars-docs -f assets/**/*.css -ll 3
```

Process all `.css` files in `assets` and all `.vue` files in `components`:

```sh
css-vars-docs -f "assets/**/*.css,components/*.vue"
```

Process all files with `logLevel` 3:

```sh
css-vars-docs -ll 3
```

Remove comments from all files with `logLevel` 3:

```sh
css-vars-docs -r -ll 3
```

## Example of using the Postcss plugin

```javascript
// postcss.config.js
const cssVarsDocs = require('css-vars-docs');

module.exports = {
    plugins: [
        cssVarsDocs({
            logLevel: 3,
            preview: true // Use `preview` to see affected files without modifying them
        })
        // other plugins
    ]
};
```

## Example of using in your code

```javascript
const CssVarsDocs = require('css-vars-docs');

const cssVarsDocs = new CssVarsDocs({
    // options
});

cssVarsDocs.processFiles();
```

## License

This project is licensed under the MIT License.

## Notes

This tool modifies files directly, so please use with caution and consider committing your code beforehand if necessary.

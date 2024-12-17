import * as fs from 'fs';
import { CssVarsDocs, type CssVarsDocsOptions } from './css-vars-docs';
import type { Plugin } from 'postcss';

const cssVarsDocsPlugin = (options: CssVarsDocsOptions = {}): Plugin => {
    return {
        postcssPlugin: 'postcss-css-vars-docs',
        Once(_root, { result }) {
            const filePath: string = result.opts.from
                ? result.opts.from.split('?')[0]
                : 'unknown file';

            if (filePath !== 'unknown file' && fs.existsSync(filePath)) {
                options.files = [filePath];
                const cssVarsDocs = new CssVarsDocs(options);

                cssVarsDocs.processFiles();
            }
        }
    };
};

cssVarsDocsPlugin.postcss = true;

export default cssVarsDocsPlugin;

const fs = require('fs');
const CssVarsDocs = require('./css-vars-docs.cjs');

module.exports = (options = {}) => {
    return {
        postcssPlugin: 'postcss-css-vars-docs',
        Once(_root, { result }) {
            // Get the file path, removing any query parameters (e.g., for Vue SFCs)
            const filePath = result.opts.from ? result.opts.from.split('?')[0] : 'unknown file';

            // Process the file if it exists
            if (filePath !== 'unknown file' && fs.existsSync(filePath)) {
                // Set the files option to the current file to override the default options
                options.files = [filePath];
                const cssVarsDocs = new CssVarsDocs(options);

                // If `preview` is enabled, skip actual file modification
                options.preview ? cssVarsDocs.previewFiles() : cssVarsDocs.processFiles();
            }
        }
    };
};

module.exports.postcss = true;

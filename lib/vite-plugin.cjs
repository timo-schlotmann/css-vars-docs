const CssVarsDocs = require('./css-vars-docs.cjs'); // Import the CssVarsDocs class

/**
 * Vite Plugin for css-vars-docs
 * @param {Object} userOptions User-defined options for the plugin
 * @param {number} [userOptions.delay=0] Delay between processing the same file (in milliseconds)
 * @param {string[]} [userOptions.extensions=['.css', '.scss', '.less', '.vue', '.html']] Allowed file extensions for processing
 * @param {Object} [userOptions.config={}] Configuration options for css-vars-docs
 * @returns {Object} Vite Plugin definition
 */
module.exports = function cssVarsDocsVite(userOptions = {}) {
    const defaultOptions = {
        delay: 200, // Default delay is 0ms
        extensions: ['.css', '.scss', '.less', '.vue', '.html'], // Default extensions to watch
        config: {} // Default configuration for css-vars-docs
    };

    // Merge default options with user-provided options
    const options = { ...defaultOptions, ...userOptions };

    // Map to track recently processed files and their timestamps
    const processedFiles = new Map();

    return {
        name: 'css-vars-docs',
        apply: 'serve',

        handleHotUpdate({ file, server }) {
            // Skip files that do not match the allowed extensions
            if (!options.extensions.some((ext) => file.endsWith(ext))) {
                return;
            }

            const now = Date.now();
            const lastProcessed = processedFiles.get(file) || 0;

            options.delay = options.delay || 200;

            // Skip rapid reprocessing for the same file
            if (now - lastProcessed < options.delay) {
                return;
            }

            processedFiles.set(file, now);

            try {
                // Create a new CssVarsDocs instance and pass the config
                const cssVarsDocs = new CssVarsDocs({
                    ...options.config, // Pass user-defined configuration for css-vars-docs
                    files: [file], // Add the current file to the config
                    logLevel: options.config?.logLevel || 1 // Ensure logLevel has a default
                });

                // Process the file
                cssVarsDocs.processFiles();

                // Trigger a full reload if changes were detected
                server.ws.send({
                    type: 'full-reload',
                    path: file
                });
            } catch (error) {
                console.error(`Error processing file with css-vars-docs: ${file}`, error);
            }
        }
    };
};

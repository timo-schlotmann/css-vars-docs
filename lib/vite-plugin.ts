import { CssVarsDocs, type CssVarsDocsOptions } from './css-vars-docs'; // Import the CssVarsDocs class
import type { Plugin, ViteDevServer } from 'vite';

interface CssVarsDocsViteOptions {
    delay?: number; // Delay between processing the same file (in milliseconds)
    extensions?: string[]; // Allowed file extensions for processing
    config?: CssVarsDocsOptions; // Configuration options for css-vars-docs
}

export default function cssVarsDocsVite(userOptions: CssVarsDocsViteOptions = {}): Plugin {
    const defaultOptions: CssVarsDocsViteOptions = {
        delay: 200,
        extensions: ['.css', '.scss', '.less', '.vue', '.html'],
        config: {}
    };

    const options = { ...defaultOptions, ...userOptions };
    const processedFiles = new Map<string, number>();

    return {
        name: 'css-vars-docs',
        apply: 'serve',

        async handleHotUpdate({ file, server }: { file: string; server: ViteDevServer }) {
            // Skip files that do not match the allowed extensions
            if (options.extensions && !options.extensions.some((ext) => file.endsWith(ext))) {
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
                    ...options.config,
                    files: [file],
                    logLevel: (options.config?.logLevel as number) || 1
                });

                // Process the file (await for async function)
                await cssVarsDocs.processFiles();

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
}

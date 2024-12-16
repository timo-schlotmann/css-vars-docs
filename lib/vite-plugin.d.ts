// vite-plugin.d.ts

import type { Plugin } from 'vite';

interface CssVarsDocsOptions {
    delay?: number; // Delay between processing the same file (in milliseconds)
    extensions?: string[]; // Allowed file extensions for processing
    config?: Record<string, unknown>; // Configuration options for css-vars-docs
}

/**
 * Vite Plugin for css-vars-docs
 * @param options User-defined options for the plugin
 * @returns Vite Plugin definition
 */
declare function cssVarsDocsVite(options?: CssVarsDocsOptions): Plugin;

export = cssVarsDocsVite;

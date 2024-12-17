import * as path from 'path';
import * as fs from 'fs';
import { globSync } from 'glob';

export interface CssVarsDocsConfig {
    files: string[];
    newLinesBeforeGroup: boolean;
    title: string;
    blockIdentifier: string;
    logPrefix: string;
    indent: string;
    indentStyle: boolean;
    prefixRegex: RegExp;
    variableRegex: RegExp;
    styleBlockRegex: RegExp;
    excludeNodeModules: boolean;
    loadConfig: boolean;
    logLevel: number;
    preview: boolean;
}

export type CssVarsDocsOptions = Partial<CssVarsDocsConfig>;

export type CommentBlock = {
    blockStartIndex: number;
    blockEndIndex: number;
    existingCommentBlock: string;
};

export class CssVarsDocs {
    public config: CssVarsDocsConfig;
    public constructorConfig: Partial<CssVarsDocsConfig> = {};

    // Possible configuration file names
    private baseConfigNames = [
        'css-vars-docs.config',
        'cssvarsdocs.config',
        'cssvd.config',
        'cvd.config'
    ];

    // Possible configuration file extensions
    private extensions = ['js', 'cjs', 'mjs'];

    private possibleConfigFiles: string[];

    constructor(config: Partial<CssVarsDocsConfig> = {}) {
        this.config = {
            files: [],
            newLinesBeforeGroup: false,
            title: 'Used Variables in this file:',
            blockIdentifier: 'CssVarsDocs :: generated',
            logPrefix: 'CssVarsDocs :: ',
            indent: '',
            indentStyle: true,
            prefixRegex: /^--([^-\s]+)/,
            variableRegex: /--[\w-]+/g,
            styleBlockRegex: /<style[^>]*>([\s\S]*?)<\/style>/i,
            excludeNodeModules: true,
            loadConfig: true,
            logLevel: 2,
            preview: false,
            // Override default config with provided config
            ...config
        };

        // Store the provided configuration in a separate object to merge it with the loaded config
        this.constructorConfig = config;

        // Prepare all possible configuration file names
        this.possibleConfigFiles = this.baseConfigNames.flatMap((base) =>
            this.extensions.map((ext) => `${base}.${ext}`)
        );

        this.log(3, `Constructor config: ${JSON.stringify(this.constructorConfig)}`);
    }

    // Logs messages only if the log level is equal or higher than the provided level
    private log(level: number, message: string): void {
        if (this.config.preview && this.config.logLevel < 2) this.config.logLevel = 2;

        if (this.config.logLevel >= level) {
            const prefix = this.config.preview ? 'PREVIEW :: ' : '';
            console.log(`${prefix}${this.config.logPrefix}${message}`);
        }
    }

    // Loads configuration from a local file if it exists and merges it with the default settings
    private async loadConfig(): Promise<void> {
        for (const configFileName of this.possibleConfigFiles) {
            const configFilePath = path.resolve(process.cwd(), configFileName);

            if (fs.existsSync(configFilePath)) {
                try {
                    let fileConfig: Partial<CssVarsDocsConfig> = {};

                    // Always use dynamic import to support ESM and CJS
                    const module = await import(configFilePath);
                    fileConfig = module.default || module;

                    this.config = { ...this.config, ...fileConfig };
                    this.log(2, `Custom configuration loaded from ${configFileName}.`);
                    return;
                } catch (err) {
                    this.log(
                        0,
                        `${this.config.logPrefix}Error loading configuration from ${configFileName}. Using default settings.`
                    );
                    console.error(err);
                }
            }
        }
        this.log(2, `No custom configuration file found. Using default settings.`);
    }

    // Prepares the configuration by loading the default, file-based, and constructor settings
    public async prepareConfig(): Promise<void> {
        if (this.config.loadConfig) {
            await this.loadConfig();
            // Override loaded config with provided settings from constructor
            if (Object.keys(this.constructorConfig).length > 0) {
                this.config = { ...this.config, ...this.constructorConfig };
            }
        }

        this.log(3, `Prepared config: ${JSON.stringify(this.config, null, 2)}\n`);
    }

    // Checks if a file exists and logs an error if it doesn't
    private fileExists(file: string): boolean {
        if (!fs.existsSync(file)) {
            this.log(0, `${this.config.logPrefix}File not found: ${file}`);
            return false;
        }
        return true;
    }

    // Resolves the absolute path of a file
    private absolutePath(file: string): string {
        return path.resolve(file.replace(/\/+/g, '/'));
    }

    // Checks if a file is a CSS-related file based on its extension
    private isCssFile(sourceFile: string): boolean {
        return (
            sourceFile.endsWith('.css') ||
            sourceFile.endsWith('.scss') ||
            sourceFile.endsWith('.sass')
        );
    }

    // Counts leading spaces before the first <style> block to maintain indentation
    private countLeadingSpacesBeforeStyle(fileContent: string): number {
        const styleLine = fileContent.split('\n').find((line) => line.includes('<style'));
        let count = 0;
        if (styleLine) {
            const match = styleLine.match(/^(\s*)<style/);
            count = match ? match[1].length : 0;
        }
        return count;
    }

    // Extracts all unique CSS variable names from the file content
    public extractCssVariableNames(fileContent: string): string[] {
        const variableNames = new Set<string>();
        let match;
        while ((match = this.config.variableRegex.exec(fileContent)) !== null) {
            variableNames.add(match[0]);
        }
        return Array.from(variableNames).sort();
    }

    // Groups variables by prefix
    private groupVariablesByPrefix(variableNames: string[]): string[] {
        const groupedVariables: string[] = [];
        let currentPrefix: string = '';
        let currentGroup: string[] = [];
        let isFirstGroup: boolean = true;

        variableNames.forEach((variable) => {
            const prefixMatch = variable.match(this.config.prefixRegex);
            const prefix: string = prefixMatch ? prefixMatch[1] : '';

            if (prefix !== currentPrefix) {
                if (currentGroup.length > 0) {
                    if (isFirstGroup || this.config.newLinesBeforeGroup) {
                        groupedVariables.push('');
                    }
                    isFirstGroup = false;
                    groupedVariables.push(...currentGroup);
                }
                currentGroup = [];
                currentPrefix = prefix;
            }
            currentGroup.push(variable);
        });

        if (currentGroup.length > 0) {
            if (isFirstGroup || this.config.newLinesBeforeGroup) {
                groupedVariables.push('');
            }
            groupedVariables.push(...currentGroup);
        }

        return groupedVariables;
    }

    // Finds the comment block in the content based on the block identifier
    private findCommentBlock(content: string, blockIdentifier: string): CommentBlock {
        const blockIdentifierIndex = content.indexOf(blockIdentifier);

        if (blockIdentifierIndex === -1) {
            return { blockStartIndex: -1, blockEndIndex: -1, existingCommentBlock: '' };
        }

        const blockStartIndex = content.lastIndexOf('/*', blockIdentifierIndex);
        const blockEndIndex = content.indexOf('*/', blockIdentifierIndex) + 2;
        const existingCommentBlock = content.slice(blockStartIndex, blockEndIndex);

        return { blockStartIndex, blockEndIndex, existingCommentBlock };
    }

    // Creates a comment block containing grouped variables with optional indentation
    public createCommentBlock(
        groupedVariables: string[],
        globalIndent: number = 0,
        indent: string = this.config.indent
    ): string {
        if (this.config.indentStyle) {
            globalIndent += globalIndent / 2;
        }

        const indentGlobal = ' '.repeat(globalIndent);

        const lines: string[] = [
            `${indentGlobal}/*`,
            `${indentGlobal}${indent}${this.config.blockIdentifier}`,
            `${indentGlobal}${indent}${this.config.title}`,
            ...groupedVariables.map((v) => `${indentGlobal}${indent}${v}`),
            `${indentGlobal}*/`
        ];

        return lines.join('\n');
    }

    // Removes the comment block from the specified file
    private removeCommentBlock(sourceFile: string): void {
        let fileContent: string = fs.readFileSync(sourceFile, 'utf-8');

        // Check if the file contains the comment block
        const { blockStartIndex, blockEndIndex } = this.findCommentBlock(
            fileContent,
            this.config.blockIdentifier
        );

        if (blockStartIndex !== -1) {
            // Preview mode only shows the files that would be changed
            if (this.config.preview) {
                this.log(1, `Remove comment block from: ${sourceFile}`);
                return;
            }

            // Remove the identified comment block and any surrounding whitespace or newlines
            const beforeBlock: string = fileContent.slice(0, blockStartIndex).trimEnd();
            const afterBlock: string = fileContent.slice(blockEndIndex).replace(/^\s*\n/, '');

            // Concatenate the content before and after the block, with any trailing whitespace removed
            const updatedContent: string = `${beforeBlock}\n${afterBlock}`;

            fs.writeFileSync(sourceFile, updatedContent, 'utf-8');
            this.log(1, `Removed comment block from: ${sourceFile}`);
        } else {
            this.log(2, `No comment block found in: ${sourceFile}`);
        }
    }

    // Adds or replaces the comment block containing CSS variables in the specified file
    private addOrReplaceVariableNamesComment(sourceFile: string): void {
        let fileContent: string = fs.readFileSync(sourceFile, 'utf-8');
        let updatedContent: string = fileContent;
        let currentVariableNames: string[] = [];
        let existingCommentBlock: string = '';
        let blockStartIndex: number, blockEndIndex: number;

        if (this.isCssFile(sourceFile)) {
            // CSS-File
            ({ blockStartIndex, blockEndIndex, existingCommentBlock } = this.findCommentBlock(
                fileContent,
                this.config.blockIdentifier
            ));

            if (blockStartIndex !== -1) {
                fileContent =
                    fileContent.slice(0, blockStartIndex) + fileContent.slice(blockEndIndex);
            }

            currentVariableNames = this.extractCssVariableNames(fileContent) as string[];
        } else {
            // Files with <style>-Block
            const match = this.config.styleBlockRegex.exec(fileContent);

            if (match) {
                let styleContent: string = match[1];

                ({ blockStartIndex, blockEndIndex, existingCommentBlock } = this.findCommentBlock(
                    styleContent,
                    this.config.blockIdentifier
                ));

                if (blockStartIndex !== -1) {
                    styleContent =
                        styleContent.slice(0, blockStartIndex) + styleContent.slice(blockEndIndex);
                    fileContent = fileContent.replace(match[1], styleContent);
                }

                currentVariableNames = this.extractCssVariableNames(styleContent) as string[];
            } else {
                this.log(2, `No <style> block found - File skipped: ${sourceFile}.`);
                return;
            }
        }

        // Cancel if no CSS variables are found
        if (currentVariableNames.length === 0) {
            this.log(2, `No CSS variables found - File skipped: ${sourceFile}.`);
            return;
        }

        const groupedVariables: string[] = this.groupVariablesByPrefix(currentVariableNames);
        const existingVariableNames: string[] = existingCommentBlock
            ? (this.extractCssVariableNames(existingCommentBlock) as string[])
            : [];

        // Check if the variable names have changed
        const hasDifference: boolean =
            existingVariableNames.length !== currentVariableNames.length ||
            !existingVariableNames.every((v, i) => v === currentVariableNames[i]);

        if (!hasDifference) {
            this.log(2, `No changes in variables - File skipped: ${sourceFile}.`);
            return;
        }

        // Preview-Modus: only show the files that would be changed
        if (this.config.preview) {
            this.log(1, `Update Comment block in: ${sourceFile}`);
            return;
        }

        // Update the content with the new comment block
        if (this.isCssFile(sourceFile)) {
            const newCommentBlock: string = this.createCommentBlock(groupedVariables);
            updatedContent = newCommentBlock + '\n' + fileContent;
        } else {
            const newCommentBlock: string = this.createCommentBlock(
                groupedVariables,
                this.countLeadingSpacesBeforeStyle(fileContent)
            );

            const newStyleContent: string =
                '\n' + newCommentBlock + '\n' + fileContent.match(this.config.styleBlockRegex)![1];
            updatedContent = fileContent.replace(
                fileContent.match(this.config.styleBlockRegex)![1],
                newStyleContent
            );
        }

        fs.writeFileSync(sourceFile, updatedContent, 'utf-8');
        this.log(1, `Updated Comment block in: ${sourceFile}`);
    }

    // Clears all comment blocks from the specified file or all files based on the configuration
    public async clearFiles(sourceFile?: string): Promise<void> {
        await this.prepareConfig();

        if (sourceFile) {
            const absolutePath: string = this.absolutePath(sourceFile);
            if (!this.fileExists(absolutePath)) {
                return;
            }
            this.removeCommentBlock(absolutePath);
        } else {
            const includePatterns: string[] = this.config.files.filter(
                (pattern) => !pattern.startsWith('!')
            );
            const excludePatterns: string[] = this.config.files
                .filter((pattern) => pattern.startsWith('!'))
                .map((pattern) => pattern.slice(1));

            const files: string[] = includePatterns.flatMap((pattern) => globSync(pattern));
            const filteredFiles: string[] = files.filter((file) => {
                const inNodeModules: boolean = file.includes('node_modules');
                return (
                    (!inNodeModules || !this.config.excludeNodeModules) &&
                    !excludePatterns.some((excludePattern) => file.includes(excludePattern))
                );
            });

            if (filteredFiles.length === 0) {
                this.log(2, `No files found under files. Please check your configuration.`);
                return;
            }

            filteredFiles.forEach((file) => {
                const absolutePath: string = this.absolutePath(file);
                if (this.fileExists(absolutePath)) {
                    this.removeCommentBlock(absolutePath);
                }
            });
        }
    }

    // Processes files either based on a specific sourceFile or the configured patterns
    public async processFiles(sourceFile?: string): Promise<void> {
        await this.prepareConfig();

        if (sourceFile) {
            const absolutePath: string = this.absolutePath(sourceFile);
            if (!this.fileExists(absolutePath)) {
                return;
            }
            this.addOrReplaceVariableNamesComment(absolutePath);
        } else {
            const includePatterns: string[] = this.config.files.filter(
                (pattern) => !pattern.startsWith('!')
            );
            const excludePatterns: string[] = this.config.files
                .filter((pattern) => pattern.startsWith('!'))
                .map((pattern) => pattern.slice(1));

            // Collect all files based on patterns
            const files: string[] = includePatterns.flatMap((pattern) => globSync(pattern));
            const filteredFiles: string[] = files.filter((file) => {
                const inNodeModules: boolean = file.includes('node_modules');
                return (
                    (!inNodeModules || !this.config.excludeNodeModules) &&
                    !excludePatterns.some((excludePattern) => file.includes(excludePattern))
                );
            });

            if (filteredFiles.length === 0) {
                this.log(2, `No files found under files. Please check your configuration.`);
                return;
            }

            filteredFiles.forEach((file) => {
                const absolutePath: string = this.absolutePath(file);
                if (this.fileExists(absolutePath)) {
                    this.addOrReplaceVariableNamesComment(absolutePath);
                }
            });
        }
    }
}

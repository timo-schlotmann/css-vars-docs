const path = require('path');
const fs = require('fs');
const { globSync } = require('glob');

class CssVarsDocs {
    // Default configuration settings
    config = {
        files: [], // Files to process
        newLinesBeforeGroup: false, // Whether to add a new line between variable groups
        title: 'Used Variables in this file:', // Header for the comment block
        blockIdentifier: 'CssVarsDocs :: generated', // Unique identifier for generated blocks
        logPrefix: 'CssVarsDocs :: ', // Prefix for log messages
        indent: '', // Default indentation
        indentStyle: true, // Whether to add extra indentation in <style> blocks
        prefixRegex: /^--([^-\s]+)/, // Regex to capture variable prefixes
        variableRegex: /--[\w-]+/g, // Regex to match CSS variables
        styleBlockRegex: /<style[^>]*>([\s\S]*?)<\/style>/i, // Regex to match <style> blocks in non-CSS files
        excludeNodeModules: true, // Exclude `node_modules` by default
        loadConfig: true, // Allow to load configuration file
        logLevel: 2, // 0 = errors only, 1 = changes only, 2 = verbose, 3 = debug
        preview: false // Preview mode to show changes without writing to files (if LogLevel > 2 it will be set to minimum 2)
    };

    // Stores only the provided configuration from the constructor to override possible file-based config later
    constructorConfig = {};

    // Possible configuration file names and extensions
    baseConfigNames = ['css-vars-docs.config', 'cssvarsdocs.config', 'cssvd.config', 'cvd.config'];
    extensions = ['js', 'cjs', 'mjs'];

    // Prepare all possible configuration file names
    possibleConfigFiles = this.baseConfigNames.flatMap((base) =>
        this.extensions.map((ext) => `${base}.${ext}`)
    );

    constructor(config = {}) {
        // Override default config with provided settings
        this.config = { ...this.config, ...config };
        // Store the provided configuration in a separate object to merge it with the loaded config
        this.constructorConfig = config;

        this.log(3, `Constructor config: ${JSON.stringify(this.constructorConfig, null, 2)}\n`);
    }

    // Logs messages only if the log level is equal or higher than the provided level
    log(level, message) {
        // Preview mode should always show changes
        if (this.config.preview && this.config.logLevel < 2) {
            this.config.logLevel = 2;
        }

        if (this.config.logLevel >= level) {
            const previewPrefix = this.config.preview ? 'PREVIEW :: ' : '';
            console.log(`${previewPrefix}${this.config.logPrefix}${message}`);
        }
    }

    // Loads configuration from a local file if it exists and merges it with the default settings
    async loadConfig() {
        for (const configFileName of this.possibleConfigFiles) {
            const configFilePath = path.resolve(process.cwd(), configFileName);
            if (fs.existsSync(configFilePath)) {
                try {
                    const fileConfig = configFilePath.endsWith('.cjs')
                        ? require(configFilePath)
                        : await import(configFilePath);

                    this.config = { ...this.config, ...(fileConfig.default || fileConfig) };
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
    async prepareConfig() {
        // Disable logging if onlyChanges is enabled
        this.config.showLog = this.config.showOnlyChanges ? false : this.config.showLog;

        // Load configuration from a file
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
    fileExists(file) {
        if (!fs.existsSync(file)) {
            this.log(0, `${this.config.logPrefix}File not found: ${file}`);
            return false;
        }
        return true;
    }

    // Resolves the absolute path of a file
    absolutePath(file) {
        return path.resolve(file.replace(/\/+/g, '/'));
    }

    // Checks if a file is a CSS-related file based on its extension
    isCssFile(sourceFile) {
        return (
            sourceFile.endsWith('.css') ||
            sourceFile.endsWith('.scss') ||
            sourceFile.endsWith('.sass')
        );
    }

    // Counts leading spaces before the first <style> block to maintain indentation
    countLeadingSpacesBeforeStyle(fileContent) {
        const styleLine = fileContent.split('\n').find((line) => line.includes('<style'));
        let count = 0;
        if (styleLine) {
            const match = styleLine.match(/^(\s*)<style/);
            count = match ? match[1].length : 0;
        }
        return count;
    }

    // Extracts all unique CSS variable names from the file content
    extractCssVariableNames(fileContent) {
        const variableNames = new Set();
        let match;
        while ((match = this.config.variableRegex.exec(fileContent)) !== null) {
            variableNames.add(match[0]);
        }
        return Array.from(variableNames).sort();
    }

    // Groups variables by prefix
    groupVariablesByPrefix(variableNames) {
        const groupedVariables = [];
        let currentPrefix = '';
        let currentGroup = [];
        let isFirstGroup = true;

        variableNames.forEach((variable) => {
            const prefixMatch = variable.match(this.config.prefixRegex);
            const prefix = prefixMatch ? prefixMatch[1] : '';

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
    findCommentBlock(content, blockIdentifier) {
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
    createCommentBlock(groupedVariables, globalIndent = 0, indent = this.config.indent) {
        if (this.config.indentStyle) {
            globalIndent += globalIndent / 2;
        }

        const indentGlobal = ' '.repeat(globalIndent);

        const lines = [
            `${indentGlobal}/*`,
            `${indentGlobal}${indent}${this.config.blockIdentifier}`,
            `${indentGlobal}${indent}${this.config.title}`,
            ...groupedVariables.map((v) => `${indentGlobal}${indent}${v}`),
            `${indentGlobal}*/`
        ];

        return lines.join('\n');
    }

    // Removes the comment block from the specified file
    removeCommentBlock(sourceFile) {
        let fileContent = fs.readFileSync(sourceFile, 'utf-8');

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
            const beforeBlock = fileContent.slice(0, blockStartIndex).trimEnd();
            const afterBlock = fileContent.slice(blockEndIndex).replace(/^\s*\n/, '');

            // Concatenate the content before and after the block, with any trailing whitespace removed
            const updatedContent = `${beforeBlock}\n${afterBlock}`;

            fs.writeFileSync(sourceFile, updatedContent, 'utf-8');
            this.log(1, `Removed comment block from: ${sourceFile}`);
        } else {
            this.log(2, `No comment block found in: ${sourceFile}`);
        }
    }

    // Adds or replaces the comment block containing CSS variables in the specified file
    addOrReplaceVariableNamesComment(sourceFile) {
        let fileContent = fs.readFileSync(sourceFile, 'utf-8');
        let updatedContent = fileContent;
        let currentVariableNames = [];
        let existingCommentBlock = '';
        let blockStartIndex, blockEndIndex;

        if (this.isCssFile(sourceFile)) {
            ({ blockStartIndex, blockEndIndex, existingCommentBlock } = this.findCommentBlock(
                fileContent,
                this.config.blockIdentifier
            ));
            if (blockStartIndex !== -1) {
                fileContent =
                    fileContent.slice(0, blockStartIndex) + fileContent.slice(blockEndIndex);
            }
            currentVariableNames = this.extractCssVariableNames(fileContent);
        } else {
            const match = this.config.styleBlockRegex.exec(fileContent);
            if (match) {
                let styleContent = match[1];
                ({ blockStartIndex, blockEndIndex, existingCommentBlock } = this.findCommentBlock(
                    styleContent,
                    this.config.blockIdentifier
                ));

                if (blockStartIndex !== -1) {
                    styleContent =
                        styleContent.slice(0, blockStartIndex) + styleContent.slice(blockEndIndex);
                    fileContent = fileContent.replace(match[1], styleContent);
                }
                currentVariableNames = this.extractCssVariableNames(styleContent);
            } else {
                this.log(2, `No <style> block found - File skipped: ${sourceFile}.`);
                return;
            }
        }

        if (currentVariableNames.length === 0) {
            this.log(2, `No CSS variables found - File skipped: ${sourceFile}.`);
            return;
        }

        const groupedVariables = this.groupVariablesByPrefix(currentVariableNames);
        const existingVariableNames = existingCommentBlock
            ? this.extractCssVariableNames(existingCommentBlock)
            : [];
        const hasDifference =
            existingVariableNames.length !== currentVariableNames.length ||
            !existingVariableNames.every((v, i) => v === currentVariableNames[i]);

        if (!hasDifference) {
            this.log(2, `No changes in variables - File skipped: ${sourceFile}.`);
            return;
        }

        // Preview mode only shows the files that would be changed
        if (this.config.preview) {
            this.log(1, `Update Comment block in: ${sourceFile}`);
            return;
        }

        if (this.isCssFile(sourceFile)) {
            const newCommentBlock = this.createCommentBlock(groupedVariables);
            updatedContent = newCommentBlock + '\n' + fileContent;
        } else {
            const newCommentBlock = this.createCommentBlock(
                groupedVariables,
                this.countLeadingSpacesBeforeStyle(fileContent)
            );
            const newStyleContent =
                '\n' + newCommentBlock + '\n' + fileContent.match(this.config.styleBlockRegex)[1];
            updatedContent = fileContent.replace(
                fileContent.match(this.config.styleBlockRegex)[1],
                newStyleContent
            );
        }

        fs.writeFileSync(sourceFile, updatedContent, 'utf-8');
        this.log(1, `Updated Comment block in: ${sourceFile}`);
    }

    // Clears all comment blocks from the specified file or all files based on the configuration
    async clearFiles(sourceFile) {
        await this.prepareConfig();

        if (sourceFile) {
            const absolutePath = this.absolutePath(sourceFile);
            if (!this.fileExists(absolutePath)) {
                return;
            }
            this.removeCommentBlock(absolutePath);
        } else {
            const includePatterns = this.config.files.filter((pattern) => !pattern.startsWith('!'));
            const excludePatterns = this.config.files
                .filter((pattern) => pattern.startsWith('!'))
                .map((pattern) => pattern.slice(1));

            const files = includePatterns.flatMap((pattern) => globSync(pattern));
            const filteredFiles = files.filter((file) => {
                const inNodeModules = file.includes('node_modules');
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
                const absolutePath = this.absolutePath(file);
                if (this.fileExists(absolutePath)) {
                    this.removeCommentBlock(absolutePath);
                }
            });
        }
    }

    // Processes files either based on a specific sourceFile or the configured patterns
    async processFiles(sourceFile) {
        await this.prepareConfig();

        if (sourceFile) {
            const absolutePath = this.absolutePath(sourceFile);
            if (!this.fileExists(absolutePath)) {
                return;
            }
            this.addOrReplaceVariableNamesComment(absolutePath);
        } else {
            const includePatterns = this.config.files.filter((pattern) => !pattern.startsWith('!'));
            const excludePatterns = this.config.files
                .filter((pattern) => pattern.startsWith('!'))
                .map((pattern) => pattern.slice(1));
            // Filter out `node_modules` if `excludeNodeModules` is true
            const files = includePatterns.flatMap((pattern) => globSync(pattern));
            const filteredFiles = files.filter((file) => {
                const inNodeModules = file.includes('node_modules');
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
                const absolutePath = this.absolutePath(file);
                if (this.fileExists(absolutePath)) {
                    this.addOrReplaceVariableNamesComment(absolutePath);
                }
            });
        }
    }
}

module.exports = CssVarsDocs;

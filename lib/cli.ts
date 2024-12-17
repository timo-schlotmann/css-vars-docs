#!/usr/bin/env node

import { Command } from 'commander';
import pkg from '../package.json';
import { CssVarsDocs, type CssVarsDocsOptions } from './css-vars-docs';

// Extend the configuration with the `remove` property
interface ExtendedCssVarsDocsOptions extends Partial<CssVarsDocsOptions> {
    remove?: boolean; // Adds the `remove` flag for CLI
}

// Initialize Commander.js
const program = new Command();

// Define program with basic info
program
    .name(pkg.name)
    .description(pkg.description.replace(/\.\s*/g, '.\n'))
    .version(pkg.version, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command');

// Add config options
program
    .option('-p, --preview', 'Perform a dry run without writing to files :: default: false')
    .option(
        '-f, --files <files...>',
        'Files to process, separated by spaces or commas :: default: []'
    )
    .option('-r, --remove', 'Remove existing comments from the files :: default: false')
    .option(
        '-n, --new-lines-before-group',
        'Add a new line between variable groups :: default: false'
    )
    .option('-t, --title <title>', 'Header for the comment block :: default: "CSS Variables"')
    .option(
        '-b, --block-identifier <identifier>',
        'Unique identifier for generated blocks :: default: "CssVarsDocs"'
    )
    .option('-i, --indent <indent>', "Default indentation :: default: ''")
    .option('-is, --indent-style', 'Add extra indentation in <style> blocks :: default: true')
    .option('-ex, --exclude-node-modules', 'Exclude `node_modules` by default :: default: true')
    .option('-lc, --load-config', 'Allow to load configuration file :: default: true')
    .option('-lp, --log-prefix <prefix>', 'Prefix for log messages :: default: "CssVarsDocs"')
    .option(
        '-ll, --log-level <level>',
        'Log level: 0 = errors only, 1 = changes only, 2 = verbose, 3 = debug :: default: 2'
    );

// Parse arguments
program.parse(process.argv);

const options = program.opts() as Partial<ExtendedCssVarsDocsOptions>;

// Process and normalize `files` option
if (options.files && options.files.length > 0) {
    options.files = options.files
        .join(' ') // Join all parts into a single string
        .split(',') // Split by commas
        .flatMap((item) => item.trim().split(/\s+/)); // Split by spaces within each item
}

// Log options at verbose levels
if ((options.logLevel ?? 2) >= 2) {
    console.log(`CLI :: options: ${JSON.stringify(options, null, 2)}\n`);
}

// Instantiate CssVarsDocs with options
const cssVarsDocs = new CssVarsDocs(options);

// Process files or clear files based on `remove` flag
if (options.remove) {
    cssVarsDocs.clearFiles();
} else {
    cssVarsDocs.processFiles();
}

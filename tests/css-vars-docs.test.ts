import { CssVarsDocs } from '../lib/css-vars-docs';

test('Generates comment block correctly in css files', () => {
    const cssVarsDocs = new CssVarsDocs();
    const mockFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
            --secondary-color: #00ff00;
        }
    </style>
    `;
    const variableNames = cssVarsDocs.extractCssVariableNames(mockFileContent);

    const expectedCommentBlock = `/*
${cssVarsDocs.config.blockIdentifier}
${cssVarsDocs.config.title}
--primary-color
--secondary-color
*/`;

    const commentBlock = cssVarsDocs.createCommentBlock(variableNames);
    expect(commentBlock).toBe(expectedCommentBlock);
});

test('Generates comment block correctly in file with <style> block', () => {
    const cssVarsDocs = new CssVarsDocs();
    const mockFileContent = `
    <div>
        <style>
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
            }
        </style>
    </div>
    `;

    const variableNames = cssVarsDocs.extractCssVariableNames(mockFileContent);

    const expectedCommentBlock = `/*
${cssVarsDocs.config.blockIdentifier}
${cssVarsDocs.config.title}
--bg-color
--text-color
*/`;

    const commentBlock = cssVarsDocs.createCommentBlock(variableNames);
    expect(commentBlock).toBe(expectedCommentBlock);
});

test('Updates comment block when a variable is removed', () => {
    const cssVarsDocs = new CssVarsDocs();

    // Ursprünglicher Inhalt mit zwei Variablen
    const initialFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
            --secondary-color: #00ff00;
        }
    </style>
    `;
    const initialVariableNames = cssVarsDocs.extractCssVariableNames(initialFileContent);
    const initialCommentBlock = cssVarsDocs.createCommentBlock(initialVariableNames);

    const expectedInitialCommentBlock = `/*
${cssVarsDocs.config.blockIdentifier}
${cssVarsDocs.config.title}
--primary-color
--secondary-color
*/`;

    // Überprüfe den initialen Kommentarblock
    expect(initialCommentBlock).toBe(expectedInitialCommentBlock);

    // Aktualisierter Inhalt, bei dem eine Variable entfernt wurde
    const updatedFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
        }
    </style>
    `;
    const updatedVariableNames = cssVarsDocs.extractCssVariableNames(updatedFileContent);
    const updatedCommentBlock = cssVarsDocs.createCommentBlock(updatedVariableNames);

    const expectedUpdatedCommentBlock = `/*
${cssVarsDocs.config.blockIdentifier}
${cssVarsDocs.config.title}
--primary-color
*/`;

    // Überprüfe, dass der Kommentarblock aktualisiert wird, wenn eine Variable entfernt wurde
    expect(updatedCommentBlock).toBe(expectedUpdatedCommentBlock);
});

test('Generates comment block with indent', async () => {
    const cssVarsDocs = new CssVarsDocs({
        files: [],
        indent: '    '
    });

    // Prepare config manually, because we don't have a file to process
    await cssVarsDocs.prepareConfig();

    const mockFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
            --secondary-color: #00ff00;
        }
    </style>
    `;

    const variableNames = cssVarsDocs.extractCssVariableNames(mockFileContent);
    const indent = ' '.repeat(4);
    const expectedCommentBlock = `/*
${indent}${cssVarsDocs.config.blockIdentifier}
${indent}${cssVarsDocs.config.title}
${indent}--primary-color
${indent}--secondary-color
*/`;

    const commentBlock = cssVarsDocs.createCommentBlock(variableNames, 0);

    expect(commentBlock).toBe(expectedCommentBlock);
});

test('Generates comment block with custom title', async () => {
    const cssVarsDocs = new CssVarsDocs({
        files: [],
        title: 'Custom Title'
    });

    // Prepare config manually, because we don't have a file to process
    await cssVarsDocs.prepareConfig();

    const mockFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
            --secondary-color: #00ff00;
        }
    </style>
    `;
    const variableNames = cssVarsDocs.extractCssVariableNames(mockFileContent);

    const expectedCommentBlock = `/*
${cssVarsDocs.config.blockIdentifier}
Custom Title
--primary-color
--secondary-color
*/`;

    const commentBlock = cssVarsDocs.createCommentBlock(variableNames);
    expect(commentBlock).toBe(expectedCommentBlock);
});

test('Generates comment block with custom blockIdentifier', async () => {
    const cssVarsDocs = new CssVarsDocs({
        files: [],
        blockIdentifier: 'Custom blockIdentifier'
    });

    // Prepare config manually, because we don't have a file to process
    await cssVarsDocs.prepareConfig();

    const mockFileContent = `
    <style>
        :root {
            --primary-color: #ff0000;
            --secondary-color: #00ff00;
        }
    </style>
    `;

    const variableNames = cssVarsDocs.extractCssVariableNames(mockFileContent);

    const expectedCommentBlock = `/*
Custom blockIdentifier
${cssVarsDocs.config.title}
--primary-color
--secondary-color
*/`;

    const commentBlock = cssVarsDocs.createCommentBlock(variableNames);
    expect(commentBlock).toBe(expectedCommentBlock);
});

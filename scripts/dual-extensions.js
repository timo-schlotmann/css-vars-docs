const fs = require('fs');
const path = require('path');

// Main function: Renames files and updates imports accordingly
function renameAndFixImports(directory, oldExt, newExt) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);

        // Recursively process subdirectories
        if (fs.statSync(filePath).isDirectory()) {
            renameAndFixImports(filePath, oldExt, newExt);
        }
        // Process only files with the specified old extension
        else if (file.endsWith(oldExt)) {
            const newFilePath = filePath.replace(new RegExp(`\\${oldExt}$`), newExt);

            // Read file content
            let content = fs.readFileSync(filePath, 'utf-8');

            // Update ONLY './css-vars-docs' imports/requires
            content = content.replace(/(['"]\.\/css-vars-docs)(['"])/g, `$1${newExt}$2`);
            fs.writeFileSync(filePath, content, 'utf-8');

            // Rename the file
            fs.renameSync(filePath, newFilePath);
            // console.log(`Renamed and fixed: ${filePath} → ${newFilePath}`);
        }
    }
}

// Start the main function for both CJS and ESM outputs
const cjsDir = path.resolve(__dirname, '../dist/cjs');
const esmDir = path.resolve(__dirname, '../dist/esm');

renameAndFixImports(cjsDir, '.js', '.cjs'); // Process CJS files
renameAndFixImports(esmDir, '.js', '.mjs'); // Process ESM files

// console.log('Files have been renamed and imports updated.');

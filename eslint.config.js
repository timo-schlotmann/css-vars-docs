const prettierConfig = require('eslint-config-prettier');
const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                browser: 'readonly',
                node: 'readonly',
                jest: 'readonly'
            }
        },
        plugins: {
            prettier: eslintPluginPrettier
        },
        rules: {
            ...prettierConfig.rules,
            'prettier/prettier': ['error']
        }
    }
];

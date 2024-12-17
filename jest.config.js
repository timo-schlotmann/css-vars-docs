module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.cjs.json', isolatedModules: true }]
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    testMatch: ['<rootDir>/tests/**/*.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist/']
};

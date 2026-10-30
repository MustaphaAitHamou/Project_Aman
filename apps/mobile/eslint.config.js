// Configuration ESLint « flat » basée sur eslint-config-expo.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'dist-native/**',
      'web-build/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'coverage/**',
      'public/**',
    ],
  },
  {
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // Scripts d'outillage exécutés en ligne de commande.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    rules: {
      'import/first': 'off',
      // Les fabriques de jest.mock() doivent utiliser require().
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);

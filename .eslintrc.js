module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'chai-friendly'],
  extends: [
    'standard',
    'plugin:prettier/recommended',
    'plugin:node/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'node/no-unsupported-features/es-syntax': ['off'],
    'node/no-unpublished-import': ['off'],
    'no-useless-constructor': ['off'],
    'node/no-missing-import': ['off'],
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['express'],
      },
    ],
  },
  overrides: [
    {
      files: 'packages/*/test/**/*.ts',
      rules: {
        'no-unused-expressions': 'off',
        'chai-friendly/no-unused-expressions': 'error',
      },
    },
  ],
};

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Integra Prettier com ESLint
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn', // Avisa sobre console.log
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_|next' }, // Ignora 'next' e variáveis começando com _
    ],
    '@typescript-eslint/no-explicit-any': 'warn', // Permite 'any' com um aviso
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn', // Avisa sobre o uso de '!'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.eslintrc.js',
    'jest.config.ts',
  ],
};
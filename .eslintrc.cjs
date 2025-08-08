module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules', '.astro'],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      extends: ['plugin:astro/recommended'],
      env: {
        browser: true,
        node: true,
        es2022: true,
      },
      rules: {
        // Disable rules that are too strict for Astro components
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-undef': 'off', // Astro handles this
      },
    },
    {
      files: [
        'src/utils/error-reviewer.ts',
        'src/utils/logger.ts',
        'src/tests/*.test.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      files: ['src/pages/api/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
  rules: {
    // Make rules less strict for deployment
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-namespace': [
      'error',
      {
        allowDeclarations: true,
        allowDefinitionFiles: true,
      },
    ],
    // Disable problematic rules for deployment
    'no-undef': 'off', // TypeScript handles this better
    'prefer-const': 'warn',
    'no-console': 'warn',
  },
};

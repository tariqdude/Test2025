import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import tailwind from 'eslint-plugin-tailwindcss';
import prettier from 'eslint-config-prettier';

export default [
  // Base JS/TS recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Astro specific parsing + rules
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astro.parsers.astro,
    },
    plugins: {
      astro,
    },
    rules: {
      // Example: disable conflicting rule noise inside templates
      'astro/no-set-html-directive': 'warn',
    },
  },
  // Tailwind utility class linting
  {
    plugins: { tailwind },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  // Project–specific overrides
  {
    files: ['src/**/*.{ts,tsx,js}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
  // Ignore generated & build output
  {
    ignores: ['dist', '.astro', 'node_modules'],
  },
  // Prettier last to disable stylistic conflicts
  prettier,
];

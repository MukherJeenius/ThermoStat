import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'test-results', 'design/**', 'pipeline/**', 'public/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // explicit table roles are kept on purpose: changing display drops table semantics in Safari (spec 9.6)
      'jsx-a11y/no-redundant-roles': ['error', { nav: ['navigation'], table: ['table'], thead: ['rowgroup'], tbody: ['rowgroup'], tr: ['row'], td: ['cell'], th: ['columnheader'] }],
      'jsx-a11y/no-interactive-element-to-noninteractive-role': ['error', { tr: ['row'], td: ['cell'], th: ['columnheader'] }],
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Data strings render as text (spec 15).' },
      ],
    },
  },
  {
    // the engine is pure TypeScript: no React, MapLibre, deck.gl or DOM (spec 8.1)
    files: ['src/engine/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'react/*', 'maplibre-gl', '@deck.gl/*', 'pmtiles', '@protomaps/*', '../ui/*', '../map/*'] },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage'],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
);

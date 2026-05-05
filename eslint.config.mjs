import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // set-state-in-effect produces false positives for intentional patterns:
      // loading state updates at the start of fetch effects, and functional
      // updater forms inside effects. Disable it; exhaustive-deps is sufficient.
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  }
);

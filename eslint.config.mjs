import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // This app is not using the React Compiler yet, so keep these
      // from blocking lint on otherwise valid state-management patterns.
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Several screens intentionally render remote/chat-uploaded images
      // directly, so don't require next/image everywhere.
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

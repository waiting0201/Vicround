import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // next-env.d.ts 由 Next 產生（含 triple-slash reference），public/admin 是後台 SPA 的產物
    ignores: ['.next/**', 'public/admin/**', 'next-env.d.ts'],
  },
];

export default config;

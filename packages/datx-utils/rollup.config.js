import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle';
import generatePackageJson from 'rollup-plugin-generate-package-json';

import pkg from './package.json';

export default [
  {
    input: './src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
    plugins: [
      resolve(),
      commonjs(),
      excludeDependenciesFromBundle(),
      typescript({
        typescript: require('typescript'),
        tslib: require('tslib'),
        tsconfig: './tsconfig.build.json',
      }),
      terser({
        toplevel: true,
        compress: {
          passes: 3,
        },
        output: {
          comments: false,
        },
      }),
      generatePackageJson({
        outputFolder: 'dist',
        baseContents: (pack) => ({
          ...pack,
          main: './index.cjs.js',
          module: './index.esm.js',
          typings: './index.d.ts',
          jest: undefined,
          scripts: undefined,
          devDependencies: {},
          husky: undefined,
        }),
      }),
    ],
    onwarn(warning, rollupWarn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        rollupWarn(warning);
      }
    },
  },
];

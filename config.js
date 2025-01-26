import { createRequire } from 'node:module'
import process from 'node:process'

import eslint from '@eslint/js'
import TsParser from '@typescript-eslint/parser'
import JsxA11y from 'eslint-plugin-jsx-a11y'
import TsLint from '@typescript-eslint/eslint-plugin'
import Jest from 'eslint-plugin-jest'
import JestDom from 'eslint-plugin-jest-dom'
import React from 'eslint-plugin-react'
import ReactHooks from 'eslint-plugin-react-hooks'
import TestingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'

const require = createRequire(import.meta.url)
function moduleExists(moduleName) {
    try {
        require.resolve(moduleName)
        return true
    } catch {
        return false
    }
}

/** @type {import('eslint').Linter.Config[]} */
const config = [
    eslint.configs.recommended,
]

config.push(
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: {
            'jsx-a11y': JsxA11y,
        },
        rules: JsxA11y.configs.recommended.rules,
    },
    {
        files: ['**/*.jsx'],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
    },
)

if (moduleExists('jest')) {
    config.push(
        {
            files: ['test/**', 'tests/**', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
            plugins: {
                'jest': Jest,
            },
            rules: Jest.configs.recommended.rules,
            languageOptions: {
                globals: globals.jest,
            },
        },
        {
            files: ['test/**', 'tests/**', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
            plugins: {
                'jest-dom': JestDom,
            },
            rules: JestDom.configs.recommended.rules,
        },
    )
}

if (moduleExists('react')) {
    config.push(
        {
            plugins: {
                'react': React,
            },
            rules: React.configs.recommended.rules,
            settings: {
                react: {
                    version: 'detect',
                },
            },
        },
        {
            plugins: {
                'react-hooks': ReactHooks,
            },
            rules: ReactHooks.configs.recommended.rules,
        },
        {
            plugins: {
                'testing-library': TestingLibrary,
            },
            rules: TestingLibrary.configs.react.rules,
        },
    )
} else {
    config.push(
        {
            plugins: {
                'testing-library': TestingLibrary,
            },
            rules: TestingLibrary.configs.dom.rules,
        },
    )
}

if (moduleExists('typescript')) {
    config.push(
        {
            files: ['**/*.{ts,tsx}'],
            languageOptions: {
                parser: TsParser,
                parserOptions: {
                    project: './tsconfig.json',
                },
            },
        },
        {
            files: ['**/*.{ts,tsx}'],
            plugins: {
                // @ts-ignore
                '@typescript-eslint': TsLint,
            },
            rules: {
                ...TsLint.configs.recommended.rules,

                ...TsLint.configs['recommended-requiring-type-checking'].rules,

                // this rule causes an error with the new eslint config format
                '@typescript-eslint/require-await': 'off',
            },
        },
        {
            files: ['**/*.{ts,tsx}'],
            rules: {
                'no-undef': 0,
                'no-redeclare': 0,
                '@typescript-eslint/no-floating-promises': [2, { ignoreVoid: true }],
                '@typescript-eslint/no-unsafe-argument': 1,
                '@typescript-eslint/no-unsafe-assignment': 1,
                '@typescript-eslint/no-unsafe-call': 1,
                '@typescript-eslint/no-unsafe-member-access': 1,
                '@typescript-eslint/no-unsafe-return': 1,
                '@typescript-eslint/restrict-template-expressions': [2, { allowNumber: true }],
            },
        },
    )
}

config.push(
    {
        rules: {
            'comma-dangle': [2, 'always-multiline'],
            'comma-spacing': 2,
            'eol-last': 2,
            'indent': 2,
            'jsx-quotes': [2, 'prefer-double'],
            'no-trailing-spaces': 2,
            'operator-linebreak': [2, 'before'],
            'quotes': [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
            'semi': [2, 'never', { beforeStatementContinuationChars: 'always' }],
        },
    },
    {
        files: ['**/*.{js,jsx,cjs,mjs}'],
    },
    {
        files: ['test/**', '**/*.{test,spec}.*', '**/*.stories.*'],
        rules: {
            'react/prop-types': 0,
        },
    },
)

if (process.env.NODE_ENV === 'development') {
    config.push(
        {
            rules: {
                'indent': 1,
                'no-unused-vars': 1,
                'no-unreachable': 1,
            },
        },
    )
}

config.push(
    {
        ignores: [
            'build/**',
            'coverage/**',
            'dist/**',
            'node_modules/**',
            'var/**',
            '**/*.d.ts',
        ],
    },
)

export default config

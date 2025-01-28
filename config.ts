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
import { Linter } from 'eslint'

const require = createRequire(import.meta.url)
function moduleExists(moduleName: string) {
    try {
        require.resolve(moduleName)
        return true
    } catch {
        return false
    }
}

/**
 * @internal
 */
export const filePatterns = {
    jsFiles: ['**/*.{js,jsx,mjs,cjs}'],
    tsFiles: ['**/*.{ts,tsx,mts,cts}'],
    jtsxFiles: ['**/*.[jt]sx'],
    testFiles: [
        ['{test,tests}/**', '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
        ['**/__tests__/**', '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
        '**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
    ],
    storyFiles: ['**/*.stories.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
}

const config: Linter.Config[] = [
    {
        files: [...filePatterns.jsFiles],
    },
    {
        files: [...filePatterns.jtsxFiles],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
    },
    eslint.configs.recommended,
]

// Typescript
if (moduleExists('typescript')) {
    config.push(
        {
            files: [...filePatterns.tsFiles],
            languageOptions: {
                parser: TsParser,
                parserOptions: {
                    projectService: true,
                },
            },
        },
        {
            files: [...filePatterns.tsFiles],
            plugins: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
            files: [...filePatterns.tsFiles],
            rules: {
                'no-undef': 0,
                'no-redeclare': 0,
                'no-dupe-class-members': 0,
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

// Jest
if (moduleExists('jest')) {
    config.push(
        {
            files: [...filePatterns.testFiles],
            plugins: {
                'jest': Jest,
            },
            rules: Jest.configs.recommended.rules,
            languageOptions: {
                globals: globals.jest,
            },
        },
        {
            files: [...filePatterns.testFiles],
            plugins: {
                'jest-dom': JestDom,
            },
            rules: JestDom.configs.recommended.rules,
        },
    )
}

// React
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                'react-hooks': ReactHooks,
            },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            rules: ReactHooks.configs.recommended.rules,
        },
        {
            files: [...filePatterns.testFiles, ...filePatterns.storyFiles],
            rules: {
                'react/prop-types': 0,
            },
        },
    )
}

// TestingLib
if (moduleExists('react')) {
    config.push(
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

// A11y
config.push(
    {
        files: [...filePatterns.jtsxFiles],
        plugins: {
            'jsx-a11y': JsxA11y,
        },
        rules: JsxA11y.configs.recommended.rules,
    },
)

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
            '**/__snapshots__/',
            '**/*.d.ts',
        ],
    },
)

export default config

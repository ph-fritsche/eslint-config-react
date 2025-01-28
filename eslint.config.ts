import config from './config.ts'

export default [
    ...config,
    {
        ignores: [
            'examples/',
            'config.js',
        ],
    },
]

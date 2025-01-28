import config from './config'

export default [
    ...config,
    {
        ignores: [
            'examples/',
            'config.js',
        ],
    },
]

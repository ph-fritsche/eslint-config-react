import config from './config.js'

export default [
    ...config,
    {
        ignores: [
            'examples/',
            '__snapshots__/',
        ],
    },
]

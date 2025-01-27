import {spawn} from 'node:child_process'
import {readdir} from 'node:fs/promises'
import {Buffer} from 'node:buffer'
import {cwd} from 'node:process'

function lint(
    file: string,
) {
    const child = spawn('node', [
        'node_modules/.bin/eslint',
        '-c',
        'config.ts',
        file,
    ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: {
            CI: 'true',
        },
    })

    const result = new Promise((res, rej) => {
        const outPromise = content(child.stdout)
        const errPromise = content(child.stderr)
        child.on('error', (e) => rej(e))
        child.on('exit', (code) => {
            void Promise.allSettled([outPromise, errPromise]).then(([out, err]) => {
                res({
                    code,
                    out: out.status === 'fulfilled' ? normalizeOutput(out.value.toString()) : String(out.reason),
                    err: err.status === 'fulfilled' ? err.value.toString() : String(err.reason),
                })
            })
        })
    })

    const kill = () => new Promise<void>((res) => {
        if (child.exitCode === null) {
            child.on('close', () => res())
            child.kill()
        } else {
            res()
        }
    })

    child.stdin.end()

    return {child, result, kill}
}

function content(
    stream: NodeJS.ReadableStream,
) {
    return new Promise<Buffer>((res, rej) => {
        const chunks: Buffer[] = []
        stream.on('data', (c: Buffer) => chunks.push(c))
        stream.on('error', rej)
        stream.on('end', () => res(Buffer.concat(chunks)))
    })
}

function normalizeOutput(
    output: string,
) {
    return output.replace(cwd() + '/', '')
}

const cleanup: Array<() => Promise<void>> = []
afterEach(async () => {
    const c = cleanup
    cleanup.splice(0)
    for (const f of c) {
        await f()
    }
})

for (const f of await readdir('examples')) {
    if (f === '.' || f === '..') {
        continue
    }

    test(`lint ${f}`, async () => {
        const {result, kill} = lint(`examples/${f}`)
        cleanup.push(kill)

        await expect(result).resolves.toMatchSnapshot()
    }, 30_000)
}

import { ConfigArray } from '@eslint/config-array'
import { filePatterns } from './config'

describe('match files', () => {
    const matches: {[k: string]: {[k in keyof typeof filePatterns]?: boolean}} = {
        '/example/foo.js': {jsFiles: true},
        '/example/foo.jsx': {jsFiles: true, jtsxFiles: true},
        '/example/foo.mjs': {jsFiles: true},
        '/example/foo.cjs': {jsFiles: true},
        '/example/foo.ts': {tsFiles: true},
        '/example/foo.tsx': {tsFiles: true, jtsxFiles: true},
        '/example/foo.mts': {tsFiles: true},
        '/example/foo.cts': {tsFiles: true},
        '/example/foo.html': {},
        '/example/foo/bar.js': {jsFiles: true},
        '/example/foo/bar.jsx': {jsFiles: true, jtsxFiles: true},
        '/example/foo/bar.mjs': {jsFiles: true},
        '/example/foo/bar.cjs': {jsFiles: true},
        '/example/foo/bar.ts': {tsFiles: true},
        '/example/foo/bar.tsx': {tsFiles: true, jtsxFiles: true},
        '/example/foo/bar.mts': {tsFiles: true},
        '/example/foo/bar.cts': {tsFiles: true},
        '/example/foo/bar.html': {},
        '/example/test/bar.js': {jsFiles: true, testFiles: true},
        '/example/test/bar.jsx': {jsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/test/bar.mjs': {jsFiles: true, testFiles: true},
        '/example/test/bar.cjs': {jsFiles: true, testFiles: true},
        '/example/test/bar.ts': {tsFiles: true, testFiles: true},
        '/example/test/bar.tsx': {tsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/test/bar.mts': {tsFiles: true, testFiles: true},
        '/example/test/bar.cts': {tsFiles: true, testFiles: true},
        '/example/test/bar.html': {},
        '/example/tests/bar.js': {jsFiles: true, testFiles: true},
        '/example/tests/bar.jsx': {jsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/tests/bar.mjs': {jsFiles: true, testFiles: true},
        '/example/tests/bar.cjs': {jsFiles: true, testFiles: true},
        '/example/tests/bar.ts': {tsFiles: true, testFiles: true},
        '/example/tests/bar.tsx': {tsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/tests/bar.mts': {tsFiles: true, testFiles: true},
        '/example/tests/bar.cts': {tsFiles: true, testFiles: true},
        '/example/tests/bar.html': {},
        '/example/foo/__tests__/bar.js': {jsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.jsx': {jsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.mjs': {jsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.cjs': {jsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.ts': {tsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.tsx': {tsFiles: true, jtsxFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.mts': {tsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.cts': {tsFiles: true, testFiles: true},
        '/example/foo/__tests__/bar.html': {},
        '/example/foo/bar.stories.js': {jsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.jsx': {jsFiles: true, jtsxFiles: true, storyFiles: true},
        '/example/foo/bar.stories.mjs': {jsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.cjs': {jsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.ts': {tsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.tsx': {tsFiles: true, jtsxFiles: true, storyFiles: true},
        '/example/foo/bar.stories.mts': {tsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.cts': {tsFiles: true, storyFiles: true},
        '/example/foo/bar.stories.html': {},
    }

    for (const patternName of Object.keys(filePatterns)) {
        test(patternName, () => {
            const config = new ConfigArray([
                {files : filePatterns[patternName] as string[]},
            ], {
                normalized: true,
                basePath: '/example',
            })

            const actual = {}
            const expected = {}

            for (const fileName of Object.keys(matches)) {
                actual[fileName] = config.getConfig(fileName) !== undefined
                expected[fileName] = !!matches[fileName][patternName]
            }

            expect(actual).toEqual(expected)
        })
    }
})

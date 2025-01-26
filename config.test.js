import {spawn} from 'node:child_process'
import {readdir} from 'node:fs/promises'
import {Buffer} from 'node:buffer'
import {cwd} from 'node:process'

/** @type {Promise<{code: number, out: Buffer, err: Buffer}>} */
function lint(
    file,
) {
    const child = spawn('node', [
        'node_modules/.bin/eslint',
        '-c',
        'config.js',
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
        child.on('exit', async (code) => {
            Promise.allSettled([outPromise, errPromise]).then(([out, err]) => {
                res({
                    code,
                    out: out.status === 'fulfilled' ? normalizeOutput(out.value.toString()) : String(out.reason),
                    err: err.status === 'fulfilled' ? err.value.toString() : String(err.reason),
                })
            })
        })
    })

    const kill = () => new Promise((res) => {
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

/** @returns {Promise<Buffer>} */
function content(
    /** @type {NodeJS.ReadableStream} */
    stream,
) {
    return new Promise((res, rej) => {
        const chunks = []
        stream.on('data', c => chunks.push(c))
        stream.on('error', rej)
        stream.on('end', () => res(Buffer.concat(chunks)))
    })
}

function normalizeOutput(
    /** @type {string} */
    output,
) {
    return output.replace(cwd() + '/', '')
}

const cleanup = []
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


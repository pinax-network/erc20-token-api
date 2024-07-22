import { defineConfig } from '@kubb/core'

export default defineConfig(() => {
    return {
        root: '.',
        input: {
            path: './petStore.yaml',
        },
        output: {
            path: './src/gen',
        },
        plugins: [],
    }
})
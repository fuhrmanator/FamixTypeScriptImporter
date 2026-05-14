import { context } from "esbuild";

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await context({
        entryPoints: ['src/server.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/server.js',
        logLevel: 'silent',
    });
    if (watch) { await ctx.watch(); }
    else { await ctx.rebuild(); await ctx.dispose(); }
}

main().catch(e => { console.error(e); process.exit(1); });

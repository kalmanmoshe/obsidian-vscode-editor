import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const prod = process.argv[2] === 'production';

const obsidianStylesPlugin = {
	name: 'obsidian-styles',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length) return;

			// Obsidian loads styles.css from the plugin directory.
			await copyFile(path.join(projectDir, 'main.css'), path.join(projectDir, 'styles.css'));
		});
	},
};

const options = {
	absWorkingDir: projectDir,
	entryPoints: ['src/main.ts'],
	bundle: true,
	minify: prod,
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	format: 'cjs',
	target: 'es2018',
	logLevel: 'info',
	outfile: 'main.js',
	external: [
		'obsidian',
		'electron',
		'@codemirror/*',
		'@lezer/*',
		...builtins,
	],
	loader: {
		// Obsidian injects the CSS into its document. Embed the font so it
		// doesn't need a URL relative to the plugin directory.
		'.ttf': 'dataurl',
	},
	plugins: [obsidianStylesPlugin],
};

if (prod) {
	await esbuild.build(options);
} else {
	const context = await esbuild.context(options);
	await context.watch();
}

import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import fs from 'fs';
import postCssModule from 'esbuild-plugin-postcss2';
const postCssPlugin = postCssModule.default || postCssModule;

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prod = process.argv[2] === 'production';

const renamePlugin = {
	name: 'combine-styles',
	setup(build) {
		build.onEnd(() => {
			const mystyleData = fs.readFileSync('mystyles.css', 'utf8');
			const mainData = fs.readFileSync('main.css', 'utf8');
			const combined = mystyleData + '\n' + mainData;
			fs.writeFileSync('styles.css', combined, 'utf8');
			console.log('✅ styles.css created');
		});
	},
};

const suppressCssWarningsPlugin = {
  name: 'suppress-css-warnings',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const contents = await fs.promises.readFile(args.path, 'utf8');
      return {
        contents,
        loader: 'css',
        warnings: [], // 💥 Silences those pesky Monaco style warnings
      };
    });
  }
};

const fontResolverPlugin = {
  name: 'resolve-monaco-fonts',
  setup(build) {
    build.onResolve({ filter: /\.ttf$/ }, args => {
      // Point to Monaco's codicon font manually
      const fontPath = path.resolve(__dirname, 'node_modules', 'monaco-editor', 'esm', 'vs', 'base', 'browser', 'ui', 'codicons', 'codicon.ttf');
      return { path: fontPath };
    });
  }
};
const nullifyFontPlugin = {
  name: 'nullify-ttf',
  setup(build) {
    build.onResolve({ filter: /\.ttf$/ }, args => {
      return {
        path: args.path,
        namespace: 'nullify-ttf'
      };
    });

    build.onLoad({ filter: /\.ttf$/, namespace: 'nullify-ttf' }, () => {
      return {
        contents: '',
        loader: 'file',
      };
    });
  }
};
const sanitizeMonacoCssPlugin = {
  name: 'sanitize-monaco-css',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, args => {
      if (!args.path.includes('monaco-editor')) return;

      const resolved = require.resolve(args.path, {
        paths: [args.resolveDir],
      });

      return {
        path: resolved,
        namespace: 'sanitize-monaco-css'
      };
    });

    build.onLoad({ filter: /\.css$/, namespace: 'sanitize-monaco-css' }, async (args) => {
      console.log('✔ Sanitizing:', args.path);

      let contents = await fs.promises.readFile(args.path, 'utf8');

      contents = contents
        .replace(/> div/g, 'div')
        .replace(/@font-face\s*{[^}]+}/gm, '')
        .replace(/:not\([^)]+\)/g, '')
        .replace(/\s*\.[^{}\n]+{/g, match => match.trim());

      return {
        contents,
        loader: 'css',
      };
    });
  }
};



const context = await esbuild.context({
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
		'.css': 'css',
		'.ttf': 'base64',
	},
	plugins: [
  sanitizeMonacoCssPlugin, // 👈 must be first to intercept
  postCssPlugin(),
  renamePlugin,
  nullifyFontPlugin,
],

});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
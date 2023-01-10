import {transform} from '@swc/core';
import {getTsconfig, createPathsMatcher} from 'get-tsconfig';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const tsconfig = getTsconfig();
const isTs = tsconfig !== null;
const allowJs = isTs ? tsconfig.config.compilerOptions.allowJs !== false : true;
const allowJson = isTs ? tsconfig.config.compilerOptions?.resolveJsonModule !== false : true;
const tsPathsMatcher = isTs ? createPathsMatcher(tsconfig) : null;

const TS_EXTENSIONS = ['.ts', '.tsx'];
const JS_EXTENSIONS = ['.js', '.jsx'];
const JSON_EXTENSIONS = ['.json'];

const isFile = (p) => fs.existsSync(p);
const touchExtensions = (specifier, exts = []) =>
	exts.find((ext) => isFile(`${specifier}${ext}`));

async function withExtensions(specifier, context, next) {
	let ext =
		(isTs && touchExtensions(specifier, TS_EXTENSIONS)) ||
		(allowJs && touchExtensions(specifier, JS_EXTENSIONS)) ||
		(allowJson && touchExtensions(specifier, JSON_EXTENSIONS));

	if (ext) return await resolve(`${specifier}${ext}`, context, next);
}

export async function resolve(specifier, context, next) {
	if (specifier.startsWith('node:')) {
		specifier = specifier.slice(5);
	}

	const isResolvePath = /^\.{0,2}\//.test(specifier);
	const isPath = specifier.startsWith('file://') || isResolvePath;

	if (tsPathsMatcher && !isPath && !context.parentURL?.includes('/node_modules/')) {
		const possiblePaths = tsPathsMatcher(specifier);
		for (const possiblePath of possiblePaths) {
			try {
				return await resolve(possiblePath, context, next);
			} catch {}
		}
	}

	let resolved;

	try {
		resolved = await next(specifier, context, next);
	} catch (error) {
		if (error.code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
			resolved = await withExtensions(`${specifier}/index`, context, next);
		}

		if (error.code === 'ERR_MODULE_NOT_FOUND') {
			if (isResolvePath) {
				specifier = path.resolve(
					path.dirname(fileURLToPath(context.parentURL)),
					specifier
				);
			}
			resolved = await withExtensions(specifier, context, next);
		}

		if (!resolved) {
			throw error;
		}
	}

	const {format = 'module'} = resolved;
	return {
		...resolved,
		format,
	};
}

export async function load(url, context, next) {
	const {format} = context;
	if (format === 'json') {
		context.importAssertions = {...context.importAssertions, type: 'json'};
	}

	const loaded = await next(url, context, next);
	if (!loaded.source) {
		return loaded;
	}

	if (/\.(ts|js)$/.test(url)) {
		const output = await transform(loaded.source.toString(), {
			// TODO tsconfig to swc config
			jsc: {
				parser: isTs ? {
					syntax: 'typescript',
					tsx: true,
					decorators: false,
					dynamicImport: true,
				}: {
					syntax: 'ecmascript',
					jsx: true,
					decorators: false,
				},
			},
		});

		return {
			format: 'module',
			source: output.code,
			shortCircuit: true,
		};
	}

	return loaded;
}

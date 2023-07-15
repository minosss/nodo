import path from 'node:path';

const tsExtensions = {
	'.js': '.ts',
	'.cjs': '.cts',
	'.mjs': '.mts',
};

export function resolveTsPath(filePath) {
	const extension = path.extname(filePath);
	const tsExtension = tsExtensions[extension];

	if (tsExtension) {
		return filePath.slice(0, -extension.length) + tsExtension;
	}
}

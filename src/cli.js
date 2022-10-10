import path from 'node:path';
import spawn from 'cross-spawn';
import {fileURLToPath} from 'node:url';

export function run(argv) {
	const env = {...process.env};

	return spawn(
		process.execPath,
		[
			'--require',
			fileURLToPath(`${path.dirname(import.meta.url)}/suppress-warnings.cjs`),

			'--loader',
			`${path.dirname(import.meta.url)}/loader.js`,

			...argv,
		],
		{
			stdio: ['inherit', 'inherit', 'inherit'],
			env,
		}
	);
}

run(process.argv.slice(2));

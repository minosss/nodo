// import node prefix
import fs from 'node:fs';
import path from 'node:path';
import {bar} from './bar';
import {ab} from '~/libs/ab';
import {host} from '~/libs/host';
import conf from './conf.json';

// export interface
export interface Foo {
	bar: string;
}

const currentDir = path.dirname(new URL(import.meta.url).pathname);

// uses build-in functions
fs.readFile(`${currentDir}/conf.json`, 'utf8', (err, data) => {
	console.log(data);
});

console.log(`hello ${bar} with ${ab} and ${host} at ${conf.host}`);

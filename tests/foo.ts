import {bar} from './bar';
import {ab} from '~/libs/ab';
import {host} from '~/libs/host';
import conf from './conf.json';

console.log(`hello ${bar} with ${ab} and ${host} at ${conf.host}`);

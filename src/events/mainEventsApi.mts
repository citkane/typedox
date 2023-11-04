import { DoxProject, config } from '@typedox/core';

type done = () => void;
export type mainEventsApi = typeof mainEventsApi;
export const mainEventsApi = {
	'main.made.options': (options: config.doxOptions, done: done) => {},
	'main.froze.options': (options: config.doxOptions) => {},
	'main.built.project': (project: DoxProject, done: done) => {},
	'main.done': (value: any) => {},
};
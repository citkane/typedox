import { DoxProject, config } from '@typedox/core';

type done = () => void;
export type mainEventsApi = typeof mainEventsApi;
export const mainEventsApi = {
	'main.made.options': (options: config.options<any>, done: done) => {},
	'main.froze.options': (options: config.options<any>) => {},
	'main.built.project': (project: DoxProject, done: done) => {},
	'main.done': (value: any) => {},
};

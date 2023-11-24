import { DoxProject, config } from '@typedox/core';

export type mainEventsApi = typeof mainEventsApi;
export const mainEventsApi = {
	'main.made.options': (options: config.options<any>) => {},
	'main.froze.options': (options: config.options<any>) => {},
	'main.built.project': (project: DoxProject) => {},
	'main.done': (value: any) => {},
};

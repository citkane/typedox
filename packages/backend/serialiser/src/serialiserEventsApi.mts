import { Serialised, menuBranch } from './index.mjs';

export type serialiserEventsApi = typeof serialiserEventsApi;
export const serialiserEventsApi = {
	'serialiser.packageMenu.serialised': (menu: menuBranch[]) => {},
	'serialiser.declaration.serialised': (
		declaration: Serialised['serialised'],
	) => {},
};

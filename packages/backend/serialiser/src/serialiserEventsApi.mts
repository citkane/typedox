import { menuBranch } from './index.mjs';

export type serialiserEventsApi = typeof serialiserEventsApi;
export const serialiserEventsApi = {
	'serialiser.mainMenu.serialised': (menu: menuBranch) => {},
};
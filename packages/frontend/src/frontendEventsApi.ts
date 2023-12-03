import { DoxLocation } from '@typedox/core';
import { router } from './index.js';
import { declarationContext } from './State.js';

export type eventsApi = typeof eventsApi;
export const eventsApi = {
	'nav.history.pushState': (location: DoxLocation) => {},
	'nav.context.switch': (context: router.context) => {},
	'context.declarations.change': (context: keyof declarationContext) => {},
	'dev.colourpalette.toggle': () => {},
	'dev.devinfo.log': () => {},
};

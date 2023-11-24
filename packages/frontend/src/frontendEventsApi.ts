import { DoxLocation } from '@typedox/core';
import { router } from './index.js';

export type eventsApi = typeof eventsApi;
export const eventsApi = {
	'nav.history.pushState': navHistoryPushstate,
	'nav.context.switch': navSwitchContext,
	'dev.colourpalette.toggle': () => {},
	'dev.devinfo.log': () => {},
};

function navHistoryPushstate(location: DoxLocation) {}
function navSwitchContext(context: router.context) {}

import { DoxLocation } from '@typedox/serialiser';

export type eventsApi = typeof eventsApi;
export const eventsApi = {
	'nav.history.pushState': navHistoryPushstate,
};

function navHistoryPushstate(location: DoxLocation) {}

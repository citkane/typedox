import { DoxLocation } from '@typedox/serialiser';
import { DoxEvents } from './index.js';

const events = new DoxEvents();

export function route(location: DoxLocation) {
	const url = toUrl(location);
	history.pushState(location, '', url);
	events.emit('nav.history.pushState', location);
}

export function toUrl(location: DoxLocation) {
	const { origin, pathname } = window.location;
	const url = origin + pathname;
	const uri = location.hash
		? `${encodeURIComponent(location.query)}#${encodeURIComponent(
				location.hash,
		  )}`
		: encodeURIComponent(location.query);

	return `${url}?dox=${uri}`;
}

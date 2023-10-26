import { EventEmitter } from 'events';
import { eventsApi } from './eventApi.mjs';

type eventsParams = {
	[k in keyof typeof eventsApi]: Parameters<(typeof eventsApi)[k]>;
};
class DoxEmitter extends EventEmitter {}
const doxEmitter = new DoxEmitter();
doxEmitter.setMaxListeners(0);

type eventKeys = keyof typeof eventsApi | keyof eventsParams;

export class DoxEvents {
	once = <e extends eventKeys, cb extends (typeof eventsApi)[e]>(
		event: e,
		callback: cb,
	) => {
		doxEmitter.once(event, callback);
	};
	on = <e extends eventKeys, cb extends (typeof eventsApi)[e]>(
		event: e,
		callback: cb,
	) => {
		doxEmitter.addListener(event, callback);
	};
	off = <e extends eventKeys, cb extends (typeof eventsApi)[e]>(
		event: e,
		callback: cb,
	) => {
		doxEmitter.removeListener(event, callback);
	};
	emit = <e extends eventKeys, a extends eventsParams[e]>(
		event: e,
		...args: a
	) => {
		doxEmitter.emit(event, ...args);
	};
}

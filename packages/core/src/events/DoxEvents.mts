import { EventEmitter } from 'events';
//import { eventsApi } from './eventApi.mjs';

type eventsApi = Record<string, (...args: any) => void>;

//type eventsApi = typeof eventsApi;
type eventsParams<T extends eventsApi> = {
	[k in keyof T]: Parameters<T[k]>;
};
type eventKeys<T extends eventsApi> = keyof eventsParams<T>;

class DoxEmitter extends EventEmitter {}
const doxEmitter = new DoxEmitter();
doxEmitter.setMaxListeners(0);

export class DoxEvents<T extends eventsApi> {
	public api: T;
	constructor(...args: eventsApi[]) {
		this.api = args.reduce((accummulator, api) => {
			accummulator = { ...accummulator, ...api };
			return accummulator;
		}, {} as eventsApi) as T;
	}
	once = <e extends eventKeys<T>, cb extends T[e]>(
		event: e,
		callback: cb,
	) => {
		doxEmitter.once(event as string, callback);
	};
	on = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		doxEmitter.addListener(event as string, callback);
	};
	off = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		doxEmitter.removeListener(event as string, callback);
	};
	emit = <e extends eventKeys<T>, a extends eventsParams<T>[e]>(
		event: e,
		...argsArray: a
	) => {
		const args = [...argsArray];
		doxEmitter.emit(event as string, ...args);
	};
}

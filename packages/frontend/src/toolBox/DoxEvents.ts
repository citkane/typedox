import { eventsApi as defaultApi } from '../frontendEventsApi.js';

type eventsApi = Record<string, (...args: any) => void>;
type eventsParams<T extends eventsApi> = {
	[k in keyof T]: Parameters<T[k]>;
};
type eventKeys<T extends eventsApi> = keyof eventsParams<T>;

export class DoxEvents<T extends eventsApi = defaultApi> {
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
		function func(event: Event) {
			document.body.removeEventListener(String(event), func);
			const args = isCustomEvent(event) ? event.detail : undefined;
			callback(...args);
		}
		document.body.addEventListener(String(event), func);
	};
	on = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		this.registry[event] ??= function func(event: Event) {
			const args = isCustomEvent(event) ? event.detail : undefined;
			args ? callback(...args) : callback();
		};
		document.body.addEventListener(String(event), this.registry[event]);
	};
	off = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		if (!this.registry[event]) return;

		document.body.removeEventListener(String(event), this.registry[event]);
	};
	emit = <e extends eventKeys<T>, a extends eventsParams<T>[e]>(
		event: e,
		...argsArray: a
	) => {
		const customEvent = argsArray
			? new CustomEvent(String(event), {
					detail: argsArray,
			  })
			: new Event(String(event));

		document.body.dispatchEvent(customEvent);
	};
	private registry = {} as Record<eventKeys<T>, (...args: any) => void>;
}

function isCustomEvent(event: Event): event is CustomEvent {
	return 'detail' in event;
}

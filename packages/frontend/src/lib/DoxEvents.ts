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
		const trigger = makeTrigger(callback);
		function onceTrigger(event: Event) {
			document.body.removeEventListener(String(event), trigger);
			trigger(event);
		}
		document.body.addEventListener(String(event), onceTrigger);
	};
	on = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		if (!registry[event as string]) {
			registry[event as string] = new Map<
				(args?: any) => void,
				ReturnType<typeof makeTrigger>
			>();
		}
		const register = registry[event as string];
		const trigger = makeTrigger(callback);
		register.set(callback, trigger);

		document.body.addEventListener(String(event), trigger);
	};
	off = <e extends eventKeys<T>, cb extends T[e]>(event: e, callback: cb) => {
		if (
			!registry[event as string] ||
			!registry[event as string].has(callback)
		) {
			return;
		}
		const trigger = registry[event as string].get(callback)!;

		document.body.removeEventListener(String(event), trigger);
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
}
const registry = {} as Record<
	string,
	Map<(args?: any) => void, ReturnType<typeof makeTrigger>>
>;
const makeTrigger = (callback: (args?: any) => void) => {
	return (event: Event) => {
		const args = isCustomEvent(event) ? event.detail : undefined;
		args ? callback(...args) : callback();
	};
	function isCustomEvent(event: Event): event is CustomEvent {
		return 'detail' in event;
	}
};

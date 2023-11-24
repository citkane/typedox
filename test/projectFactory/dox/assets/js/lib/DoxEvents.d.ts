import { eventsApi as defaultApi } from '../frontendEventsApi.js';
type eventsApi = Record<string, (...args: any) => void>;
type eventsParams<T extends eventsApi> = {
    [k in keyof T]: Parameters<T[k]>;
};
export declare class DoxEvents<T extends eventsApi = defaultApi> {
    api: T;
    constructor(...args: eventsApi[]);
    once: <e extends keyof T, cb extends T[e]>(event: e, callback: cb) => void;
    on: <e extends keyof T, cb extends T[e]>(event: e, callback: cb) => void;
    off: <e extends keyof T, cb extends T[e]>(event: e, callback: cb) => void;
    emit: <e extends keyof T, a extends eventsParams<T>[e]>(event: e, ...argsArray: a) => void;
}
export {};

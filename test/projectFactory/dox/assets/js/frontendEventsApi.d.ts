import { DoxLocation } from '@typedox/core';
import { router } from './index.js';
export type eventsApi = typeof eventsApi;
export declare const eventsApi: {
    'nav.history.pushState': typeof navHistoryPushstate;
    'nav.context.switch': typeof navSwitchContext;
    'dev.colourpalette.toggle': () => void;
    'dev.devinfo.log': () => void;
};
declare function navHistoryPushstate(location: DoxLocation): void;
declare function navSwitchContext(context: router.context): void;
export {};

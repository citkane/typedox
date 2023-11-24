import { DoxEvents } from './lib/DoxEvents.js';
declare const events: DoxEvents<{
    'nav.history.pushState': (location: import("@typedox/core").DoxLocation) => void;
    'nav.context.switch': (context: "code" | "settings" | "packages" | "documents") => void;
    'dev.colourpalette.toggle': () => void;
    'dev.devinfo.log': () => void;
}>;
export * from './lib/_index.js';
export * from './factories/_index.js';
export * from './components/_index.js';
export * as router from './lib/router.js';
export { state } from './lib/State.js';
export { events };
export declare function doxApp(): void;

import { format, initEnums } from './factories/_index.js';
import { eventsApi } from './frontendEventsApi.js';
import { DoxEvents } from './lib/DoxEvents.js';
import { State } from './lib/State.js';
const events = new DoxEvents(eventsApi);
export * from './lib/_index.js';
export * from './factories/_index.js';
export * from './components/_index.js';
export * as router from './lib/router.js';
export { state } from './lib/State.js';
export { events };
export function doxApp() {
    format
        .initShikiTs()
        .then(() => initEnums())
        .then(() => import('./components/DoxApp.js'))
        .then((DoxApp) => {
        const state = new State();
        const doxApp = new DoxApp.default();
        document.body.appendChild(doxApp);
        state.init();
        return doxApp;
    })
        .catch((err) => console.error(err));
}
window.doxApp = doxApp;
//# sourceMappingURL=index.js.map
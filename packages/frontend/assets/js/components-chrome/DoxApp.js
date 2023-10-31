export class DoxApp extends HTMLElement {
    connectedCallback() {
        console.log('hello doxApp');
    }
}
const doxApp = 'dox-app';
customElements.define(doxApp, DoxApp);
//# sourceMappingURL=DoxApp.js.map
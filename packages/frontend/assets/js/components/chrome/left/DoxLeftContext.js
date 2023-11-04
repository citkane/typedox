export class DoxLeftContext extends HTMLElement {
    connectedCallback() {
        console.log('hello doxNavLeftContext');
    }
}
const doxLeftContext = 'dox-left-context';
customElements.define(doxLeftContext, DoxLeftContext);
//# sourceMappingURL=DoxLeftContext.js.map
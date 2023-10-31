export class DoxBreadcrumb extends HTMLElement {
    connectedCallback() {
        console.log('hello doxBreadcrumb');
    }
}
const doxBreadcrumb = 'dox-breadcrumb';
customElements.define(doxBreadcrumb, DoxBreadcrumb);
//# sourceMappingURL=DoxBreadcrumb.js.map
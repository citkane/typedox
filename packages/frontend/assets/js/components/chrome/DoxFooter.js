import { makeElement } from '../../utils/domFactory.js';
export class DoxFooter extends HTMLElement {
    connectedCallback() {
        const inner = makeElement('div', 'inner');
        this.appendChild(inner);
    }
}
const doxFooter = 'dox-footer';
customElements.define(doxFooter, DoxFooter);
//# sourceMappingURL=DoxFooter.js.map
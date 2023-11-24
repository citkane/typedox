import { makeElement } from '../../lib/dom.js';
export class ChromeFooter extends HTMLElement {
    connectedCallback() {
        const inner = makeElement('div', 'inner');
        this.appendChild(inner);
    }
}
customElements.define('chrome-footer', ChromeFooter);
//# sourceMappingURL=ChromeFooter.js.map
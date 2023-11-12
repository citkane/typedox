import { makeElement } from '../../toolBox/dom.js';

export class ChromeFooter extends HTMLElement {
	connectedCallback() {
		const inner = makeElement('div', 'inner');
		this.appendChild(inner);
	}
}

customElements.define('chrome-footer', ChromeFooter);

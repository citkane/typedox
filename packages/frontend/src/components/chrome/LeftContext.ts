import { makeElement } from '../../toolBox/dom.js';

export class LeftContext extends HTMLElement {
	inner: HTMLDivElement;
	constructor() {
		super();
		this.inner = makeElement('div', 'inner');
	}
	connectedCallback() {
		this.appendChild(this.inner);
	}
}

customElements.define('left-context', LeftContext);

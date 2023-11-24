import { format } from '../../index.js';
import { makeElement } from '../../lib/dom.js';

export class ContentMarked extends HTMLElement {
	inner: HTMLDivElement;
	constructor(rawString: string) {
		super();

		const htmlString = format.markedToHtmlString(rawString);

		this.inner = makeElement('div', 'markdown-body');
		this.inner.innerHTML = htmlString;
	}
	connectedCallback() {
		this.appendChild(this.inner);
	}
}

customElements.define('content-marked', ContentMarked);

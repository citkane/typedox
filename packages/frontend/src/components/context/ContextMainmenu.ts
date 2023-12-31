import { IconContext, dom } from '../../index.js';
import { makeElement } from '../../lib/libDom.js';
import { contexts } from '../../lib/libRouter.js';
import { NavContext } from '../navigation/NavLinks.js';

export class ContextMainmenu extends HTMLElement {
	inner: HTMLDivElement;
	constructor() {
		super();
		this.inner = makeElement('div', 'inner');
		const brand = dom.makeElement('div', 'brand typedox');
		const tabs = [
			new NavContext('settings', new IconContext('md-24', 'settings')),
			new NavContext('packages', new IconContext('md-24', 'package')),
			new NavContext('documents', new IconContext('md-24', 'document')),
			new NavContext('code', new IconContext('md-24', 'code')),
			brand,
		];
		dom.appendChildren.call(this.inner, tabs);
	}
	connectedCallback() {
		this.appendChild(this.inner);
	}
}

customElements.define('context-mainmenu', ContextMainmenu);

import { dom } from '../../index.js';
import { LeftContext } from './LeftContext.js';
import { LeftMenu } from './LeftMenu.js';

export class ChromeLeft extends HTMLElement {
	public doxLeftContext: LeftContext;
	public doxLeftMenu: LeftMenu;

	constructor() {
		super();

		this.doxLeftContext = new LeftContext();
		this.doxLeftMenu = new LeftMenu();
	}
	connectedCallback() {
		dom.appendChildren.call(this, [this.doxLeftContext, this.doxLeftMenu]);
	}
}

customElements.define('chrome-left', ChromeLeft);

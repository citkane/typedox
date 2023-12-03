import { dom } from '../../index.js';
import { ContextMainmenu } from '../context/ContextMainmenu.js';
import { LeftMenu } from '../navigation/LeftMenu.js';

export class ChromeLeft extends HTMLElement {
	public doxLeftContext: ContextMainmenu;
	public doxLeftMenu: LeftMenu;

	constructor() {
		super();

		this.doxLeftContext = new ContextMainmenu();
		this.doxLeftMenu = new LeftMenu();
	}
	connectedCallback() {
		dom.appendChildren.call(this, [this.doxLeftContext, this.doxLeftMenu]);
	}
}

customElements.define('chrome-left', ChromeLeft);

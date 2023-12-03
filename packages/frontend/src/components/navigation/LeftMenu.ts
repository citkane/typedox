import { PackageMenu, SettingsMenu, dom, state, widgets } from '../../index.js';
import { ContextPackagemenu } from '../context/ContextPackagemenu.js';

export class LeftMenu extends HTMLElement {
	private disconnectResizeable: ReturnType<typeof widgets.makeResizeable>;
	inner: HTMLElement;

	constructor() {
		super();

		const contextPackagemenu = new ContextPackagemenu();
		const packageMenu = new PackageMenu();
		const settingsMenu = new SettingsMenu();

		this.inner = dom.makeElement('div', 'resizeable');
		this.disconnectResizeable = LeftMenu.makeResizeable(this.inner);

		dom.appendChildren.call(this.inner, [
			contextPackagemenu,
			packageMenu,
			settingsMenu,
		]);
	}

	connectedCallback() {
		this.appendChild(this.inner);
	}
	disconnectedCallback() {
		this.disconnectResizeable();
	}
	static makeResizeable(target: HTMLElement) {
		const id = 'leftMenu';
		return widgets.makeResizeable(
			target,
			'X',
			id,
			() => 120,
			() => (document.body.clientWidth / 4) * 3,
		);
	}
}

customElements.define('left-menu', LeftMenu);

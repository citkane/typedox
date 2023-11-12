import { menuBranch, menuMeta } from '@typedox/serialiser';
import {
	MenuPackages,
	WidgetDrawer,
	dom,
	files,
	widgets,
} from '../../index.js';

export class LeftMenu extends HTMLElement {
	public mainMenu!: WidgetDrawer<menuMeta>;

	private inner: HTMLDivElement;
	private disconnectResizeable: ReturnType<typeof widgets.makeResizeable>;

	constructor() {
		super();
		this.inner = dom.makeElement('div', 'inner');
		this.disconnectResizeable = makeResizeable(this.inner);
	}

	connectedCallback() {
		this.appendChild(this.inner);
		buildMenu().then((menuDrawer) => this.inner.appendChild(menuDrawer));
	}
	disconnectedCallback() {
		this.disconnectResizeable();
	}
}

customElements.define('left-menu', LeftMenu);

function buildMenu() {
	return files
		.fetchDataFromFile<menuBranch>('assets/_mainMenu.json')
		.then((menuData) => sortMenu(menuData))
		.then((menudata) => {
			const { name, children, meta } = menudata;
			return new MenuPackages(
				name,
				MenuPackages,
				meta as menuMeta,
				0,
				children,
			);
		})
		.catch((err) => {
			console.error(err);
			return dom.makeElement('div', 'error', 'error loading menu');
		});

	function sortMenu(menu: menuBranch) {
		menu.children?.sort((a, b) => {
			const aIndex = a.meta.category + a.name;
			const bIndex = b.meta.category + b.name;
			if (aIndex === bIndex) return 0;
			return aIndex > bIndex ? 1 : -1;
		});
		menu.children?.forEach((child) => sortMenu(child));

		return menu;
	}
}
function makeResizeable(target: HTMLElement) {
	return widgets.makeResizeable(
		target,
		'X',
		() => 120,
		() => (document.body.clientWidth / 4) * 3,
	);
}

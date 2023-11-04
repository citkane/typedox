import { menuBranch } from '@typedox/serialiser';
import { DoxWidgetDrawer } from '../../widgets/_index.js';

export class DoxLeftMenu extends HTMLElement {
	connectedCallback() {
		const { mainMenu } = document.dox;
		indexMenu(mainMenu);
		sortMenu(mainMenu);
		this.buildMenu(mainMenu);
	}
	buildMenu(menu: menuBranch) {
		const { name, children, category } = menu;
		const drawer = new DoxWidgetDrawer(name, category, children);
		this.appendChild(drawer);
	}
}

const doxLeftMenu = 'dox-left-menu';
customElements.define(doxLeftMenu, DoxLeftMenu);

function sortMenu(menu: menuBranch) {
	menu.children?.sort((a, b) => {
		const aIndex = a.category + a.name;
		const bIndex = b.category + b.name;
		if (aIndex === bIndex) return 0;
		return aIndex > bIndex ? 1 : -1;
	});
	menu.children?.forEach((child) => sortMenu(child));
}

function indexMenu(menu: menuBranch) {
	const { index, name, category } = menu;
	const prefix = menu.index ? `${menu.index}.` : '';
	menu.index = `${prefix}${menu.name}`;
	menu.children?.forEach((child) => {
		child.index = menu.index;
		indexMenu(child);
	});
}

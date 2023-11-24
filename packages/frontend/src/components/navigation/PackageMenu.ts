import { menuBranch, menuMeta } from '@typedox/serialiser';
import { Menu, WidgetDrawer, dom, files, state } from '../../index.js';
import { CategoryKind } from '../../factories/factoryEnums.js';
import { NavLink } from './NavLinks.js';

export class PackageMenu extends Menu {
	menu: Promise<PackageDrawer[]>;
	constructor() {
		super('packages');

		this.menu = files
			.fetchDataFromFile<menuBranch[]>('assets/_packageMenu.json')
			.then((menudata) => {
				return menudata.map((data) => {
					const { name, children, meta } = data;
					return new PackageDrawer(
						name,
						PackageDrawer,
						meta as menuMeta,
						0,
						children,
					);
				});
			});
	}
	connectedCallback() {
		super.connectedCallback(
			this.menu
				.then((menuDrawers) => {
					dom.appendChildren.call(this, menuDrawers);
					this.scrollTop = state.menuScrollTop;
				})
				.catch((err) =>
					console.error('Trouble getting the package menu:', err),
				),
		);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
	}
	/*
	static sortMenu(menu: menuBranch) {
		menu.children?.sort((a, b) => {
			const aIndex = a.meta.category + a.name;
			const bIndex = b.meta.category + b.name;
			if (aIndex === bIndex) return 0;
			return aIndex > bIndex ? 1 : -1;
		});
		menu.children?.forEach((child) => PackageMenu.sortMenu(child));

		return menu;
	}
	*/
}

class PackageDrawer extends WidgetDrawer<menuMeta> {
	constructor(
		name: string,
		Class: typeof WidgetDrawer<menuMeta>,
		meta: menuMeta,
		depth: number,
		children?: menuBranch[],
	) {
		super(name, Class, meta, depth, children);

		const paddingLeft = depth * 12;
		this.header.left.style.paddingLeft = `${paddingLeft}px`;
		const category = dom.makeElement(
			'div',
			`widget category ${CategoryKind[this.meta.category]}`,
		);
		this.header.right.appendChild(category);
		this.header.right.style.paddingRight = '5px';
	}
	connectedCallback() {
		super.connectedCallback();

		if (!this.meta.location) {
			this.header.title.addEventListener('click', this.toggleOpened);
			this.header.title.style.cursor = 'pointer';
		} else {
			this.header.title.replaceChildren(
				new NavLink(this.name, this.meta.location),
			);
		}
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		this.header.title.removeEventListener('click', this.toggleOpened);
	}
}

customElements.define('package-drawer', PackageDrawer);
customElements.define('package-menu', PackageMenu);

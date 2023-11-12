import { menuBranch, menuMeta } from '@typedox/serialiser';
import { WidgetDrawer, dom } from '../../index.js';
import { CategoryKind } from '../../toolBox/enumsFactory.js';
import { NavLink } from './NavLink.js';

export class MenuPackages extends WidgetDrawer<menuMeta> {
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
			`category ${CategoryKind[this.meta.category]}`,
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

customElements.define('menu-packages', MenuPackages);

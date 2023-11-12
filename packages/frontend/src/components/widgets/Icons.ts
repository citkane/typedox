import { widgets } from '../../index.js';

export class IconDrawer extends HTMLElement {
	static observedAttributes = ['state'];
	constructor() {
		super();
	}
	connectedCallback() {
		this.setAttribute('state', 'closed');
		this.style.color = 'var(--col-primary-60)';
		this.classList.add(widgets.fontOutlined, 'icon', 'md-18');
		this.innerHTML = widgets.fontIcons.down;
	}
	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (!oldValue) return;
		oldValue === 'open' && newValue === 'closed'
			? this.close()
			: this.open();
	}
	close = () => {
		this.classList.replace(widgets.fontFilled, widgets.fontOutlined);
		this.style.transform = 'rotate(0deg)';
		this.style.color = 'var(--col-primary-60)';
	};
	open = () => {
		this.classList.replace(widgets.fontOutlined, widgets.fontFilled);
		this.style.transform = 'rotate(180deg)';
		this.style.color = 'var(--col-primary-40)';
	};
}

customElements.define('icon-drawer', IconDrawer);

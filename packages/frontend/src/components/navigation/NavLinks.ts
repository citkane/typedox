import { DoxLocation } from '@typedox/core';
import { IconContext, dom, events, router, state } from '../../index.js';

export class NavLink extends HTMLElement {
	link: HTMLAnchorElement;
	location: DoxLocation;
	constructor(text: string, location: DoxLocation) {
		super();
		this.link = dom.makeElement('a', '', text);
		this.location = location;
	}
	connectedCallback() {
		this.style.cursor = 'pointer';
		this.appendChild(this.link);
		this.addEventListener('click', this.route);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this.route);
	}
	route = (event: MouseEvent) => {
		router.route(this.location);
	};
}

export class NavContext extends HTMLElement {
	private icon: IconContext;
	private context: router.context;
	constructor(context: router.context, icon: IconContext) {
		super();
		this.icon = icon;
		this.context = context;
	}
	connectedCallback() {
		this.setAttribute('context', this.context);
		this.appendChild(this.icon);
		this.addEventListener('click', this.setState);
		events.on('nav.context.switch', this.toggleState);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this.setState);
		events.off('nav.context.switch', this.toggleState);
	}
	setState = (event?: MouseEvent) => {
		event?.stopPropagation();
		this.setAttribute('state', 'active');
		state.menuContext = this.context;
	};
	toggleState = (context: router.context) => {
		if (context === this.context) return this.setState();
		this.removeAttribute('state');
	};
}

customElements.define('nav-link', NavLink);
customElements.define('nav-context', NavContext);

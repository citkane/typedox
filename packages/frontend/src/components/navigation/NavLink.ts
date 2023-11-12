import { DoxLocation } from '@typedox/serialiser';
import { dom, router } from '../../index.js';

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

customElements.define('nav-link', NavLink);

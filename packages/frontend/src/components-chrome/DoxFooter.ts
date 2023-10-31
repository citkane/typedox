export class DoxFooter extends HTMLElement {
	connectedCallback() {
		console.log('hello doxFooter');
	}
}

const doxFooter = 'dox-footer';
customElements.define(doxFooter, DoxFooter);

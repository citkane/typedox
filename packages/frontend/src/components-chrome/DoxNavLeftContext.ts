export class DoxNavLeftContext extends HTMLElement {
	connectedCallback() {
		console.log('hello doxNavLeftContext');
	}
}

const doxNavLeftContext = 'dox-nav-left-context';
customElements.define(doxNavLeftContext, DoxNavLeftContext);

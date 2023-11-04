export class DoxMain extends HTMLElement {
	connectedCallback() {
		console.log('hello doxMain');
	}
}

const doxMain = 'dox-main';
customElements.define(doxMain, DoxMain);

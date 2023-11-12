export class MainBreadcrumb extends HTMLElement {
	connectedCallback() {
		console.log('hello mainBreadcrumb');
	}
}

customElements.define('main-breadcrumb', MainBreadcrumb);

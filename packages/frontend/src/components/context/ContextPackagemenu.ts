import { declarationContext } from '../../State.js';
import { dom, events, state } from '../../index.js';

export class ContextPackagemenu extends HTMLElement {
	private filters: HTMLElement[];
	private register: Record<keyof declarationContext, HTMLElement>;
	constructor() {
		super();

		const external = dom.makeElement('div', 'filter', 'external');
		const local = dom.makeElement('div', 'filter', 'local');
		const reexported = dom.makeElement('div', 'filter', 're-exported');
		const imported = dom.makeElement('div', 'filter', 'imported');

		external.onclick = () => (state.declarationContext = 'external');
		local.onclick = () => (state.declarationContext = 'local');
		reexported.onclick = () => (state.declarationContext = 'reexported');
		imported.onclick = () => (state.declarationContext = 'imported');

		this.filters = [external, local, reexported, imported];
		this.filters.forEach((filter) => filter.setAttribute('state', 'off'));

		this.register = { external, local, reexported, imported };

		events.on('context.declarations.change', this.setState);
	}
	connectedCallback() {
		dom.appendChildren.call(this, this.filters);
	}
	disconnectedCallback() {
		events.off('context.declarations.change', this.setState);
	}

	setState = (context: keyof declarationContext) => {
		this.register[context].setAttribute(
			'state',
			state.declarationContexts[context] ? 'on' : 'off',
		);
	};
}

customElements.define('context-packagemenu', ContextPackagemenu);

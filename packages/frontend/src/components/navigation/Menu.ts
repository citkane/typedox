import { events, router, state } from '../../index.js';

export class Menu extends HTMLElement {
	protected context: router.context;
	constructor(context: router.context) {
		super();
		this.context = context;

		events.on('nav.context.switch', this.toggleState);
		this.addEventListener('scrollend', () => this.setScrollState());
	}

	connectedCallback(promise: Promise<void>) {
		this.classList.add('menu');
		promise.then(() => {
			this.scrollTop = state.menuScrollTop;
		});
	}

	disconnectedCallback() {
		events.off('nav.context.switch', this.toggleState);
		this.removeEventListener('scrollend', () => this.setScrollState());
	}

	private toggleState = (context: router.context) => {
		context === this.context
			? this.setAttribute('state', 'active')
			: this.removeAttribute('state');
	};
	private setScrollState = () => {
		state.menuScrollTop = this.scrollTop;
	};
}

export const symbolFont = 'material-symbols-outlined';

export type icon = keyof typeof symbols;
const symbols = {
	down: 'expand_circle_down',
	package: 'package_2',
	document: 'description',
	settings: 'settings',
	fullscreen: 'fullscreen',
	exitFullscreen: 'fullscreen_exit',
	code: 'folder_data',
};
type symbolSize = 'md-18' | 'md-24' | 'md-36' | 'md-48';

class Icon extends HTMLElement {
	protected symbolSize: symbolSize;
	constructor(symbolSize: symbolSize) {
		super();
		this.symbolSize = symbolSize;
	}
	setSymbol(symbol: keyof typeof symbols) {
		const { classList, symbolSize } = this;
		if (!classList.contains(symbolFont)) classList.add(symbolFont);
		if (!classList.contains('icon')) classList.add('icon');
		if (!classList.contains(symbolSize)) classList.add(symbolSize);
		this.innerHTML = symbols[symbol];
	}
}
export class IconDrawer extends Icon {
	static observedAttributes = ['state'];
	constructor(symbolSize: symbolSize) {
		super(symbolSize);
	}
	connectedCallback() {
		if (!this.getAttribute('state')) this.close();
		this.setSymbol('down');
	}
	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (!oldValue || oldValue === newValue) return;
		oldValue === 'open' && newValue === 'closed'
			? this.close()
			: this.open();
	}
	close = () => {
		this.setAttribute('state', 'closed');
	};
	open = () => {
		this.setAttribute('state', 'open');
	};
}
export class IconContext extends Icon {
	symbol: icon;
	constructor(symbolSize: symbolSize, symbol: icon) {
		super(symbolSize);
		this.symbol = symbol;
	}
	connectedCallback() {
		this.setSymbol(this.symbol);
	}
}
export class IconFullscreen extends Icon {
	static observedAttributes = ['state'];

	constructor(symbolSize: symbolSize) {
		super(symbolSize);
		if (!this.getAttribute('state')) this.closed();
	}
	connectedCallback() {
		this.setSymbol('fullscreen');
	}
	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (!oldValue || oldValue === newValue) return;
		console.log({ name, oldValue, newValue });
		if (name === 'state') {
			if (newValue === 'opened') this.opened();
			if (newValue === 'closed') this.closed();
		}
	}
	opened() {
		this.setAttribute('state', 'opened');
		this.setSymbol('exitFullscreen');
	}
	closed() {
		this.setAttribute('state', 'closed');
		this.setSymbol('fullscreen');
	}
}
customElements.define('icon-drawer', IconDrawer);
customElements.define('icon-context', IconContext);
customElements.define('icon-fullscreen', IconFullscreen);

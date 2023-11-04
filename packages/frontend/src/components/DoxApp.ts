import { appendChildren, makeElement } from '../utils/domFactory.js';
import { DoxFooter, DoxMain, DoxLeft } from './_index.js';

export class DoxApp extends HTMLElement {
	wrapper: HTMLDivElement;
	doxFooter: DoxFooter;
	doxNavLeft: DoxLeft;
	doxMain: DoxMain;
	constructor() {
		super();

		this.wrapper = makeElement<HTMLDivElement>('div');
		this.doxFooter = new DoxFooter(); //makeElement<DoxFooter>('dox-footer');
		this.doxNavLeft = new DoxLeft(); //makeElement<DoxNavLeft>('dox-nav-left');
		this.doxMain = new DoxMain(); //makeElement<DoxMain>('dox-main');
	}
	connectedCallback() {
		appendChildren.call(this, [this.wrapper, this.doxFooter]);
		appendChildren.call(this.wrapper, [this.doxNavLeft, this.doxMain]);
	}
}

const doxApp = 'dox-app';
customElements.define(doxApp, DoxApp);

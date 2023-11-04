import { appendChildren, makeElement } from '../../../utils/_index.js';
import { DoxLeftContext } from './DoxLeftContext.js';
import { DoxLeftMenu } from './DoxLeftMenu.js';

export class DoxLeft extends HTMLElement {
	public doxLeftContext: DoxLeftContext;
	public doxLeftMenu: DoxLeftMenu;

	private minMenuX = 0;
	constructor() {
		super();

		this.doxLeftContext = new DoxLeftContext();
		this.doxLeftMenu = new DoxLeftMenu();
	}
	connectedCallback() {
		appendChildren.call(this, [this.doxLeftContext, this.doxLeftMenu]);
		this.makeDragTrigger();

		this.minMenuX = this.clientWidth;
		this.style.flexBasis = this.minMenuX + 'px';
	}
	private makeDragTrigger() {
		const trigger = makeElement('div', 'trigger');
		const trackFnc = track.bind(this);
		let maxX = 0;

		trigger.addEventListener('mousedown', () => {
			maxX = (document.body.clientWidth / 4) * 3;
			window.addEventListener('mousemove', trackFnc);
		});

		window.addEventListener('mouseup', (event: MouseEvent) => unTrack());

		this.appendChild(trigger);

		function unTrack() {
			window.removeEventListener('mousemove', trackFnc);
		}
		function track(this: DoxLeft, event: MouseEvent) {
			let newWidth = this.clientWidth + event.movementX;
			if (newWidth < this.minMenuX) {
				newWidth = this.minMenuX;
				unTrack();
			}
			if (newWidth > maxX) {
				newWidth = maxX;
				unTrack();
			}
			this.style.flexBasis = newWidth + 'px';
		}
	}
}

const doxLeft = 'dox-left';
customElements.define(doxLeft, DoxLeft);

import { dox } from '../index.js';

export class DoxNavLeft extends HTMLElement {
	minMenuX: number;
	constructor() {
		super();
		this.minMenuX = this.clientWidth;
		this.style.flexBasis = this.minMenuX + 'px';
	}
	connectedCallback() {
		this.makeDragTrigger();
	}
	makeDragTrigger() {
		const trigger = dox.makeElement('div', 'trigger');
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
		function track(this: DoxNavLeft, event: MouseEvent) {
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

const doxNavLeft = 'dox-nav-left';
customElements.define(doxNavLeft, DoxNavLeft);

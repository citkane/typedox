import { dom, events } from '../../index.js';

export class DevColours extends HTMLElement {
	private palette: HTMLElement[] = [];
	private connected = false;

	constructor() {
		super();
		const styles = window.getComputedStyle(document.body);
		const sat = styles.getPropertyValue('--sat');

		const primary = styles.getPropertyValue('--primary');
		const secondary = styles.getPropertyValue('--secondary');
		const accent1 = styles.getPropertyValue('--accent1');
		const accent2 = styles.getPropertyValue('--accent2');
		const accent3 = styles.getPropertyValue('--accent3');

		const primarySat = styles.getPropertyValue('--primary-sat');
		const secondarySat = styles.getPropertyValue('--secondary-sat');
		const accent1Sat = styles.getPropertyValue('--accent1-sat');
		const accent2Sat = styles.getPropertyValue('--accent2-sat');
		const accent3Sat = styles.getPropertyValue('--accent3-sat');

		const hs = [
			[primary, primarySat],
			[secondary, secondarySat],
			[accent1, accent1Sat],
			[accent2, accent2Sat],
			[accent3, accent3Sat],
		];
		const l = [
			10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
		].reverse();
		hs.forEach((row) => {
			const h = row[0];
			const s = row[1];
			const rowDiv = dom.makeElement('div');
			const colourKey = `hsl(${h},100%,40%)`;
			const colourText = `hsl(${h},100%,90%)`;
			const keyDiv = dom.makeElement('div', 'key', h);
			keyDiv.style.backgroundColor = colourKey;
			keyDiv.style.color = colourText;
			rowDiv.appendChild(keyDiv);

			l.forEach((l) => {
				const background = `hsl(${h},${s}%,${l}%)`;
				const sample = dom.makeElement('div');
				sample.style.backgroundColor = background;
				rowDiv.appendChild(sample);
			});
			this.palette.push(rowDiv);
		});

		events.on('dev.colourpalette.toggle', this.toggle);
	}
	connectedCallback() {
		this.connected = true;
		dom.appendChildren.call(this, this.palette);
	}
	disconnectedCallback() {
		this.connected = false;
	}
	toggle = () => {
		const devContainer = document.getElementById('devInfo');
		!this.connected
			? devContainer?.appendChild(this)
			: devContainer?.removeChild(this);
	};
}

customElements.define('dev-colours', DevColours);

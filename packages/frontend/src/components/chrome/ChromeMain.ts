import { DoxLocation, Serialised } from '@typedox/serialiser';
import { DoxEvents, dom, files } from '../../index.js';
import { makeElement } from '../../toolBox/dom.js';

const events = new DoxEvents();

export class ChromeMain extends HTMLElement {
	constructor() {
		super();
		window.addEventListener('popstate', ({ state }) =>
			this.setContent(state),
		);
	}
	connectedCallback() {
		events.on('nav.history.pushState', this.setContent);
		this.colourPallette();
	}
	disconnectedCallback() {
		events.off('nav.history.pushState', this.setContent);
		window.removeEventListener('popstate', ({ state }) =>
			this.setContent(state),
		);
	}

	private setContent = (location: DoxLocation) => {
		const fileName = 'assets/data/' + location.query + '.json';
		files
			.fetchDataFromFile<Serialised['serialised']>(fileName)
			.then((data) => {
				const pre = makeElement(
					'pre',
					null,
					JSON.stringify(data, null, '\t'),
				);
				pre.style.display = 'block';
				pre.style.width = '900px';
				pre.style.overflowX = 'scroll';
				const oldChild = this.childNodes[1];
				oldChild
					? this.replaceChild(pre, oldChild)
					: this.appendChild(pre);
			});
	};
	private colourPallette = () => {
		const pallete = makeElement('div');
		this.appendChild(pallete);

		[
			[345, 6],
			[210, 50],
			[149, 50],
			[9, 50],
			[32, 50],
		].forEach((row) => {
			const h = row[0];
			const s = row[1];
			const rowDiv = dom.makeElement('div', `${row} row`);
			rowDiv.style.height = '60px';
			[
				10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
				90,
			].forEach((l) => {
				const sample = dom.makeElement('div');
				rowDiv.appendChild(sample);
				sample.style.width = '60px';
				sample.style.height = '60px';
				sample.style.backgroundColor = `hsl(${h},${s}%,${l}%)`;
			});
			pallete.appendChild(rowDiv);
		});
	};
}

customElements.define('chrome-main', ChromeMain);

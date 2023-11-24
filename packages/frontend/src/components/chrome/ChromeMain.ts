import { DeclarationSerialised, Serialised } from '@typedox/serialiser';
import {
	ContentDeclaration,
	DevColours,
	IconFullscreen,
	dom,
	events,
	files,
	router,
} from '../../index.js';
import { DoxLocation } from '@typedox/core';

export class ChromeMain extends HTMLElement {
	content?: HTMLElement;
	fullscreen: HTMLElement;
	constructor() {
		super();
		window.addEventListener('popstate', ({ state }) =>
			this.setContent(state),
		);
		this.fullscreen = dom.makeElement('div', 'fullscreen');
		this.fullscreen.appendChild(new IconFullscreen('md-24'));
		this.fullscreen.addEventListener('click', toggleFullscreen);

		new DevColours();
	}
	connectedCallback() {
		events.on('nav.history.pushState', this.setContent);

		const devInfo = dom.makeElement('div');
		devInfo.id = 'devInfo';
		const location = router.urlToLocation(window.location);
		location && this.setContent(location);

		dom.appendChildren.call(this, [devInfo, this.fullscreen]);
	}
	disconnectedCallback() {
		events.off('nav.history.pushState', this.setContent);
		this.fullscreen.removeEventListener('click', toggleFullscreen);
		window.removeEventListener('popstate', ({ state }) =>
			this.setContent(state),
		);
	}
	private setContent = (location: DoxLocation) => {
		files
			.fetchQueryFromFile(location.query)
			.then((rawData) => {
				const newContent = new ContentDeclaration(rawData);
				this.content
					? this.replaceChild(newContent, this.content)
					: this.appendChild(newContent);
				this.content = newContent;
			})
			.catch((err) => {
				console.error(err);
			});
	};
}

customElements.define('chrome-main', ChromeMain);

const elem = document.body;
document.exitFullscreen = document.exitFullscreen
	? document.exitFullscreen
	: (document as any).webkitExitFullscreen
	  ? (document as any).webkitExitFullscreen
	  : (document as any).msExitFullscreen
	    ? (document as any).msExitFullscreen
	    : undefined;
elem.requestFullscreen = elem.requestFullscreen
	? elem.requestFullscreen
	: (elem as any).webkitRequestFullscreen
	  ? (elem as any).webkitRequestFullscreen
	  : (elem as any).msRequestFullscreen
	    ? (elem as any).msRequestFullscreen
	    : undefined;
function toggleFullscreen(e: MouseEvent) {
	e.stopPropagation();
	if (!document.exitFullscreen || !elem.requestFullscreen) return;
	const icon = e.target as HTMLElement;
	const isFullscreen =
		(window as any).fullScreen ||
		(window.innerWidth == screen.width &&
			window.innerHeight == screen.height);

	isFullscreen
		? document
				.exitFullscreen()
				.then(() => icon.setAttribute('state', 'closed'))
		: elem
				.requestFullscreen()
				.then(() => icon.setAttribute('state', 'opened'));
}

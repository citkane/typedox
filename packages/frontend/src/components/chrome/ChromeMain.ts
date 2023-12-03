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
	public content = welcomeDiv();

	constructor() {
		super();

		new DevColours();
		window.addEventListener('popstate', ({ state }) =>
			this.navigate(state),
		);
	}
	connectedCallback() {
		events.on('nav.history.pushState', this.setContent);

		dom.appendChildren.call(this, [
			devInfoContainer(),
			fullscreenButton(),
			this.content,
		]);
		const doxLocation = router.urlToLocation(window.location);
		!!doxLocation && this.setContent(doxLocation);
	}

	private navigate(doxLocation: DoxLocation) {
		doxLocation ??= router.urlToLocation(window.location)!;
		this.setContent(doxLocation);
	}
	private setContent = (doxLocation: DoxLocation) =>
		files
			.fetchQueryFromFile(doxLocation.query)
			.then((rawData) => new ContentDeclaration(rawData))
			.then(this.replaceContent)
			.catch((err) => console.error(err));

	private replaceContent = (freshContent: ContentDeclaration) =>
		this.replaceChild(freshContent, this.content) &&
		(this.content = freshContent);
}

customElements.define('chrome-main', ChromeMain);

function fullscreenButton() {
	return ((div, icon) =>
		div.appendChild(icon) && (div.onclick = toggleFullscreen) && div)(
		dom.makeElement<HTMLDivElement>('div', 'fullscreen'),
		new IconFullscreen('md-24'),
	);
}
function devInfoContainer() {
	return ((devInfo) => (devInfo.id = 'devInfo') && devInfo)(
		dom.makeElement<HTMLDivElement>('div'),
	);
}
function welcomeDiv() {
	return dom.makeElement('div', null, 'Welcome to Typedox');
}

document.exitFullscreen = document.exitFullscreen
	? document.exitFullscreen
	: (document as any).webkitExitFullscreen
	  ? (document as any).webkitExitFullscreen
	  : (document as any).msExitFullscreen
	    ? (document as any).msExitFullscreen
	    : undefined;

const body = document.body;
body.requestFullscreen = body.requestFullscreen
	? body.requestFullscreen
	: (body as any).webkitRequestFullscreen
	  ? (body as any).webkitRequestFullscreen
	  : (body as any).msRequestFullscreen
	    ? (body as any).msRequestFullscreen
	    : undefined;

function toggleFullscreen(e: MouseEvent) {
	e.stopPropagation();
	if (!document.exitFullscreen || !body.requestFullscreen) return;
	const icon = e.target as HTMLElement;

	isFullscreen()
		? document
				.exitFullscreen()
				.then(() => icon.setAttribute('state', 'closed'))
		: body
				.requestFullscreen()
				.then(() => icon.setAttribute('state', 'opened'));
}
function isFullscreen() {
	return (
		!!(window as any).fullScreen ||
		(window.innerWidth == screen.width &&
			window.innerHeight == screen.height)
	);
}

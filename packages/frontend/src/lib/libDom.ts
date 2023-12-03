import { format } from '../index.js';

if (!HTMLElement.prototype.replaceChildren) {
	HTMLElement.prototype.replaceChildren = function (...args) {
		this.innerHTML = '';
		if (!args) return;
		(args as HTMLElement[]).forEach((element) => this.appendChild(element));
	};
}
export const makeElement = <T = HTMLElement>(
	tagName: string,
	className?: string | null,
	innerText?: string | null,
) => {
	const element = document.createElement(tagName);
	if (className)
		className.split(' ').forEach((c) => {
			if (c.length) element.classList.add(c);
		});
	if (innerText) element.innerText = innerText;

	return element as T;
};

export const toHTML = (htmlString: string) => {
	htmlString = format.sanitise(htmlString);
	const template = makeElement<HTMLTemplateElement>('template');
	template.innerHTML = htmlString;
	return template.content.cloneNode(true) as HTMLElement;
};

export function appendChildren(
	this: HTMLElement,
	children: (HTMLElement | undefined)[],
) {
	children.forEach((child) => {
		if (!child) return;
		this.appendChild(child);
	});
}

const domParser = new DOMParser();

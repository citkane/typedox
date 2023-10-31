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
	try {
		return parser.parseFromString(htmlString, 'text/html').body;
	} catch (error) {
		console.error(error);
		return makeElement('div', 'error', (<Error>error).message);
	}
};

const parser = new DOMParser();

export const makeElement = (tagName, className, innerText) => {
    const element = document.createElement(tagName);
    if (className)
        className.split(' ').forEach((c) => {
            if (c.length)
                element.classList.add(c);
        });
    if (innerText)
        element.innerText = innerText;
    return element;
};
export const toHTML = (htmlString) => {
    try {
        return parser.parseFromString(htmlString, 'text/html').body;
    }
    catch (error) {
        console.error(error);
        return makeElement('div', 'error', error.message);
    }
};
const parser = new DOMParser();
//# sourceMappingURL=domFactory.js.map
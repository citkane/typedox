import { format } from '../index.js';
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
    htmlString = format.sanitise(htmlString);
    const template = makeElement('template');
    template.innerHTML = htmlString;
    return template.content.cloneNode(true);
};
export function appendChildren(children) {
    children.forEach((child) => this.appendChild(child));
}
const domParser = new DOMParser();
//# sourceMappingURL=dom.js.map
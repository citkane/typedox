import { CategoryKind, CodeComments, CodeHeader, CodeSnippets, dom, events, } from '../../index.js';
export class ContentDeclaration extends HTMLElement {
    constructor(rawData) {
        super();
        this.logRawData = () => {
            console.info(JSON.stringify(this.rawData, null, 2));
        };
        const { name, category, flags, file, jsDocs, location } = rawData;
        this.rawData = rawData;
        this.header = ContentDeclaration.makeHeader(name, category, flags);
        this.codeHeader = new CodeHeader(file);
        this.codeSnippets = new CodeSnippets(file, location);
        this.comments = new CodeComments(jsDocs, file.positions);
        events.on('dev.devinfo.log', this.logRawData);
    }
    connectedCallback() {
        this.appendChild(this.header);
        this.appendChild(this.codeHeader);
        dom.appendChildren.call(this, [this.codeSnippets, this.comments]);
    }
    disconnectedCallback() {
        events.off('dev.devinfo.log', this.logRawData);
    }
    static makeHeader(name, category, flags) {
        const wrapperHtml = dom.makeElement('div', 'header');
        const nameHtml = dom.makeElement('h1', null, name);
        const scopeHtml = flags.scopeKeyword &&
            dom.makeElement('span', 'flag', flags.scopeKeyword);
        const typeHtml = flags.type && dom.makeElement('span', 'flag', String(flags.type));
        const categoryHtml = dom.makeElement('span', 'category', CategoryKind[category]);
        const children = [nameHtml, typeHtml, scopeHtml, categoryHtml].filter((html) => !!html);
        dom.appendChildren.call(wrapperHtml, children);
        return wrapperHtml;
    }
}
customElements.define('content-declaration', ContentDeclaration);
//# sourceMappingURL=ContentDeclaration.js.map
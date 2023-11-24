var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { dom, files, format, widgets } from '../../index.js';
import { ContentMarked } from '../content/ContentMarked.js';
export class CodeHeader extends HTMLElement {
    constructor(fileInfo) {
        super();
        this.nameWrapper = dom.makeElement('span', 'name');
        const fileName = CodeHeader.getFilenameHtml(fileInfo);
        const fileLines = CodeHeader.getFileLinesHtml(fileInfo);
        dom.appendChildren.call(this.nameWrapper, [fileName, fileLines]);
    }
    connectedCallback() {
        this.appendChild(this.nameWrapper);
    }
    static getFilenameHtml(fileInfo) {
        const { dirPath, fileName } = fileInfo;
        return dom.makeElement('span', undefined, `${dirPath}/${fileName}`);
    }
    static getFileLinesHtml(fileInfo) {
        const positions = files.compressFilePositions(fileInfo.positions);
        const lines = positions.map(format.formatLineNums).join('|');
        return dom.makeElement('span', undefined, `[${lines}]`);
    }
}
export class CodeSnippets extends HTMLElement {
    constructor(fileInfo, location) {
        super();
        this.fileInfo = fileInfo;
        this.uid = location.query;
    }
    connectedCallback() {
        const { makeSnippets, makeResizeable } = CodeSnippets;
        const { dirPath, fileName, positions } = this.fileInfo;
        const filePath = `assets/sources/${dirPath}/${fileName}`;
        const inner = dom.makeElement('div', 'inner');
        const codeHtml = dom.makeElement('div', 'declarationcode');
        const _positions = files.compressFilePositions(positions);
        files
            .fetchDataFromFile(filePath)
            .then((sourceText) => makeSnippets(sourceText, _positions))
            .then((highlightedText) => {
            inner.innerHTML = highlightedText.join('');
            codeHtml.appendChild(inner);
            this.appendChild(codeHtml);
            this.disconnectResizeable = makeResizeable(codeHtml, this.uid);
        })
            .catch((err) => console.error('Trouble getting code snippets:', err));
    }
    disconnectedCallback() {
        !!this.disconnectResizeable && this.disconnectResizeable();
    }
    static makeSnippets(sourceText, positions) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(positions.map((position) => format.highlightCodeAtPositions(position, sourceText)));
        });
    }
    static makeResizeable(target, uid) {
        const inner = target.getElementsByClassName('inner')[0];
        return widgets.makeResizeable(target, 'Y', uid, () => 50, () => inner.scrollHeight + 8);
    }
}
export class CodeComments extends HTMLElement {
    constructor(jsDocs, positions) {
        super();
        this.comments = jsDocs === null || jsDocs === void 0 ? void 0 : jsDocs.reduce((accumulator, jsDoc, i) => {
            if (jsDocs.length > 1) {
                const position = positions[i];
                const lineStart = position[2];
                const lineEnd = position[3];
                const descriptor = lineStart === lineEnd
                    ? `<h3>Line:<span class="number">${lineStart}</span></h3>`
                    : `<h3>Lines:<span class="number">[${lineStart}-${lineEnd}]</span></h3>`;
                accumulator.push(dom.toHTML(descriptor));
            }
            accumulator = [...accumulator, ...CodeComments.makeJsDoc(jsDoc)];
            return accumulator;
        }, []);
    }
    connectedCallback() {
        !!this.comments && dom.appendChildren.call(this, this.comments);
    }
    static makeJsDoc(data) {
        return (data.reduce((accumulator, tagOrComment) => {
            if ('comment' in tagOrComment) {
                accumulator.push(new ContentMarked(tagOrComment.comment));
            }
            return accumulator;
        }, []) || []);
    }
}
customElements.define('code-header', CodeHeader);
customElements.define('code-snippets', CodeSnippets);
customElements.define('code-comments', CodeComments);
//# sourceMappingURL=ClassesContent.js.map
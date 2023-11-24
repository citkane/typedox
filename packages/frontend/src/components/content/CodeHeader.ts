import { fileInfo } from '@typedox/serialiser';
import { dom, files, format } from '../../index.js';

export class CodeHeader extends HTMLElement {
	private nameWrapper: HTMLElement;

	constructor(fileInfo: fileInfo) {
		super();

		this.nameWrapper = dom.makeElement('span', 'name');
		const fileName = CodeHeader.getFilenameHtml(fileInfo);
		const fileLines = CodeHeader.getFileLinesHtml(fileInfo);

		dom.appendChildren.call(this.nameWrapper, [fileName, fileLines]);
	}
	connectedCallback() {
		this.appendChild(this.nameWrapper);
	}

	static getFilenameHtml(fileInfo: fileInfo) {
		const { dirPath, fileName } = fileInfo;
		return dom.makeElement('span', undefined, `${dirPath}/${fileName}`);
	}
	static getFileLinesHtml(fileInfo: fileInfo) {
		const positions = files.compressFilePositions(fileInfo.positions);
		const lines = positions.map(format.formatLineNums).join('|');
		return dom.makeElement('span', undefined, `[${lines}]`);
	}
}

customElements.define('code-header', CodeHeader);

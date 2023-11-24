import { fileInfo, filePositions } from '@typedox/serialiser';
import { dom, files, format, widgets } from '../../index.js';
import { DoxLocation } from '@typedox/core';

export class CodeSnippets extends HTMLElement {
	private fileInfo: fileInfo;
	private uid: string;
	private disconnectResizeable?: ReturnType<typeof widgets.makeResizeable>;

	constructor(fileInfo: fileInfo, location: DoxLocation) {
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
			.fetchDataFromFile<string>(filePath)
			.then((sourceText) => makeSnippets(sourceText, _positions))
			.then((highlightedText) => {
				inner.innerHTML = highlightedText.join('');
				codeHtml.appendChild(inner);
				this.appendChild(codeHtml);
				this.disconnectResizeable = makeResizeable(codeHtml, this.uid);
			})
			.catch((err) =>
				console.error('Trouble getting code snippets:', err),
			);
	}
	disconnectedCallback() {
		!!this.disconnectResizeable && this.disconnectResizeable();
	}

	static async makeSnippets(sourceText: string, positions: filePositions) {
		return Promise.all(
			positions.map((position) =>
				format.highlightCodeAtPositions(position, sourceText),
			),
		);
	}
	static makeResizeable(target: HTMLElement, uid: string) {
		const inner = target.getElementsByClassName(
			'inner',
		)[0] as HTMLDivElement;
		return widgets.makeResizeable(
			target,
			'Y',
			uid,
			() => 50,
			() => inner.scrollHeight + 8,
		);
	}
}
customElements.define('code-snippets', CodeSnippets);

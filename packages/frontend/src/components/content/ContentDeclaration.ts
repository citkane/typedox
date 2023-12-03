import { DeclarationSerialised } from '@typedox/serialiser';
import {
	CategoryKind,
	CodeComments,
	CodeSnippets,
	ContentLineage,
	FileHeader,
	dom,
	events,
} from '../../index.js';
import { DeclarationFlags } from '@typedox/core';

export class ContentDeclaration extends HTMLElement {
	private rawData: DeclarationSerialised;
	private lineage: HTMLElement | undefined;
	private textWrapper: HTMLElement;
	private codeWrapper: HTMLDivElement;

	constructor(rawData: DeclarationSerialised) {
		super();

		this.rawData = rawData;
		this.textWrapper = ContentDeclaration.makeTextWrapper(rawData);
		this.codeWrapper = ContentDeclaration.makeCodeWrapper(rawData);
		this.lineage = ContentDeclaration.makeLineage(rawData);

		events.on('dev.devinfo.log', this.logRawData);
	}
	connectedCallback() {
		dom.appendChildren.call(this, [
			this.textWrapper,
			this.codeWrapper,
			this.lineage,
		]);
	}
	disconnectedCallback() {
		events.off('dev.devinfo.log', this.logRawData);
	}
	private logRawData = () => {
		console.info(JSON.stringify(this.rawData, null, 2));
	};
	private static makeTextWrapper(rawData: DeclarationSerialised) {
		const { name, category, flags, file, jsDocs } = rawData;
		const title = dom.makeElement('h1', 'declaration', name);
		const comments = new CodeComments(jsDocs, file.positions);
		const codeHeader = ContentDeclaration.makeCodeHeader(category, flags);
		const rightCol = dom.makeElement('div', 'right');
		const leftCol = dom.makeElement('div', 'left');
		const wrapper = dom.makeElement('div', 'textWrapper');

		rightCol.appendChild(codeHeader);
		dom.appendChildren.call(leftCol, [title, comments]);
		dom.appendChildren.call(wrapper, [leftCol, rightCol]);

		return wrapper;
	}
	private static makeCodeWrapper(rawData: DeclarationSerialised) {
		const { name, category, flags, file, location } = rawData;
		const codeWrapper = dom.makeElement<HTMLDivElement>('div', 'code');

		const fileHeader = new FileHeader(file);
		const codeSnippets = new CodeSnippets(file, location);

		dom.appendChildren.call(codeWrapper, [fileHeader, codeSnippets]);

		return codeWrapper;
	}
	private static makeCodeHeader(
		category: CategoryKind,
		flags: DeclarationFlags,
	) {
		const wrapperHtml = dom.makeElement('div', 'header');
		const scopeHtml =
			flags.scopeKeyword &&
			dom.makeElement('span', 'flag', flags.scopeKeyword);
		const typeHtml =
			flags.type && dom.makeElement('span', 'flag', String(flags.type));

		const categoryHtml = dom.makeElement(
			'span',
			'category',
			CategoryKind[category],
		);
		const children = [typeHtml, scopeHtml, categoryHtml].filter(
			(html) => !!html,
		) as HTMLElement[];

		dom.appendChildren.call(wrapperHtml, children);

		return wrapperHtml;
	}
	private static makeLineage(rawData: DeclarationSerialised) {
		const { children, parents } = rawData;
		if (!children && !parents) return undefined;
		const lineageContainer = dom.makeElement('div', 'lineage');
		//console.log(parents, children);
		const lineage = new ContentLineage(
			rawData,
			true,
			!!parents,
			!!children,
		);
		lineageContainer.appendChild(lineage);
		return lineageContainer;
	}
}

customElements.define('content-declaration', ContentDeclaration);

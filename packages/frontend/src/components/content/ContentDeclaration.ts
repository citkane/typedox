import { DeclarationSerialised, Serialised } from '@typedox/serialiser';
import {
	CategoryKind,
	CodeComments,
	CodeHeader,
	CodeSnippets,
	ContentLineage,
	dom,
	events,
} from '../../index.js';
import { DeclarationFlags } from '@typedox/core';

export class ContentDeclaration extends HTMLElement {
	public rawData: DeclarationSerialised;
	public header: HTMLElement;
	public codeHeader: HTMLElement;
	public codeSnippets: HTMLElement;
	public declareRelations: ContentLineage | undefined;
	public comments: HTMLElement;

	constructor(rawData: DeclarationSerialised) {
		super();
		const {
			name,
			category,
			flags,
			file,
			jsDocs,
			location,
			children,
			parents,
		} = rawData;

		this.rawData = rawData;
		this.header = ContentDeclaration.makeHeader(name, category, flags);
		this.codeHeader = new CodeHeader(file);
		this.codeSnippets = new CodeSnippets(file, location);
		this.declareRelations =
			!children && !parents
				? undefined
				: new ContentLineage(rawData, true, true, true);
		this.comments = new CodeComments(jsDocs, file.positions);

		events.on('dev.devinfo.log', this.logRawData);
	}
	connectedCallback() {
		dom.appendChildren.call(this, [
			this.header,
			this.codeHeader,
			this.codeSnippets,
			this.declareRelations,
			this.comments,
		]);
	}
	disconnectedCallback() {
		events.off('dev.devinfo.log', this.logRawData);
	}
	private logRawData = () => {
		console.info(JSON.stringify(this.rawData, null, 2));
	};
	private static makeHeader(
		name: string,
		category: CategoryKind,
		flags: DeclarationFlags,
	) {
		const wrapperHtml = dom.makeElement('div', 'header');
		const nameHtml = dom.makeElement('h1', null, name);
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
		const children = [nameHtml, typeHtml, scopeHtml, categoryHtml].filter(
			(html) => !!html,
		) as HTMLElement[];

		dom.appendChildren.call(wrapperHtml, children);

		return wrapperHtml;
	}
}

customElements.define('content-declaration', ContentDeclaration);

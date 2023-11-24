import { filePositions, jsDocCollection } from '@typedox/serialiser';
import { dom } from '../../index.js';
import { ContentMarked } from './ContentMarked.js';

export class CodeComments extends HTMLElement {
	comments: HTMLElement[] | undefined;

	constructor(
		jsDocs: jsDocCollection[] | undefined,
		positions: filePositions,
	) {
		super();

		this.comments = jsDocs?.reduce((accumulator, jsDoc, i) => {
			if (jsDocs.length > 1) {
				const position = positions[i];
				const lineStart = position[2];
				const lineEnd = position[3];
				const descriptor =
					lineStart === lineEnd
						? `<h3>Line:<span class="number">${lineStart}</span></h3>`
						: `<h3>Lines:<span class="number">[${lineStart}-${lineEnd}]</span></h3>`;

				accumulator.push(dom.toHTML(descriptor));
			}
			accumulator = [...accumulator, ...CodeComments.makeJsDoc(jsDoc)];

			return accumulator;
		}, [] as HTMLElement[]);
	}
	connectedCallback() {
		!!this.comments && dom.appendChildren.call(this, this.comments);
	}

	private static makeJsDoc(data: jsDocCollection) {
		return (
			data.reduce((accumulator, tagOrComment) => {
				if ('comment' in tagOrComment) {
					accumulator.push(new ContentMarked(tagOrComment.comment));
				}
				return accumulator;
			}, [] as HTMLElement[]) || []
		);
	}
}
customElements.define('code-comments', CodeComments);

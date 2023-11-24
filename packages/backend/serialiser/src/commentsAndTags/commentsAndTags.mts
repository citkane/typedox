import ts from 'typescript';
import { jsDocCollection } from '../index.mjs';
import { TsWrapper } from '@typedox/wrapper';

export function serialiseComments(wrapped: TsWrapper) {
	return wrapped.tsSymbol.declarations?.reduce((accumulator, node) => {
		const comment = serialiseComment(node);
		!!comment && accumulator.push(comment);

		return accumulator;
	}, [] as jsDocCollection[]);
}
export function serialiseComment(node: ts.Node): jsDocCollection | undefined {
	const jsDoc = ts.getJSDocCommentsAndTags(node);
	const jsDocs = jsDoc.reduce((accumulator, doc) => {
		ts.isJSDoc(doc)
			? reduceJsDoc(accumulator, doc)
			: reduceJsDocTag(accumulator, doc);
		return accumulator;
	}, [] as jsDocCollection);

	return jsDocs.length ? jsDocs : undefined;
}

function reduceJsDoc(accumulator: jsDocCollection, doc: ts.JSDoc) {
	const { comment, tags } = doc;
	if (comment) {
		Array.isArray(comment)
			? comment.forEach((comment) =>
					accumulator.push({ comment: comment.getFullText() }),
			  )
			: accumulator.push({ comment: comment.toString() });
	}
	if (tags) {
		tags.forEach((tag) => reduceJsDocTag(accumulator, tag));
	}
}
function reduceJsDocTag(accumulator: jsDocCollection, tag: ts.JSDocTag) {
	accumulator.push({ tag: 'todo' });
}

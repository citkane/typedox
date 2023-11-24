import { filePosition } from '@typedox/serialiser';
import { Highlighter, HighlighterOptions, Theme } from 'shiki';

type shiki = typeof import('shiki');
type purify = typeof import('dompurify');
type marked = typeof import('marked');
type prettier = typeof import('prettier');

let shiki: shiki;
declare const prettier: prettier;
declare const prettierPlugins: any;
declare const marked: marked;

export const sanitise: purify['sanitize'] = (window as any).DOMPurify.sanitize;

export let highlightTs: (
	codeString: string,
) => ReturnType<Highlighter['codeToHtml']>;

export function markedToHtmlString(string: string) {
	const markedHtml = marked.parse(string);
	return sanitise(markedHtml);
}
const prettierOpts = {
	parser: 'typescript',
	plugins: prettierPlugins,
	tabWidth: 4,
};
export async function prettyTs(htmlString: string) {
	try {
		const prettierString = await prettier.format(htmlString, prettierOpts);
		return prettierString;
	} catch (error) {
		console.warn('Could not prettier string:\n', htmlString);
		return htmlString;
	}
}
export async function initShikiTs() {
	const { pathname } = window.location;
	const themes = `${pathname}assets/lib/shiki/themes`;
	const languages = `${pathname}assets/lib/shiki/languages`;
	const wasmPath = `${pathname}assets/lib/shiki/onig.wasm`;
	const shikiPath = `${pathname}assets/lib/shiki/shiki.mjs`;

	const shikiOpts = {
		paths: {
			themes,
			languages,
		},
		theme: 'css-variables',
		langs: ['typescript'],
	} as HighlighterOptions;
	try {
		const wasm = await fetch(wasmPath);
		shiki = await import(shikiPath);
		shiki.setWasm(wasm);
		const highlighter = await shiki.getHighlighter(shikiOpts);
		highlightTs = (codeString: string) => {
			let htmlString = highlighter.codeToHtml(codeString, {
				lang: 'typescript',
			});
			return sanitise(htmlString);
		};
	} catch (error) {
		console.error(error);
	}
}
export function stripComments(string: string) {
	return string.replace(
		/((?:(?:^\h*)?(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/(?:\h*\n(?=\h*(?:\n|\/\*|\/\/)))?|\/\/(?:[^\\]|\\\n?)*?(?:\n(?=\h*(?:\n|\/\*|\/\/))|(?=\n))))+)|("(?:\\[\S\s]|[^"\\])*"|'(?:\\[\S\s]|[^'\\])*'|[\S\s][^\/"'\\\s]*)/gm,
		'$2',
	);
}

export async function highlightCodeAtPositions(
	position: filePosition,
	sourceText: string,
) {
	const [start, end] = [position[0], position[1]];
	const text = sourceText.slice(start, end);
	const commentless = stripComments(text);

	const prettyText = await prettyTs(commentless);
	const highlighted = highlightTs(prettyText).replace(
		/<span class="line"><\/span>\n/g,
		'',
	);

	return highlighted;
}
export function formatLineNums(position: filePosition) {
	if (position[2] === position[3]) return `${position[2]}`;
	return `${position[2]}-${position[3]}`;
}
/*
export function uncommentShiki(highlighted: string) {
	const uncommented = highlighted.split('\n').reduce((accumulator, line) => {
		const commentStart = line.indexOf(
			'<span style="color: var(--shiki-token-comment)">',
		);
		if (commentStart < 0) {
			if (line === '<span class="line"></span>') return accumulator;
			accumulator.push(line);
			return accumulator;
		}

		const commentEnd =
			line.substring(commentStart).indexOf('</span>') + 7 + commentStart;
		const lineRemainder = [
			line.substring(0, commentStart),
			line.substring(commentEnd),
		]
			.join('')
			.replace(
				/<span style="color: var\(--shiki-color-text\)"> *<\/span>/,
				'',
			)
			.replace(
				/<span class="line"><\/span>|<span class="line"><\/span>\n/g,
				'',
			);

		if (!lineRemainder) return accumulator;

		accumulator.push(lineRemainder);
		return accumulator;
	}, [] as string[]);
	return uncommented.join('\n').replace(/<code>\n/, '<code>');
}
*/

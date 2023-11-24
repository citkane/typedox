var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let shiki;
export const sanitise = window.DOMPurify.sanitize;
export let highlightTs;
export function markedToHtmlString(string) {
    const markedHtml = marked.parse(string);
    return sanitise(markedHtml);
}
const prettierOpts = {
    parser: 'typescript',
    plugins: prettierPlugins,
    tabWidth: 4,
};
export function prettyTs(htmlString) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prettierString = yield prettier.format(htmlString, prettierOpts);
            return prettierString;
        }
        catch (error) {
            console.warn('Could not prettier string:\n', htmlString);
            return htmlString;
        }
    });
}
export function initShikiTs() {
    return __awaiter(this, void 0, void 0, function* () {
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
        };
        try {
            const wasm = yield fetch(wasmPath);
            shiki = yield import(shikiPath);
            shiki.setWasm(wasm);
            const highlighter = yield shiki.getHighlighter(shikiOpts);
            highlightTs = (codeString) => {
                let htmlString = highlighter.codeToHtml(codeString, {
                    lang: 'typescript',
                });
                return sanitise(htmlString);
            };
        }
        catch (error) {
            console.error(error);
        }
    });
}
export function stripComments(string) {
    return string.replace(/((?:(?:^\h*)?(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/(?:\h*\n(?=\h*(?:\n|\/\*|\/\/)))?|\/\/(?:[^\\]|\\\n?)*?(?:\n(?=\h*(?:\n|\/\*|\/\/))|(?=\n))))+)|("(?:\\[\S\s]|[^"\\])*"|'(?:\\[\S\s]|[^'\\])*'|[\S\s][^\/"'\\\s]*)/gm, '$2');
}
export function highlightCodeAtPositions(position, sourceText) {
    return __awaiter(this, void 0, void 0, function* () {
        const [start, end] = [position[0], position[1]];
        const text = sourceText.slice(start, end);
        const commentless = stripComments(text);
        const prettyText = yield prettyTs(commentless);
        const highlighted = highlightTs(prettyText).replace(/<span class="line"><\/span>\n/g, '');
        return highlighted;
    });
}
export function formatLineNums(position) {
    if (position[2] === position[3])
        return `${position[2]}`;
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
//# sourceMappingURL=factoryFormatters.js.map
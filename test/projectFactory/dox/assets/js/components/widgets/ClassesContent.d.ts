import { fileInfo, filePositions, jsDocCollection } from '@typedox/serialiser';
import { DoxLocation } from '@typedox/core';
export declare class CodeHeader extends HTMLElement {
    private nameWrapper;
    constructor(fileInfo: fileInfo);
    connectedCallback(): void;
    static getFilenameHtml(fileInfo: fileInfo): HTMLElement;
    static getFileLinesHtml(fileInfo: fileInfo): HTMLElement;
}
export declare class CodeSnippets extends HTMLElement {
    private fileInfo;
    private uid;
    private disconnectResizeable?;
    constructor(fileInfo: fileInfo, location: DoxLocation);
    connectedCallback(): void;
    disconnectedCallback(): void;
    static makeSnippets(sourceText: string, positions: filePositions): Promise<string[]>;
    static makeResizeable(target: HTMLElement, uid: string): () => void;
}
export declare class CodeComments extends HTMLElement {
    comments: HTMLElement[] | undefined;
    constructor(jsDocs: jsDocCollection[] | undefined, positions: filePositions);
    connectedCallback(): void;
    private static makeJsDoc;
}

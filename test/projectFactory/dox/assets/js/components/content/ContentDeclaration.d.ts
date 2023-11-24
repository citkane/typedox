import { DeclarationSerialised, Serialised } from '@typedox/serialiser';
export declare class ContentDeclaration extends HTMLElement {
    rawData: DeclarationSerialised;
    header: HTMLElement;
    codeHeader: HTMLElement;
    codeSnippets: HTMLElement;
    comments: HTMLElement;
    constructor(rawData: Serialised['serialised']);
    connectedCallback(): void;
    disconnectedCallback(): void;
    private logRawData;
    private static makeHeader;
}

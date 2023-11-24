import { DoxLocation } from '@typedox/core';
export type context = keyof typeof contexts;
export declare const contexts: {
    settings: {};
    packages: {};
    documents: {};
    code: {};
};
export declare function route(location: DoxLocation): void;
export declare function locationToUrl(location: DoxLocation): string;
export declare function urlToLocation(url: typeof window.location): DoxLocation | undefined;

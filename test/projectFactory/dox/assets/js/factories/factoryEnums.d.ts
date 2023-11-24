import ts from 'typescript';
import { CategoryKind as _CategoryKind } from '@typedox/core';
export type CategoryKind = _CategoryKind;
export declare let CategoryKind: {
    -readonly [k in keyof typeof _CategoryKind]: (typeof _CategoryKind)[k];
};
export type SyntaxKind = ts.SyntaxKind;
export declare let SyntaxKind: {
    -readonly [k in keyof typeof ts.SyntaxKind]: (typeof ts.SyntaxKind)[k];
};
export declare function initEnums(): Promise<void>;

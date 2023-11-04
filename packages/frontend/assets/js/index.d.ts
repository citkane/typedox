import { CategoryKind } from '@typedox/core';
import { menuBranch } from '@typedox/serialiser';
import ts from 'typescript';
type categoryKind = {
    [key in keyof typeof CategoryKind | number]: number | keyof typeof CategoryKind;
};
declare global {
    interface Document {
        dox: {
            mainMenu: menuBranch;
            categoryKind: categoryKind;
            SyntaxKind: ts.SyntaxKind;
        };
    }
}
export * from './components/_index.js';
declare const doxApp: Promise<void>;
export default doxApp;

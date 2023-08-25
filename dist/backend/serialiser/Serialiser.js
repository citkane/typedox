"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
class Serialiser {
    static root(tree) {
        const { packageName, version } = tree;
        const branch = Serialiser.branch(tree);
        return Object.assign({ packageName, version }, branch);
    }
    static branch(branch) {
        const nameSpaces = Serialiser.nameSpaces(branch);
        const variables = Serialiser.variables(branch);
        const functions = Serialiser.functions(branch);
        return { nameSpaces, variables, functions };
    }
    static nameSpaces(branch) {
        const nameSpaces = {};
        branch.nameSpaces.forEach((branch, name) => {
            nameSpaces[name] = Serialiser.branch(branch);
        });
        return nameSpaces;
    }
    static variables(branch) {
        const variables = {};
        branch.variables.forEach((declaration, name) => {
            variables[name] = ts.SyntaxKind[declaration.tsKind];
        });
        return variables;
    }
    static functions(branch) {
        const functions = {};
        branch.functions.forEach((declaration, name) => {
            functions[name] = ts.SyntaxKind[declaration.tsKind];
        });
        return functions;
    }
}
exports.default = Serialiser;
//# sourceMappingURL=Serialiser.js.map
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
const typescript_1 = require("typescript");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class TypeDox {
    checker;
    program;
    constructor(checker, program) {
        this.checker = checker;
        this.program = program;
    }
    getExportsFromSourcefile(sourceFile) {
        const sourceSymbol = this.checker.getSymbolAtLocation(sourceFile);
        return this.checker.getExportsOfModule(sourceSymbol);
    }
    getTypeFromSymbol(classSymbol) {
        return classSymbol.valueDeclaration
            ? this.checker.getTypeOfSymbolAtLocation(classSymbol, classSymbol.valueDeclaration)
            : undefined;
    }
    static isNodeExported(node) {
        return (((0, typescript_1.getCombinedModifierFlags)(node) & typescript_1.ModifierFlags.Export) !==
            0 ||
            (!!node.parent && node.parent.kind === typescript_1.SyntaxKind.SourceFile));
    }
    static makeFilePath(exportDeclaration, pathString) {
        const fileParts = pathString.text.split(".");
        const originalExtension = fileParts.pop();
        const fileExtension = originalExtension.endsWith("x") ? "tsx" : "ts";
        const fileName = `${fileParts.join(".")}`;
        const dirName = path.dirname(exportDeclaration.getSourceFile().fileName);
        let filePath = path.join(dirName, `${fileName}.${fileExtension}`);
        if (!fs.existsSync(filePath))
            filePath = path.join(dirName, `${fileName}.${originalExtension}`);
        return { originalExtension, fileName, dirName, filePath };
    }
    static makeExportAlias(specification) {
        return typeof specification === "string"
            ? {
                name: specification,
            }
            : specification.propertyName
                ? {
                    name: specification.propertyName?.getText(),
                    alias: specification.name.getText(),
                }
                : {
                    name: specification.name.getText(),
                };
    }
    static resolveLocation(location) {
        return location
            .map((alias) => (alias.alias ? alias.alias : alias.name))
            .join(".");
    }
}
exports.default = TypeDox;
//# sourceMappingURL=TypeDox.js.map
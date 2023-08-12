"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const types_1 = require("../types");
const Dox_1 = __importDefault(require("../Dox"));
const ExportMemberDox_1 = __importDefault(require("./ExportMemberDox"));
class ExportDeclarationDox extends Dox_1.default {
    kind = types_1.DoxKind.ExportDeclaration;
    declaration;
    nameSpace;
    exportSourceFile;
    exportTargetFile;
    members = new Map();
    constructor(context, declaration) {
        super(context);
        const { getNameSpace, getFileName, getExportTargetFile } = ExportDeclarationDox;
        this.declaration = declaration;
        this.exportSourceFile = getFileName(declaration);
        this.exportTargetFile = getExportTargetFile(this.moduleSymbol, this.exportSourceFile);
        this.nameSpace = getNameSpace(declaration);
        const { exportTargetFile, moduleType, sourceType } = this;
        const type = moduleType || sourceType;
        this.registerMembersToSelf(type);
        this.registerSelfToPackage();
        this.package?.addEntryFile(exportTargetFile);
    }
    get namedExport() {
        return this.declaration
            .getChildren()
            .find((node) => (0, typescript_1.isNamedExports)(node));
    }
    get moduleSymbol() {
        const { checker } = this.context;
        const { moduleSpecifier } = this.declaration;
        return !!moduleSpecifier
            ? checker.getSymbolAtLocation(moduleSpecifier)
            : undefined;
    }
    get moduleType() {
        const { checker } = this.context;
        const symbol = this.moduleSymbol;
        return symbol ? checker.getTypeOfSymbol(symbol) : undefined;
    }
    get sourceType() {
        const { checker } = this.context;
        const symbol = checker.getSymbolAtLocation(this.declaration.parent.getSourceFile());
        return checker.getTypeOfSymbol(symbol);
    }
    registerSelfToPackage() {
        const map = this.package.declarationsMap.get(this.exportSourceFile).exports;
        map.set(this.id, this);
    }
    registerMembersToSelf(type) {
        const namedExport = this.namedExport;
        const context = { ...this.context, exportDeclaration: this };
        const members = !!namedExport
            ? namedExport.elements.map((specifier) => new ExportMemberDox_1.default(context, specifier, type))
            : type
                .getProperties()
                .map((symbol) => new ExportMemberDox_1.default(context, symbol));
    }
    static getExportTargetFile = (module, sourceFile) => {
        return !!module
            ? module.valueDeclaration.getSourceFile().fileName
            : sourceFile;
    };
    static getFileName = (declaration) => {
        return declaration.getSourceFile().fileName;
    };
    static getNameSpace = (declaration) => {
        const node = declaration
            .getChildren()
            .find((node) => (0, typescript_1.isNamespaceExport)(node));
        return node?.name.getText();
    };
}
exports.default = ExportDeclarationDox;
//# sourceMappingURL=ExportDeclarationDox.js.map
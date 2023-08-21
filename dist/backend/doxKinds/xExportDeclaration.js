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
const dox = __importStar(require("../typedox"));
class ExportDeclaration extends dox.Dox {
    constructor(context, declaration) {
        super(context);
        this.kind = dox.Kind.ExportDeclaration;
        this.membersMap = new Map();
        const { getExportTargetFile, getNameSpace, getNamedExports } = ExportDeclaration;
        this.declaration = declaration;
        this.exportSourceFile = declaration.getSourceFile().fileName;
        const moduleSymbol = this.getModuleSymbol();
        this.exportTargetFile = getExportTargetFile(moduleSymbol);
        this.nameSpace = getNameSpace(declaration);
        const foo = this.context.checker.getSymbolAtLocation(declaration.getSourceFile());
        dox.log.info(declaration.getText());
        if (foo)
            dox.log.info(this.context.checker
                .getExportsOfModule(foo)
                .map((symbol) => symbol.getName()));
        //this.nameSpace = getNameSpace(declaration);
        this.makeMembers(moduleSymbol);
        //this.package!.registerExportDeclaration(this);
        this.package.addEntryFile(this.exportTargetFile);
    }
    registerMember(member) {
        this.membersMap.set(member.name, member);
    }
    makeMembers(module) {
        /*
        const namedExport = this.namedExport;
        const context = { ...this.context, exportDeclaration: this };
        const members = !!namedExport
            ? namedExport.elements.map(
                    (specifier) =>
                        new dox.ExportMember(context, specifier, type),
              )
            : type
                    .getProperties()
                    .map((symbol) => new dox.ExportMember(context, symbol));
                    */
    }
    /*
    private get namedExport() {
        return this.declaration
            .getChildren()
            .find((node) => ts.isNamedExports(node)) as ts.NamedExports;
    }
    */
    static getNamedExports(declaration) {
        var _a;
        return;
        return (_a = declaration
            .getChildren()
            .find((child) => ts.isNamedExports(child))) === null || _a === void 0 ? void 0 : _a.getChildren();
        //.find((child) => ts.isSyntaxList);
    }
    getModuleSymbol() {
        if (!('moduleSpecifier' in this.declaration)) {
            dox.log.error(`There should be a "moduleSpecifier" in ts.ExportDeclaration`);
        }
        const { checker } = this.context;
        const { moduleSpecifier } = this.declaration;
        return checker.getSymbolAtLocation(moduleSpecifier);
    }
}
ExportDeclaration.getExportTargetFile = (symbol) => {
    return symbol.valueDeclaration.getSourceFile().fileName;
};
/*
private static getExportNames(declaration: ts.ExportDeclaration) {
    return declaration
        .getChildren()
        .filter((child) => {
            dox.log.info(ts.SyntaxKind[child.kind]);
            return ts.isNamespaceExport(child);
        })
        .map((child) => child.getText());
}
*/
ExportDeclaration.getNameSpace = (declaration) => {
    const nameSpaceNode = declaration
        .getChildren()
        .find((node) => ts.isNamespaceExport(node));
    return nameSpaceNode === null || nameSpaceNode === void 0 ? void 0 : nameSpaceNode.name.getText();
};
exports.default = ExportDeclaration;
//# sourceMappingURL=xExportDeclaration.js.map
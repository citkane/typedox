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
class Declarations extends dox.Dox {
    constructor(context, exportSymbol, declarationTriggers) {
        var _a;
        super(context);
        this.kind = dox.Kind.Declarations;
        this.declarationTriggers = declarationTriggers;
        (_a = exportSymbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.forEach((declaration) => {
            if (ts.isNamespaceExport(declaration) ||
                ts.isExportSpecifier(declaration) ||
                ts.isExportDeclaration(declaration)) {
                this.parseReferencedDeclaration(declaration);
            }
            else if (ts.isVariableDeclaration(declaration) ||
                ts.isClassDeclaration(declaration)) {
                this.paresInternalDeclaration(declaration);
            }
            else {
                dox.log.warn('Declaration not implemented', ':', ts.SyntaxKind[declaration.kind]);
                dox.log.debug(declaration.parent.getText());
            }
        });
    }
    parseReferencedDeclaration(declaration) {
        if (ts.isNamespaceExport(declaration)) {
            const target = declaration.parent.moduleSpecifier;
            const { targetFile, targetType } = this.targeter(target);
            this.package.addEntryFile(targetFile);
            this.declarationTriggers.push(() => {
                new dox.NamespaceExport(this.context, declaration, targetType);
            });
        }
        if (ts.isExportSpecifier(declaration)) {
            const target = declaration.parent.parent.moduleSpecifier;
            const { targetFile, targetType } = !!target
                ? this.targeter(target)
                : { targetFile: undefined, targetType: undefined };
            if (!!targetFile)
                this.package.addEntryFile(targetFile);
            this.declarationTriggers.push(() => {
                new dox.ExportSpecifier(this.context, declaration, targetType);
            });
        }
        if (ts.isExportDeclaration(declaration)) {
            const target = declaration.moduleSpecifier;
            const { targetFile, targetType } = this.targeter(target);
            this.package.addEntryFile(targetFile);
            this.declarationTriggers.push(() => {
                new dox.ExportDeclaration(this.context, declaration, targetType);
            });
        }
    }
    paresInternalDeclaration(declaration) { }
    targeter(exportExpression) {
        const { checker } = this.context;
        const exportSymbol = checker.getSymbolAtLocation(exportExpression);
        const targetType = checker.getTypeOfSymbol(exportSymbol);
        const targetFile = exportSymbol.valueDeclaration.getSourceFile().fileName;
        return {
            targetFile,
            targetType,
        };
    }
}
exports.default = Declarations;
//# sourceMappingURL=Declarations.js.map
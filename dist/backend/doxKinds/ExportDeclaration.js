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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const dox = __importStar(require("../typedox"));
class ExportDeclarations extends dox.Dox {
    constructor(context, exportSymbol) {
        var _b;
        super(context);
        const aliasOrName = exportSymbol.getName();
        //dox.log.info({ aliasOrName });
        (_b = exportSymbol.getDeclarations()) === null || _b === void 0 ? void 0 : _b.forEach((declaration) => {
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
                dox.log.warn('Declaration not implemented', ':', dox.tsKindString(declaration), ':', declaration.parent.getText());
            }
            /*
            if (ts.isNamespaceExport(declaration)) {
                dox.log.info(declaration.parent.getText());
                const nameSpace = declaration.name.getText();
                dox.log.info({ nameSpace });
            } else if (ts.isExportSpecifier(declaration)) {
                dox.log.info(declaration.parent.parent.getText());
                const propertyName = declaration.propertyName?.getText();
                dox.log.info({ propertyName });
            } else {
                //dox.log.info(declaration);
            }
            */
        });
    }
    parseReferencedDeclaration(declaration) {
        const { exportTargetFile, exportType } = this.getExportTarget(declaration);
        const context = Object.assign(Object.assign({}, this.context), { exportDeclaration: this });
        if (ts.isNamespaceExport(declaration)) {
            new dox.NamespaceExport(context, declaration, exportType);
        }
        //dox.log.info(exportTargetFile);
        //dox.log.info(dox.tsKindString(declaration), ':', declaration.getText());
        this.package.addEntryFile(exportTargetFile);
    }
    paresInternalDeclaration(declaration) { }
    getExportTarget(node) {
        const { checker } = this.context;
        const { getExportExpression } = ExportDeclarations;
        const exportExpression = getExportExpression(node);
        const exportSymbol = checker.getSymbolAtLocation(exportExpression);
        const exportType = checker.getTypeOfSymbol(exportSymbol);
        return {
            exportTargetFile: exportSymbol.valueDeclaration.getSourceFile().fileName,
            exportType,
        };
    }
}
_a = ExportDeclarations;
ExportDeclarations.getExportExpression = (node) => {
    return !('moduleSpecifier' in node)
        ? _a.getExportExpression(node.parent)
        : node.moduleSpecifier;
};
exports.default = ExportDeclarations;
//# sourceMappingURL=ExportDeclaration.js.map
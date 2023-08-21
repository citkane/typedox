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
class ExportDeclaration2 extends dox.Dox {
    constructor(context, exportSymbols, sourceFile) {
        super(context);
        this.membersMap = new Map();
        const { checker } = this.context;
        dox.log.info('\n');
        dox.log.info('-------------------', sourceFile.fileName);
        exportSymbols.forEach((symbol) => {
            var _b;
            const aliasOrName = symbol.getName();
            dox.log.info({ aliasOrName });
            /*
            dox.log.info(
                checker
                    .getTypeOfSymbol(symbol)
                    .symbol.valueDeclaration?.getSourceFile().fileName,
            );
            */
            (_b = symbol.getDeclarations()) === null || _b === void 0 ? void 0 : _b.forEach((declaration) => {
                var _b;
                const { exportTargetFile, exportType } = this.getExportTarget(declaration);
                //dox.log.info(exportTargetFile);
                dox.log.info(ts.SyntaxKind[declaration.kind], ':', declaration.getText());
                if (ts.isNamespaceExport(declaration)) {
                    dox.log.info(declaration.parent.getText());
                    const nameSpace = declaration.name.getText();
                    dox.log.info({ nameSpace });
                }
                else if (ts.isExportSpecifier(declaration)) {
                    dox.log.info(declaration.parent.parent.getText());
                    const propertyName = (_b = declaration.propertyName) === null || _b === void 0 ? void 0 : _b.getText();
                    dox.log.info({ propertyName });
                }
                else {
                    //dox.log.info(declaration);
                }
                this.package.addEntryFile(exportTargetFile);
            });
        });
    }
    getExportTarget(node) {
        const { checker } = this.context;
        const { getExportExpression } = ExportDeclaration2;
        const exportExpression = getExportExpression(node);
        const exportSymbol = checker.getSymbolAtLocation(exportExpression);
        const exportType = checker.getTypeOfSymbol(exportSymbol);
        return {
            exportTargetFile: exportSymbol.valueDeclaration.getSourceFile().fileName,
            exportType,
        };
    }
}
_a = ExportDeclaration2;
ExportDeclaration2.getExportExpression = (node) => {
    return !('moduleSpecifier' in node)
        ? _a.getExportExpression(node.parent)
        : node.moduleSpecifier;
};
exports.default = ExportDeclaration2;
//# sourceMappingURL=ExportDeclaration2.js.map
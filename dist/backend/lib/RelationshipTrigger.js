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
class RelationshipTrigger {
    constructor(context, exportSymbol) {
        var _b;
        this.relationshipTriggers = [];
        const { isReferencedExport, parseReferencedExport, isExport } = RelationshipTrigger;
        (_b = exportSymbol.getDeclarations()) === null || _b === void 0 ? void 0 : _b.forEach((declaration) => {
            if (isReferencedExport(declaration))
                return parseReferencedExport(declaration, this.relationshipTriggers, context);
            if (!isExport(declaration)) {
                dox.log.warn('Declaration not implemented', ':', ts.SyntaxKind[declaration.kind]);
                dox.log.debug(declaration.parent.getText());
            }
        });
    }
    mergeTriggers(relationshipTriggers) {
        return [...relationshipTriggers, ...this.relationshipTriggers];
    }
}
_a = RelationshipTrigger;
RelationshipTrigger.isExport = (declaration) => {
    return (ts.isVariableDeclaration(declaration) ||
        ts.isClassDeclaration(declaration));
};
RelationshipTrigger.isReferencedExport = (declaration) => {
    return (ts.isNamespaceExport(declaration) ||
        ts.isExportSpecifier(declaration) ||
        ts.isExportDeclaration(declaration));
};
RelationshipTrigger.parseReferencedExport = (declaration, relationshipTriggers, context) => {
    if (ts.isNamespaceExport(declaration)) {
        const target = declaration.parent.moduleSpecifier;
        const { targetFile, targetType } = _a.targetHelper(target, context);
        context.package.addEntryFile(targetFile);
        relationshipTriggers.push(() => {
            new dox.NamespaceExport(context, declaration, targetType);
        });
    }
    if (ts.isExportSpecifier(declaration)) {
        const target = declaration.parent.parent.moduleSpecifier;
        const { targetFile, targetType } = !!target
            ? _a.targetHelper(target, context)
            : { targetFile: undefined, targetType: undefined };
        if (!!targetFile)
            context.package.addEntryFile(targetFile);
        relationshipTriggers.push(() => {
            new dox.ExportSpecifier(context, declaration, targetType);
        });
    }
    if (ts.isExportDeclaration(declaration)) {
        const target = declaration.moduleSpecifier;
        const { targetFile, targetType } = _a.targetHelper(target, context);
        context.package.addEntryFile(targetFile);
        relationshipTriggers.push(() => {
            new dox.ExportDeclaration(context, declaration, targetType);
        });
    }
};
/**
 *A convenience function.
 * @param exportExpression
 * @param context
 * @returns The export target as a filePath string and ts.Type
 */
RelationshipTrigger.targetHelper = (exportExpression, context) => {
    const exportSymbol = context.checker.getSymbolAtLocation(exportExpression);
    const targetType = context.checker.getTypeOfSymbol(exportSymbol);
    const targetFile = exportSymbol.valueDeclaration.getSourceFile().fileName;
    return {
        targetFile,
        targetType,
    };
};
exports.default = RelationshipTrigger;
//# sourceMappingURL=RelationshipTrigger.js.map
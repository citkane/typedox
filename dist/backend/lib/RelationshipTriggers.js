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
class RelationshipTriggers {
    constructor(context, exportSymbol) {
        var _a;
        this.relationshipTriggers = [];
        this.childFiles = [];
        /*
        private parseReferencedExport(
            declaration: dox.referencedExport,
            relationshipTriggers: (() => void)[],
            context: dox.lib.Context,
        ) {
            let targetFile: string | undefined, targetType: ts.Type;
            if (ts.isNamespaceExport(declaration)) {
                const target = declaration.parent.moduleSpecifier!;
                ({ targetFile, targetType } = this.targetHelper(target));
    
                //context.package!.addEntryFile(targetFile);
    
                relationshipTriggers.push(() => {
                    new dox.NamespaceExport(context, declaration, targetType);
                });
            }
            if (ts.isExportSpecifier(declaration)) {
                const target = declaration.parent.parent.moduleSpecifier;
                const { targetFile, targetType } = !!target
                    ? this.targetHelper(target!)
                    : { targetFile: undefined, targetType: undefined };
                if (!!targetFile)
                    //if (!!targetFile) context.package!.addEntryFile(targetFile);
    
                    relationshipTriggers.push(() => {
                        new dox.ExportSpecifier(context, declaration, targetType);
                    });
            }
            if (ts.isExportDeclaration(declaration)) {
                const target = declaration.moduleSpecifier!;
                const { targetFile, targetType } = this.targetHelper(target);
                //context.package!.addEntryFile(targetFile);
    
                relationshipTriggers.push(() => {
                    new dox.ExportDeclaration(context, declaration, targetType);
                });
            }
    
            if (!!targetFile) this.childFiles.push(targetFile);
        }
    */
        /**
         *A convenience function.
         * @param exportExpression
         * @param context
         * @returns The export target as a filePath string and ts.Type
         */
        this.targetHelper = (exportExpression) => {
            const { checker } = this.context;
            const exportSymbol = checker.getSymbolAtLocation(exportExpression);
            const targetType = checker.getTypeOfSymbol(exportSymbol);
            const targetFile = exportSymbol.valueDeclaration.getSourceFile().fileName;
            return {
                targetFile,
                targetType,
            };
        };
        this.context = context;
        (_a = exportSymbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.forEach((declaration) => {
            ts.isNamespaceExport(declaration)
                ? this.isNameSpaceExport(declaration)
                : ts.isExportSpecifier(declaration)
                    ? this.isExportSpecifier(declaration)
                    : ts.isExportDeclaration(declaration)
                        ? this.isExportDeclaration(declaration)
                        : ts.isVariableDeclaration(declaration)
                            ? this.isVariableDeclaration(declaration)
                            : (() => {
                                dox.log.warn('Declaration not implemented in dox.RelationshipTriggers', ':', ts.SyntaxKind[declaration.kind]);
                                dox.log.debug(declaration.parent.getText());
                            })();
        });
    }
    isNameSpaceExport(tsDeclaration) {
        const target = tsDeclaration.parent.moduleSpecifier;
        const { targetFile, targetType } = this.targetHelper(target);
        this.childFiles.push(targetFile);
        const name = tsDeclaration.name.getText();
        const trigger = () => {
            const declaration = this.getDeclaration(name);
            this.getRemoteSymbols(targetType).forEach((symbol) => {
                const name = symbol.getName();
                const remoteDeclaration = this.getRemoteDeclarationsMap(symbol).get(name);
                declaration.children.set(name, remoteDeclaration);
                remoteDeclaration.parents.push(declaration);
            });
        };
        this.relationshipTriggers.push(trigger);
    }
    isExportSpecifier(tsDeclaration) {
        var _a;
        const target = tsDeclaration.parent.parent.moduleSpecifier;
        if (!target)
            return;
        const name = tsDeclaration.name.getText();
        const alias = (_a = tsDeclaration.propertyName) === null || _a === void 0 ? void 0 : _a.getText();
        const { targetFile, targetType } = this.targetHelper(target);
        this.childFiles.push(targetFile);
        const trigger = () => {
            const declaration = this.getDeclaration(name);
            const map = this.getRemoteDeclarationsMap(targetType.getSymbol());
            const remoteDeclaration = map.get(alias || name);
            declaration.children.set(alias || name, remoteDeclaration);
            remoteDeclaration.parents.push(declaration);
        };
        this.relationshipTriggers.push(trigger);
    }
    isExportDeclaration(declaration) {
        const target = declaration.moduleSpecifier;
        const { targetFile, targetType } = this.targetHelper(target);
        this.childFiles.push(targetFile);
        const trigger = () => {
            this.getRemoteSymbols(targetType).forEach((symbol) => {
                const name = symbol.getName();
                const declaration = this.getDeclaration(name);
                const remoteDeclaration = this.getRemoteDeclarationsMap(symbol).get(name);
                declaration.children.set(name, remoteDeclaration);
                remoteDeclaration.parents.push(declaration);
            });
        };
        this.relationshipTriggers.push(trigger);
    }
    isVariableDeclaration(declaration) {
        //dox.log.info(declaration.name.getText());
    }
    getDeclaration(name) {
        var _a;
        const declarationsMap = (_a = this.context.sourceFile) === null || _a === void 0 ? void 0 : _a.declarationsMap;
        return declarationsMap.get(name);
    }
    getRemoteSymbols(remoteType) {
        return remoteType.getProperties().filter((symbol) => {
            return !!symbol.valueDeclaration && symbol.name !== 'default';
        });
    }
    getRemoteDeclarationsMap(remoteSymbol) {
        const remoteSourceFile = this.context.package.filesMap.get(remoteSymbol.valueDeclaration.getSourceFile().fileName);
        return remoteSourceFile.declarationsMap;
    }
}
exports.default = RelationshipTriggers;
//# sourceMappingURL=RelationshipTriggers.js.map
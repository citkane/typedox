"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("../Dox"));
class DoxExportDeclaration extends Dox_1.default {
    exportDeclaration;
    exportSources;
    location;
    constructor(context, declaration) {
        super(context);
        this.exportSources = [];
        this.location = [];
        this.exportDeclaration = declaration;
        console.log(declaration.getText());
        this.exportDeclaration.forEachChild((childNode) => this.parse(childNode));
    }
    parse(node) {
        //console.log(SyntaxKind[node.kind]);
        switch (node.kind) {
            case typescript_1.SyntaxKind.NamedExports:
                this.parseNamedExports(node);
                break;
            case typescript_1.SyntaxKind.ExportSpecifier:
                this.parseExportSpecifier(node);
                break;
            case typescript_1.SyntaxKind.StringLiteral:
                this.parseStringLiteral(node);
                break;
            case typescript_1.SyntaxKind.NamespaceExport:
                this.parseNamespaceExport(node);
                break;
            case typescript_1.SyntaxKind.ExportAssignment:
                this.parseExportAssignment(node);
                break;
            case typescript_1.SyntaxKind.Identifier:
                this.parseIdentifier(node);
                break;
            default:
                const kindString = typescript_1.SyntaxKind[node.kind];
                console.log(kindString);
        }
    }
    parseNamedExports(namedExport) {
        namedExport.forEachChild((child) => this.parse(child));
    }
    parseExportSpecifier = (exportSpecifier) => {
        const alias = Dox_1.default.makeExportAlias(exportSpecifier);
        this.location.push(alias);
        exportSpecifier.forEachChild((child) => this.parse(child));
    };
    parseStringLiteral(stringLiteral) {
        const file = Dox_1.default.makeFilePaths(this.exportDeclaration, stringLiteral.text);
        this.exportSources.push(file);
    }
    parseNamespaceExport(namespaceExport) {
        namespaceExport.forEachChild((child) => this.parse(child));
    }
    parseExportAssignment(exportAssignment) {
        exportAssignment.forEachChild((child) => this.parse(child));
    }
    parseIdentifier(identifier) {
        identifier.forEachChild((child) => this.parse(child));
        //this.location.push(Dox.makeExportAlias(identifier.getText()));
    }
}
exports.default = DoxExportDeclaration;
//# sourceMappingURL=DoxExportDeclaration.js.map
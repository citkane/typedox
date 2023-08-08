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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const TypeDox_1 = __importDefault(require("./TypeDox"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class DoxExport extends TypeDox_1.default {
    exportDeclaration;
    exportSources;
    location;
    constructor(checker, program, declaration, location) {
        super(checker, program);
        this.exportSources = [];
        this.location = location;
        this.exportDeclaration = declaration;
        this.exportDeclaration.forEachChild((child) => {
            this.parse(child);
            //console.log(SyntaxKind[child.kind]);
        });
    }
    parseExportDeclaration(exportDeclaration, namespace = false) {
        exportDeclaration.forEachChild((child) => this.parse(child));
    }
    parseNamedExports(namedExport, namespace = false) {
        namedExport.forEachChild((child) => this.parse(child));
    }
    parseExportSpecifier = (exportSpecifier, namespace = false) => {
        this.location.push(exportSpecifier.name.getText());
        return;
        console.table({
            propertyname: exportSpecifier.propertyName?.getText(),
            name: exportSpecifier.name.getText(),
        });
    };
    parseStringLiteral(stringLiteral, namespace = false) {
        const fileParts = stringLiteral.text.split(".");
        const originalExtension = fileParts.pop();
        const fileExtension = originalExtension.endsWith("x") ? "tsx" : "ts";
        const fileName = `${fileParts.join(".")}`;
        const dirName = path.dirname(this.exportDeclaration.getSourceFile().fileName);
        let filePath = path.join(dirName, `${fileName}.${fileExtension}`);
        if (!fs.existsSync(filePath))
            filePath = path.join(dirName, `${fileName}.${originalExtension}`);
        //console.table({ dirName, fileName, filePath });
        const fileSource = this.program.getSourceFile(filePath);
        this.exportSources.push(fileSource);
    }
    parseNamespaceExport(namespaceExport, namespace = false) {
        namespaceExport.forEachChild((child) => this.parse(child, true));
    }
    parseExportAssignment(exportAssignment, namespace = false) {
        exportAssignment.forEachChild((child) => this.parse(child));
    }
    parseIdentifier(identifier, namespace = false) {
        if (namespace)
            this.location.push(identifier.getText());
    }
    parse(node, namespace = false) {
        const kindString = typescript_1.SyntaxKind[node.kind];
        //if (namespace) console.log(kindString, node.getText());
        const command = `parse${kindString}`;
        return this[command] ? this[command](node, namespace) : null; //console.log(kindString);
    }
    static nodesToSkip = [typescript_1.SyntaxKind.ImportDeclaration];
}
exports.default = DoxExport;
//# sourceMappingURL=DoxExport.js.map
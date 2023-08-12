"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("./Dox"));
const ExportDeclarationDox_1 = __importDefault(require("./doxKinds/ExportDeclarationDox"));
const types_1 = require("./types");
class DoxPackage extends Dox_1.default {
    kind = types_1.DoxKind.Package;
    declarationsMap = new Map();
    constructor(context, entryFileList) {
        super(context);
        this.addEntryFiles(entryFileList);
    }
    addEntryFile = (fileName) => this.addEntryFiles([fileName]);
    addEntryFiles = (fileNames) => {
        fileNames = this.deDupeFilelist(fileNames);
        const entrySources = this.getEntrySources(fileNames);
        const declarations = this.parseForDeclarations(entrySources);
        this.registerFilesWithSelf(fileNames);
        this.registerExportDeclarations(declarations.exports);
    };
    registerFilesWithSelf(fileNames) {
        const { declarationsMap } = DoxPackage;
        fileNames.forEach((fileName) => this.declarationsMap.set(fileName, declarationsMap()));
    }
    getEntrySources(fileList) {
        const { program } = this.context;
        return fileList.map((fileName) => program.getSourceFile(fileName));
    }
    deDupeFilelist(fileList) {
        return fileList.filter((file) => !this.declarationsMap.has(file));
    }
    registerExportDeclarations = (exportDeclarations) => {
        const context = { ...this.context, package: this };
        exportDeclarations.forEach((exportDeclaration) => {
            new ExportDeclarationDox_1.default(context, exportDeclaration);
        });
    };
    parseForDeclarations(sources) {
        const { declarationsContainer: declarationContainer } = DoxPackage;
        const declarations = declarationContainer();
        const { exports, imports, classes, variables, types, interfaces } = declarations;
        sources.forEach((source) => parse(source));
        return declarations;
        function parse(node) {
            switch (node.kind) {
                case typescript_1.SyntaxKind.ExportDeclaration:
                    exports.push(node);
                    break;
                case typescript_1.SyntaxKind.ImportDeclaration:
                    imports.push(node);
                    break;
                case typescript_1.SyntaxKind.ClassDeclaration:
                    classes.push(node);
                    break;
                case typescript_1.SyntaxKind.VariableDeclarationList:
                    variables.push(node);
                    break;
                case typescript_1.SyntaxKind.InterfaceDeclaration:
                    interfaces.push(node);
                    break;
                case typescript_1.SyntaxKind.TypeAliasDeclaration:
                    types.push(node);
                    break;
                default:
                    const kind = typescript_1.SyntaxKind[node.kind];
                    if (kind.indexOf("Declaration") > 0)
                        console.log(typescript_1.SyntaxKind[node.kind], ":", node.getText());
                    node.forEachChild((child) => parse(child));
            }
        }
    }
    static getExportDeclarationsFromNode = (node, exportDeclarations = []) => {
        node.forEachChild((childNode) => {
            (0, typescript_1.isExportDeclaration)(childNode)
                ? exportDeclarations.push(childNode)
                : this.getExportDeclarationsFromNode(childNode, exportDeclarations);
        });
        return exportDeclarations;
    };
    static declarationsContainer() {
        return {
            exports: [],
            imports: [],
            classes: [],
            variables: [],
            types: [],
            interfaces: [],
        };
    }
    static declarationsMap() {
        return {
            exports: new Map(),
            imports: new Map(),
            classes: new Map(),
            variables: new Map(),
            types: new Map(),
            interfaces: new Map(),
        };
    }
}
exports.default = DoxPackage;
//# sourceMappingURL=DoxPackage.js.map
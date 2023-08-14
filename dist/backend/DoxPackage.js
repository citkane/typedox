"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("./Dox"));
const ExportDeclarationDox_1 = __importDefault(require("./doxKinds/ExportDeclarationDox"));
const types_1 = require("./types");
const Logger_1 = require("./Logger");
const logger = new Logger_1.Logger();
class DoxPackage extends Dox_1.default {
    constructor(context, entryFileList) {
        var _b;
        super(context);
        this.kind = types_1.DoxKind.Package;
        this.filesMap = new Map();
        this.addEntryFile = (fileName) => fileName ? this.addEntryFiles([fileName]) : null;
        this.addEntryFiles = (fileNames) => {
            const { declarationsContainer, parseForDeclarations } = DoxPackage;
            fileNames = this.deDupeFilelist(fileNames);
            const entrySources = this.getEntrySources(fileNames);
            const declarations = parseForDeclarations(entrySources, declarationsContainer());
            this.registerFilesWithSelf(fileNames);
            this.registerExportDeclarations(declarations.exports);
        };
        this.registerExportDeclarations = (exportDeclarations) => {
            const context = Object.assign(Object.assign({}, this.context), { package: this });
            exportDeclarations.forEach((exportDeclaration) => {
                new ExportDeclarationDox_1.default(context, exportDeclaration);
            });
        };
        super.package = this;
        this.addEntryFiles(entryFileList);
        this.forEachExportMember((member, declaration) => {
            if (!declaration.exportTargetFile)
                return;
            const targetMembers = [
                ...this.filesMap
                    .get(declaration.exportTargetFile)
                    .exports.values(),
            ]
                .map((declaration) => declaration.membersMap.get(member.name))
                .filter((member) => !!member);
            targetMembers.forEach((targetMember) => targetMember.parents.set(member.id, member));
        });
        const members = [
            ...(((_b = this.filesMap
                .get('/home/michaeladmin/code/typedox/src/frontend/webComponents/Signature/signatureTypes/index.ts')) === null || _b === void 0 ? void 0 : _b.exports.values()) || []),
        ][0].membersMap;
        [...members.values()][0].getParentMembers();
    }
    forEachExport(callBack) {
        this.filesMap.forEach((declarationMaps) => {
            declarationMaps.exports.forEach(callBack);
        });
    }
    forEachExportMember(callBack) {
        this.forEachExport((declaration) => declaration.membersMap.forEach((member) => callBack(member, declaration)));
    }
    registerExportDeclaration(declaration) {
        this.filesMap
            .get(declaration.exportSourceFile)
            .exports.set(declaration.id, declaration);
    }
    registerFilesWithSelf(fileNames) {
        const { declarationsMap } = DoxPackage;
        fileNames.forEach((fileName) => this.filesMap.set(fileName, declarationsMap()));
    }
    getEntrySources(fileList) {
        const { program } = this.context;
        return fileList
            .map((fileName) => program.getSourceFile(fileName))
            .filter((source, i) => {
            if (!source)
                logger.warn(`No source file was found for "${fileList[i]}"`);
            return !!source;
        });
    }
    deDupeFilelist(fileList) {
        return fileList.filter((file) => !this.filesMap.has(file));
    }
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
_a = DoxPackage;
DoxPackage.parseForDeclarations = (nodes, container) => {
    const { exports, imports, classes, variables, types, interfaces } = container;
    nodes.forEach((node) => {
        if ((0, typescript_1.isExportDeclaration)(node)) {
            exports.push(node);
        }
        else if ((0, typescript_1.isExportAssignment)(node)) {
            exports.push(node);
        }
        else if ((0, typescript_1.isImportDeclaration)(node)) {
            imports.push(node);
        }
        else if ((0, typescript_1.isClassDeclaration)(node)) {
            classes.push(node);
        }
        else if ((0, typescript_1.isInterfaceDeclaration)(node)) {
            interfaces.push(node);
        }
        else if ((0, typescript_1.isTypeAliasDeclaration)(node)) {
            types.push(node);
        }
        else if (node.kind === typescript_1.SyntaxKind.FirstStatement) {
            variables.push(node);
        }
        else {
            logger.debug(`Ts kind ${'SyntaxKind[node.kind]'} was not registered as a declaration.`);
            _a.parseForDeclarations(node.getChildren(), container);
        }
    });
    return container;
};
exports.default = DoxPackage;
//# sourceMappingURL=DoxPackage.js.map
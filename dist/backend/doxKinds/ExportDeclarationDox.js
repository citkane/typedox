"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const types_1 = require("../types");
const Dox_1 = __importDefault(require("../Dox"));
const ExportMemberDox_1 = __importDefault(require("./ExportMemberDox"));
class ExportDeclarationDox extends Dox_1.default {
    constructor(context, declaration) {
        super(context);
        this.kind = types_1.DoxKind.ExportDeclaration;
        this.parentFiles = [];
        this.membersMap = new Map();
        const { getNameSpace, getExportTargetFile } = ExportDeclarationDox;
        this.declaration = declaration;
        this.exportSourceFile = declaration.getSourceFile().fileName;
        this.moduleSymbol = this.getModuleSymbol();
        this.exportTargetFile = getExportTargetFile(this.moduleSymbol);
        this.nameSpace = getNameSpace(declaration);
        const { exportTargetFile, moduleType, sourceType } = this;
        const type = moduleType || sourceType;
        this.makeMembers(type);
        this.package.registerExportDeclaration(this);
        this.package.addEntryFile(exportTargetFile);
    }
    registerMember(member) {
        this.membersMap.set(member.name, member);
    }
    makeMembers(type) {
        const namedExport = this.namedExport;
        const context = Object.assign(Object.assign({}, this.context), { exportDeclaration: this });
        const members = !!namedExport
            ? namedExport.elements.map((specifier) => new ExportMemberDox_1.default(context, specifier, type))
            : type
                .getProperties()
                .map((symbol) => new ExportMemberDox_1.default(context, symbol));
    }
    get namedExport() {
        return this.declaration
            .getChildren()
            .find((node) => (0, typescript_1.isNamedExports)(node));
    }
    getModuleSymbol() {
        if (!('moduleSpecifier' in this.declaration))
            return undefined;
        const { checker } = this.context;
        const { moduleSpecifier } = this.declaration;
        return checker.getSymbolAtLocation(moduleSpecifier);
    }
    get moduleType() {
        const { checker } = this.context;
        const symbol = this.moduleSymbol;
        return symbol ? checker.getTypeOfSymbol(symbol) : undefined;
    }
    get sourceType() {
        const { checker } = this.context;
        const symbol = checker.getSymbolAtLocation(this.declaration.parent.getSourceFile());
        return checker.getTypeOfSymbol(symbol);
    }
}
ExportDeclarationDox.getExportTargetFile = (module) => {
    var _a;
    if (!module)
        return undefined;
    return (_a = module.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile().fileName;
};
ExportDeclarationDox.getNameSpace = (declaration) => {
    const node = declaration
        .getChildren()
        .find((node) => (0, typescript_1.isNamespaceExport)(node));
    return node === null || node === void 0 ? void 0 : node.name.getText();
};
exports.default = ExportDeclarationDox;
//# sourceMappingURL=ExportDeclarationDox.js.map
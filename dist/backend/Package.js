"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("./Dox"));
const DoxExport_1 = __importDefault(require("./DoxExport"));
class Package extends Dox_1.default {
    location;
    constructor(checker, program, entrySources) {
        super(checker, program);
        this.location = [Package.makeExportAlias(this.packageName)];
        this.parseEntrySources(entrySources);
    }
    parseEntrySources(sourceFiles, location = this.location) {
        sourceFiles.forEach((sourceFile) => {
            const exportDeclarations = Package.getExportDeclarations(sourceFile);
            exportDeclarations.forEach((exportDeclaration) => this.parseExportDeclaration(exportDeclaration, location));
        });
    }
    parseExportDeclaration(exportDeclaration, location) {
        const doxExport = new DoxExport_1.default(this.checker, this.program, exportDeclaration, location);
        if (doxExport.location.length) {
            console.log(Package.resolveLocation(doxExport.location));
        }
        const moreExportSources = doxExport.exportSources.map((source) => this.program.getSourceFile(source.filePath));
        this.parseEntrySources(moreExportSources, doxExport.location);
    }
    static getExportDeclarations(node, exportDeclarations = []) {
        node.forEachChild((childNode) => {
            if (childNode.kind === typescript_1.SyntaxKind.ExportDeclaration) {
                exportDeclarations.push(childNode);
            }
            if (childNode.getChildCount) {
                this.getExportDeclarations(childNode, exportDeclarations);
            }
        });
        return exportDeclarations;
    }
    get packageName() {
        return process.env.npm_package_name;
        /*
        this.getExportsFromSourcefile(sourceFile).forEach((exportSymbol) => {
          //console.log(exportSymbol["parent"]);
          //console.log(exportSymbol.valueDeclaration?.getSourceFile().fileName);
        });
        */
    }
}
exports.default = Package;
//# sourceMappingURL=Package.js.map
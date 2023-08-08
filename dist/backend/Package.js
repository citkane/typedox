"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const TypeDox_1 = __importDefault(require("./TypeDox"));
const DoxExport_1 = __importDefault(require("./DoxExport"));
class Package extends TypeDox_1.default {
    exportSymbols;
    exportDeclarations;
    constructor(checker, program, entrySources) {
        super(checker, program);
        this.parseExports(entrySources);
    }
    parseExports(sources, location) {
        sources.forEach((source) => {
            console.log(location);
            const doxExport = new DoxExport_1.default(this.checker, this.program, source, location || [this.packageName]);
            if (doxExport.location.length)
                console.log(doxExport.exportSources.length, doxExport.location.join("."));
            //this.parseExports(doxExport.exportSources, doxExport.location);
        });
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
    static isNodeExported(node) {
        return (((0, typescript_1.getCombinedModifierFlags)(node) & typescript_1.ModifierFlags.Export) !==
            0 ||
            (!!node.parent && node.parent.kind === typescript_1.SyntaxKind.SourceFile));
    }
}
exports.default = Package;
//# sourceMappingURL=Package.js.map
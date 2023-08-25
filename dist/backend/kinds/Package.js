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
const dox = __importStar(require("../typedox"));
class Package extends dox.lib.Dox {
    constructor(context, entryFileList) {
        super(context);
        this.name = 'todo';
        this.version = 'todo';
        this.kind = dox.Kind.Package;
        this.filesMap = new Map();
        this.addEntryFiles = (fileNames) => {
            fileNames = this.deDupeFilelist(fileNames);
            this.makeSourceFiles(fileNames);
        };
        this.deDupeFilelist = (fileList) => fileList
            .filter((value, index, array) => array.indexOf(value) === index)
            .filter((value) => !this.filesMap.has(value));
        super.package = this;
        this.addEntryFiles(entryFileList);
        this.filesMap.forEach((file) => file.triggerRelationships());
        const rootDeclarations = Package.getDeclarationRoots(this);
        const tree = new dox.tree.Root(rootDeclarations, this);
        dox.log.info(JSON.stringify(tree.toObject(), null, 4));
    }
    makeSourceFiles(fileList) {
        const context = Object.assign(Object.assign({}, this.context), { package: this });
        const { program } = context;
        fileList.forEach((fileName) => {
            if (this.filesMap.has(fileName))
                return;
            const fileSource = program.getSourceFile(fileName);
            if (!fileSource) {
                dox.log.warn('No source file was found:', fileName);
                return;
            }
            const sourceFile = new dox.SourceFile(context, fileSource);
            this.filesMap.set(fileName, sourceFile);
            this.addEntryFiles([...sourceFile.childFiles]);
        });
    }
}
_a = Package;
Package.getDeclarationRoots = (pack) => _a.getAllDeclarations(pack).filter((declaration) => !declaration.parents.length);
Package.getAllDeclarations = (pack) => [..._a.getAllFileSources(pack)]
    .map((fileSource) => [...fileSource.declarationsMap.values()])
    .flat();
Package.getAllFileSources = (pack) => pack.filesMap.values();
exports.default = Package;
//# sourceMappingURL=Package.js.map
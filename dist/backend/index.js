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
const dox = __importStar(require("./typedox"));
const log = dox.lib.Logger;
const DocumentsRoot = new dox.tree.treeRoot();
getDocumentPackageRoots()
    .map(makePackageConfigs)
    .map(makePackagePrograms)
    .map(auditPrograms)
    .map(makePackages)
    .map(makeReferences)
    .map(discoverReferenceFiles)
    .map(discoverReferenceDeclarations)
    .map(discoverDeclarationRelationships)
    .map(growBranches);
serialiseTree(DocumentsRoot);
function getDocumentPackageRoots() {
    return dox.Config.getNodePackages();
}
function makePackageConfigs(nodePackage) {
    const customOverrides = { options: { types: [] } };
    const { name, version, packageRoot } = nodePackage;
    const tsEntryRefs = dox.Config.getTsEntryRefs();
    const config = new dox.Config(tsEntryRefs, name, version, packageRoot, customOverrides);
    return config;
}
function makePackagePrograms(doxConfig) {
    doxConfig.referenceConfigs.forEach((config, name) => {
        config.options.types = [];
        const program = ts.createProgram(config.fileNames, config.options);
        doxConfig.programs.set(name, program);
    });
    return doxConfig;
}
function auditPrograms(doxConfig) {
    doxConfig.programs.forEach((program) => {
        const diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length) {
            diagnostics.forEach((diagnosis) => {
                log.warn(['index'], diagnosis.messageText);
                log.debug(diagnosis.relatedInformation);
            });
            log.throwError(['index'], 'TSC diagnostics failed.');
        }
    });
    return doxConfig;
}
function makePackages(doxConfig) {
    const doxPackage = new dox.Package(doxConfig);
    const treePackage = new dox.tree.treePackage(DocumentsRoot, doxPackage);
    DocumentsRoot.treePackages.set(treePackage.name, treePackage);
    return treePackage;
}
function makeReferences(treePackage) {
    const { doxPackage } = treePackage;
    const { doxConfig } = doxPackage;
    doxConfig.programs.forEach((program, key) => {
        const config = doxConfig.referenceConfigs.get(key);
        const doxContext = doxPackage.makeContext(key, program, config);
        const doxReference = new dox.Reference(doxContext, key, config.fileNames);
        doxPackage.references.set(key, doxReference);
        treePackage.treeReferences.set(key, new dox.tree.treeReference(doxReference));
    });
    return treePackage;
}
function discoverReferenceFiles(treePackage) {
    treePackage.treeReferences.forEach((treeReference) => treeReference.doxReference.discoverFiles());
    return treePackage;
}
function discoverReferenceDeclarations(treePackage) {
    treePackage.treeReferences.forEach((treeReference) => treeReference.doxReference.discoverDeclarations());
    return treePackage;
}
function discoverDeclarationRelationships(treePackage) {
    treePackage.treeReferences.forEach((treeReference) => treeReference.doxReference.discoverRelationships());
    return treePackage;
}
function growBranches(treePackage) {
    treePackage.treeReferences.forEach((treeReference, key) => {
        const sourceFiles = treeReference.doxReference.filesMap.values();
        const rootDeclarations = dox.Reference.getDeclarationRoots([
            ...sourceFiles,
        ]);
        treeReference.treeBranches.set(key, new dox.tree.Branch(rootDeclarations));
    });
}
function serialiseTree(root) {
    console
        .log();
}
/*
function makeTree(doxPackage: dox.Package) {
    const tree = new dox.tree.Root(doxPackage.declarationRoots, doxPackage);
    dox.lib.Logger.info(JSON.stringify(tree.toObject(), null, 4));
}
*/
//# sourceMappingURL=index.js.map
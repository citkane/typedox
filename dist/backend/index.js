#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedox_1 = require("./typedox");
main();
function main(customOptions) {
    if (typedox_1.logger.isClRequestForHelp())
        return;
    const doxProject = makeDoxProject(customOptions);
    const npmPackages = getNpmPackages(doxProject);
    const tsReferences = getTsReferences(npmPackages);
    discoverFilesAndDeclarations(tsReferences);
    buildRelationShips(tsReferences);
    growDocumentBranches(tsReferences);
    //log.inspect(doxProject.toObject);
}
exports.default = main;
function makeDoxProject(customOptions) {
    const projectOptions = typedox_1.config.getDoxOptions(customOptions);
    const doxProject = new typedox_1.DoxProject(projectOptions);
    typedox_1.logger.setLogLevel(doxProject.options.logLevel);
    return doxProject;
}
function getNpmPackages(doxProject) {
    return doxProject.npmPackages;
}
function getTsReferences(npmPackages) {
    return npmPackages.map((npmPackage) => npmPackage.tsReferences).flat();
}
function discoverFilesAndDeclarations(tsReferences) {
    tsReferences.forEach((tsReference) => {
        tsReference.discoverFiles();
        tsReference.discoverDeclarations();
    });
}
function buildRelationShips(tsReferences) {
    tsReferences.forEach((tsReference) => tsReference.buildRelationships());
}
function growDocumentBranches(tsReferences) {
    tsReferences.forEach((tsReference) => {
        const fileSources = getSourceFiles(tsReference);
        const rootDeclarations = typedox_1.TsReference.getDeclarationRoots(fileSources);
        const treeBranch = new typedox_1.Branch(tsReference, rootDeclarations);
        tsReference.treeBranches.set(tsReference.name, treeBranch);
    });
    function getSourceFiles(tsReference) {
        return [...tsReference.filesMap.values()];
    }
}
//# sourceMappingURL=index.js.map
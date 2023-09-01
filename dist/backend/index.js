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
const doxOptions = getDoxOptions();
const doxProject = bootStrapEnv(doxOptions);
const tsReferences = makeTsReferences(doxProject);
discoverFilesAndDeclarations(tsReferences);
buildRelationShips(tsReferences);
growDocumentBranches(tsReferences);
log.info(JSON.stringify(doxProject.toObject, null, 4));
function getDoxOptions() {
    return dox.doxOptionsStub;
}
function bootStrapEnv(doxOptions) {
    const doxProject = new dox.DoxProject(doxOptions);
    const { tsOverrides } = doxOptions;
    getNpmPackages()
        .map(makeProjectConfig)
        .map(registerTsProgramsToConfig)
        .map(diagnoseTsPrograms)
        .map(doxProject.makeNpmPackage)
        .forEach(doxProject.registerNpmPackage);
    return doxProject;
    function getNpmPackages() {
        return dox.npmPackagesStub;
    }
    function makeProjectConfig(npmPackageDef) {
        const { name, version, packageRootDir } = npmPackageDef;
        const tsEntryRefs = dox.config.PackageConfig.findTsEntryDefs();
        const config = new dox.config.PackageConfig(tsEntryRefs, name, version, packageRootDir, tsOverrides);
        return config;
    }
    function registerTsProgramsToConfig(packageConfig) {
        packageConfig.tsReferenceConfigs.forEach((config, name) => {
            const program = ts.createProgram(config.fileNames, config.options);
            packageConfig.tsPrograms.set(name, program);
        });
        return packageConfig;
    }
    function diagnoseTsPrograms(projectConfig) {
        projectConfig.tsPrograms.forEach((program) => {
            const diagnostics = ts.getPreEmitDiagnostics(program);
            if (diagnostics.length) {
                diagnostics.forEach((diagnosis) => {
                    log.warn(['index'], diagnosis.messageText);
                    log.debug(diagnosis.relatedInformation);
                });
                log.throwError(['index'], 'TSC diagnostics failed.');
            }
        });
        return projectConfig;
    }
}
function makeTsReferences(doxProject) {
    return [...(doxProject.npmPackages.values() || [])]
        .map(dox.NpmPackage.makeTsReferences)
        .flat()
        .map(registerReference);
    function registerReference(tsReference) {
        tsReference.parent.registerTsReference(tsReference);
        return tsReference;
    }
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
        const rootDeclarations = dox.TsReference.getDeclarationRoots(fileSources);
        const treeBranch = new dox.Branch(tsReference, rootDeclarations);
        tsReference.treeBranches.set(tsReference.name, treeBranch);
    });
    function getSourceFiles(tsReference) {
        return [...tsReference.filesMap.values()];
    }
}
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProjectConfig_1 = require("./config/ProjectConfig");
const typedox_1 = require("./typedox");
main(typedox_1.logger.isRequestForHelp());
function main(helpRequest) {
    if (helpRequest)
        return typedox_1.logger.logApplicationHelp();
    const projectConfig = configureProject();
    const packageConfigs = configurePackages(projectConfig);
}
/*
const doxProject = bootStrapEnv(doxOptions);

const tsReferences = makeTsReferences(doxProject);

discoverFilesAndDeclarations(tsReferences);
buildRelationShips(tsReferences);
growDocumentBranches(tsReferences);
*/
//projectLogger.info(JSON.stringify(doxProject.toObject, null, 4));
function configureProject() {
    const projectOptions = typedox_1.config.getDoxOptions(typedox_1.config.confApi);
    const tscCommandlineOptions = typedox_1.config.getTscClOptions(projectOptions);
    const projectConfig = new ProjectConfig_1.ProjectConfig(projectOptions, tscCommandlineOptions);
    typedox_1.config.auditOptions.call(projectConfig);
    typedox_1.logger.setLogLevel(projectConfig.logLevel);
    return projectConfig;
}
function configurePackages(projectConfig) {
    const { initTsconfigPathToConfig, discoverTscRawConfigs, discoverNpmPackages, registerNpmPackageDefs, } = typedox_1.config;
    const { tsConfigs } = projectConfig;
    const filenamesToConfigs = initTsconfigPathToConfig.bind(projectConfig);
    const discoverConfigs = discoverTscRawConfigs.bind(projectConfig);
    const discoverPackages = discoverNpmPackages.bind(projectConfig);
    const registerPackages = registerNpmPackageDefs.bind(projectConfig);
    const initialTscConfigs = tsConfigs.map(filenamesToConfigs);
    const tscConfigs = discoverConfigs(initialTscConfigs);
    const npmPackageDefs = discoverPackages(tscConfigs);
    const doxPackageConfigs = registerPackages(npmPackageDefs);
    typedox_1.logger.inspect(doxPackageConfigs);
}
/*
function bootStrapEnv(projectConfig: dox.config.ProjectConfig) {
    const doxProject = new dox.DoxProject(projectConfig);

    getNpmPackages()
        .map(makeProjectConfig)
        .map(registerTscProgramsToConfig)
        .map(diagnoseTsPrograms)
        .map(doxProject.makeNpmPackage)
        .forEach(doxProject.registerNpmPackage);

    return doxProject;

    function getNpmPackages() {
        return dox.npmPackagesStub;
    }
    function makeProjectConfig(npmPackageDef: dox.npmPackageDef) {
        const { name, version, packageRootDir } = npmPackageDef;
        const tsEntryRefs = dox.config.PackageConfig.findTsEntryDefs();
        const config = new dox.config.PackageConfig(
            tsEntryRefs,
            name,
            version,
            packageRootDir,
            options,
        );
        return config;
    }
    function registerTscProgramsToConfig(
        packageConfig: dox.config.PackageConfig,
    ) {
        packageConfig.tscReferenceConfigs.forEach((tscConfig, name) => {
            const tscProgram = ts.createProgram(
                tscConfig.fileNames,
                tscConfig.options,
            );
            packageConfig.tscPrograms.set(name, tscProgram);
        });
        return packageConfig;
    }
    function diagnoseTsPrograms(packageConfig: dox.config.PackageConfig) {
        packageConfig.tscPrograms.forEach((tscProgram) => {
            const diagnostics = ts.getPreEmitDiagnostics(tscProgram);
            if (diagnostics.length) {
                diagnostics.forEach((diagnosis) => {
                    log.warn(['index'], diagnosis.messageText);
                    if (diagnosis.relatedInformation)
                        log.debug(diagnosis.relatedInformation);
                });
                log.throwError(['index'], 'TSC diagnostics failed.');
            }
        });
        return packageConfig;
    }
}

function makeTsReferences(doxProject: dox.DoxProject) {
    return [...(doxProject.npmPackages.values() || [])]
        .map(dox.NpmPackage.makeTsReferences)
        .flat()
        .map(registerReference);

    function registerReference(tsReference: dox.TsReference) {
        tsReference.parent.registerTsReference(tsReference);
        return tsReference;
    }
}
function discoverFilesAndDeclarations(tsReferences: dox.TsReference[]) {
    tsReferences.forEach((tsReference) => {
        tsReference.discoverFiles();
        tsReference.discoverDeclarations();
    });
}
function buildRelationShips(tsReferences: dox.TsReference[]) {
    tsReferences.forEach((tsReference) => tsReference.buildRelationships());
}
function growDocumentBranches(tsReferences: dox.TsReference[]) {
    tsReferences.forEach((tsReference) => {
        const fileSources = getSourceFiles(tsReference);
        const rootDeclarations =
            dox.TsReference.getDeclarationRoots(fileSources);
        const treeBranch = new dox.Branch(tsReference, rootDeclarations);
        tsReference.treeBranches.set(tsReference.name, treeBranch);
    });

    function getSourceFiles(tsReference: dox.TsReference) {
        return [...tsReference.filesMap.values()];
    }
}
*/
//# sourceMappingURL=index.js.map
import * as ts from 'typescript';
import * as dox from './typedox';

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

function makePackageConfigs(nodePackage: dox.nodePackage) {
	const customOverrides = { options: { types: [] } };
	const { name, version, packageRoot } = nodePackage;
	const tsEntryRefs = dox.Config.getTsEntryRefs();
	const config = new dox.Config(
		tsEntryRefs,
		name,
		version,
		packageRoot,
		customOverrides,
	);
	return config;
}
function makePackagePrograms(doxConfig: dox.Config) {
	doxConfig.referenceConfigs.forEach((config, name) => {
		config.options.types = [];
		const program = ts.createProgram(config.fileNames, config.options);
		doxConfig.programs.set(name, program);
	});
	return doxConfig;
}
function auditPrograms(doxConfig: dox.Config) {
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
function makePackages(doxConfig: dox.Config) {
	const doxPackage = new dox.Package(doxConfig);
	const treePackage = new dox.tree.treePackage(DocumentsRoot, doxPackage);
	DocumentsRoot.treePackages.set(treePackage.name, treePackage);
	return treePackage;
}
function makeReferences(treePackage: dox.tree.treePackage) {
	const { doxPackage } = treePackage;
	const { doxConfig } = doxPackage;
	doxConfig.programs.forEach((program, key) => {
		const config = doxConfig.referenceConfigs.get(key)!;
		const doxContext = doxPackage.makeContext(key, program, config);
		const doxReference = new dox.Reference(
			doxContext,
			key,
			config.fileNames,
		);
		doxPackage.references.set(key, doxReference);
		treePackage.treeReferences.set(
			key,
			new dox.tree.treeReference(doxReference),
		);
	});
	return treePackage;
}
function discoverReferenceFiles(treePackage: dox.tree.treePackage) {
	treePackage.treeReferences.forEach((treeReference) =>
		treeReference.doxReference.discoverFiles(),
	);
	return treePackage;
}
function discoverReferenceDeclarations(treePackage: dox.tree.treePackage) {
	treePackage.treeReferences.forEach((treeReference) =>
		treeReference.doxReference.discoverDeclarations(),
	);
	return treePackage;
}
function discoverDeclarationRelationships(treePackage: dox.tree.treePackage) {
	treePackage.treeReferences.forEach((treeReference) =>
		treeReference.doxReference.discoverRelationships(),
	);
	return treePackage;
}
function growBranches(treePackage: dox.tree.treePackage) {
	treePackage.treeReferences.forEach((treeReference, key) => {
		const sourceFiles = treeReference.doxReference.filesMap.values();
		const rootDeclarations = dox.Reference.getDeclarationRoots([
			...sourceFiles,
		]);
		treeReference.treeBranches.set(
			key,
			new dox.tree.Branch(rootDeclarations),
		);
	});
}
function serialiseTree(root: dox.tree.treeRoot) {
	console
		.log
		//root.treePackages.get('typedox')?.treeReferences.get('namespace'),
		();
}
/*
function makeTree(doxPackage: dox.Package) {
	const tree = new dox.tree.Root(doxPackage.declarationRoots, doxPackage);
	dox.lib.Logger.info(JSON.stringify(tree.toObject(), null, 4));
}
*/

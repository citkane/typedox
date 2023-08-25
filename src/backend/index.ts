import * as ts from 'typescript';
import * as path from 'path';
import * as dox from './typedox';

//const inputFile = 'test/scenarios/locals/index.ts';
//const configFolder = 'test/scenarios/locals';

const inputFile = 'test/scenarios/namespace/index.ts';
const configFolder = 'test/scenarios/namespace';

//const inputFile = 'src/frontend/index.ts';
//const configFolder = 'src';

const projectRoot = path.join(__dirname, '../../');
const configDir = path.join(projectRoot, configFolder);
const inputPath = path.join(projectRoot, inputFile);
const configFile = ts.findConfigFile(configDir, ts.sys.fileExists);

if (configFile) parseConfig(configFile, path.dirname(configFile));

function parseConfig(configFile: string, baseDir: string) {
	const config = dox.lib.loadConfigFromFile(configFile, baseDir);

	config.options.types = [];
	//config.options.noLib = true;

	config.projectReferences?.forEach((reference) => {
		if (reference.originalPath === './src/tsconfig.frontend.json')
			parseConfig(reference.path, path.dirname(reference.path));
	});

	if (!config.fileNames.length) return;

	const program = ts.createProgram(config.fileNames, config.options);
	const diagnostics = ts.getPreEmitDiagnostics(program);

	diagnostics.forEach((diagnosis) => {
		dox.log.error(diagnosis.messageText);
	});

	const checker = program.getTypeChecker();
	const id = new dox.lib.Id();
	const context = new dox.lib.Context(
		checker,
		program,
		config,
		id,
		undefined as unknown as dox.Package,
	);
	// new DoxPackage(context, config.fileNames);
	new dox.Package(context, [inputPath]);
	/*
  
  const program = ts.createProgram([inputFilename],);
  const entrySourceFile = program.getSourceFile(inputFilename);
  const checker = program.getTypeChecker();
  const doxContext = new DoxContext(checker, program);
  
  new DoxPackage(doxContext, [entrySourceFile]);
  */
}

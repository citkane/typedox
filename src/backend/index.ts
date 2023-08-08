import * as ts from "typescript";
//import * as tsdoc from "@microsoft/tsdoc";
import * as path from "path";
import * as model from "@microsoft/api-extractor-model";
import Package from "./Package";

const projectRoot = path.join(__dirname, "../../");
const inputFilename = path.join(projectRoot, "src/frontend/index.ts");

const program = ts.createProgram([inputFilename], {
  target: ts.ScriptTarget.ES2016,
  module: ts.ModuleKind.ES2015,
  noLib: true,
  types: [],
});
const entrySourceFile = program.getSourceFile(inputFilename);
const checker = program.getTypeChecker();

//new Package(checker, program, [...program.getSourceFiles()]);
new Package(checker, program, [entrySourceFile]);

//const entrySymbol = checker.getSymbolAtLocation(entrySourceFile);

//console.log(entrySymbol["documentationComment"]);
//console.log(entrySymbol.getDocumentationComment(checker));

/*
program.getSourceFiles().forEach((sourceFile) => {
  if (sourceFile.isDeclarationFile) return;
  console.log(sourceFile.fileName);
  ts.forEachChild(sourceFile, visit);
});
*/

//ts.forEachChild(entrySourceFile, visit);
/*
checker.getExportsOfModule(entrySymbol).forEach((exportSymbol) => {
  //console.log(exportSymbol);
});

function getExportsFromSourcefile(sourceFile: ts.SourceFile) {
  const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
  return checker.getExportsOfModule(sourceSymbol);
}

function visit(node: ts.Node) {
  if (!isNodeExported(node)) return;

  if (ts.isClassDeclaration(node) && node.name) {
    const classSymbol = checker.getSymbolAtLocation(node.name);
    const type = checker.getTypeOfSymbolAtLocation(
      classSymbol,
      classSymbol.valueDeclaration
    );
    // console.log(checker.typeToString(type));
    type.getConstructSignatures().map((signature) => {
      //console.log(signature.getParameters());
    });

    const docText = classSymbol.getDocumentationComment(checker);
    console.log(docText);
    //console.log(classSymbol.getName(), checker.typeToString(type));
  }
  if (ts.isExportDeclaration) {
    const exportSymbol = checker.getSymbolAtLocation(node.parent);
    console.log(exportSymbol);
  }
}

function isNodeExported(node: ts.Node) {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) &
      ts.ModifierFlags.Export) !==
      0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}
*/

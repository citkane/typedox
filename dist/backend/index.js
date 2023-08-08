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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
//import * as tsdoc from "@microsoft/tsdoc";
const path = __importStar(require("path"));
const Package_1 = __importDefault(require("./Package"));
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
new Package_1.default(checker, program, [entrySourceFile]);
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
//# sourceMappingURL=index.js.map
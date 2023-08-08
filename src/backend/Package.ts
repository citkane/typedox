import {
  TypeChecker,
  SourceFile,
  Symbol,
  SyntaxKind,
  SymbolFlags,
  Node,
  isClassDeclaration,
  isExportSpecifier,
  Declaration,
  ModifierFlags,
  getCombinedModifierFlags,
  NodeFlags,
  ExportSpecifier,
  NamespaceExport,
  Identifier,
  getOriginalNode,
  getLeadingCommentRanges,
  Program,
  ExportDeclaration,
  NamedExports,
  StringLiteral,
} from "typescript";
import * as path from "path";
import * as fs from "fs-extra";
import TypeDox from "./TypeDox";
import DoxExport from "./DoxExport";

export default class Package extends TypeDox {
  exportSymbols: Symbol[];
  exportDeclarations: Node[];
  constructor(
    checker: TypeChecker,
    program: Program,
    entrySources: readonly SourceFile[]
  ) {
    super(checker, program);
    this.parseExports(entrySources);
  }
  parseExports(sources: readonly SourceFile[], location?: string[]) {
    sources.forEach((source) => {
      console.log(location);
      const doxExport = new DoxExport(
        this.checker,
        this.program,
        source,
        location || [this.packageName]
      );
      if (doxExport.location.length)
        console.log(
          doxExport.exportSources.length,
          doxExport.location.join(".")
        );
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

  static isNodeExported(node: Node) {
    return (
      (getCombinedModifierFlags(node as Declaration) & ModifierFlags.Export) !==
        0 ||
      (!!node.parent && node.parent.kind === SyntaxKind.SourceFile)
    );
  }
}

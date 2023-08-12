import {
  ExportDeclaration,
  isNamedExports,
  isNamespaceExport,
  NamedExports,
  NamespaceExport,
  Symbol,
  Type,
} from "typescript";
import { DoxKind, memberMap } from "../types";

import Dox from "../Dox";
import DoxContext from "../DoxContext";
import ExportMemberDox from "./ExportMemberDox";

export default class ExportDeclarationDox extends Dox {
  kind = DoxKind.ExportDeclaration;
  private declaration: ExportDeclaration;

  nameSpace: string;
  exportSourceFile: string;
  exportTargetFile: string;
  members: memberMap = new Map();

  constructor(context: DoxContext, declaration: ExportDeclaration) {
    super(context);

    const { getNameSpace, getFileName, getExportTargetFile } =
      ExportDeclarationDox;

    this.declaration = declaration;
    this.exportSourceFile = getFileName(declaration);
    this.exportTargetFile = getExportTargetFile(
      this.moduleSymbol,
      this.exportSourceFile
    );
    this.nameSpace = getNameSpace(declaration);
    const { exportTargetFile, moduleType, sourceType } = this;
    const type = moduleType || sourceType;

    this.registerMembersToSelf(type);
    this.registerSelfToPackage();
    this.package?.addEntryFile(exportTargetFile);
  }

  private get namedExport() {
    return this.declaration
      .getChildren()
      .find((node) => isNamedExports(node)) as NamedExports;
  }
  private get moduleSymbol() {
    const { checker } = this.context;
    const { moduleSpecifier } = this.declaration;
    return !!moduleSpecifier
      ? checker.getSymbolAtLocation(moduleSpecifier)
      : undefined;
  }
  private get moduleType() {
    const { checker } = this.context;
    const symbol = this.moduleSymbol;
    return symbol ? checker.getTypeOfSymbol(symbol) : undefined;
  }
  private get sourceType() {
    const { checker } = this.context;
    const symbol = checker.getSymbolAtLocation(
      this.declaration.parent.getSourceFile()
    );
    return checker.getTypeOfSymbol(symbol);
  }
  private registerSelfToPackage() {
    const map = this.package.declarationsMap.get(this.exportSourceFile).exports;
    map.set(this.id, this);
  }
  private registerMembersToSelf(type: Type) {
    const namedExport = this.namedExport;
    const context = { ...this.context, exportDeclaration: this };
    const members = !!namedExport
      ? namedExport.elements.map(
          (specifier) => new ExportMemberDox(context, specifier, type)
        )
      : type
          .getProperties()
          .map((symbol) => new ExportMemberDox(context, symbol));
  }

  private static getExportTargetFile = (module: Symbol, sourceFile: string) => {
    return !!module
      ? module.valueDeclaration.getSourceFile().fileName
      : sourceFile;
  };
  private static getFileName = (declaration: ExportDeclaration) => {
    return declaration.getSourceFile().fileName;
  };

  private static getNameSpace = (declaration: ExportDeclaration) => {
    const node = declaration
      .getChildren()
      .find((node) => isNamespaceExport(node)) as NamespaceExport;
    return node?.name.getText();
  };
}

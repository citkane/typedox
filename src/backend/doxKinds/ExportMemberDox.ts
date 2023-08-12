import { ExportSpecifier, Symbol, SyntaxKind, Type } from "typescript";
import Dox from "../Dox";
import DoxContext from "../DoxContext";
import { DoxKind } from "../types";

export default class ExportMemberDox extends Dox {
  private value: ExportSpecifier | Symbol;
  kind = DoxKind.ExportMember;
  name: string;
  alias: string;
  symbol: Symbol;
  constructor(
    context: DoxContext,
    value: ExportSpecifier | Symbol,
    type?: Type
  ) {
    super(context);

    this.value = value;
    const { getNames, getSymbol } = ExportMemberDox;

    switch (this.isExportSpecifier) {
      case true:
        const specifier = value as ExportSpecifier;
        const { name, alias } = getNames(specifier);
        this.name = name;
        this.alias = alias;
        this.symbol = getSymbol(this.name, this.alias, type);
        break;
      case false:
        const symbol = value as Symbol;
        this.name = symbol.getName();
        this.alias = undefined;
        this.symbol = symbol;
        break;
    }
    this.exportDeclaration.members.set(this.id, this);
  }

  private get isExportSpecifier() {
    return (
      Object.hasOwn(this.value, "kind") &&
      (this.value as ExportSpecifier).kind === SyntaxKind.ExportSpecifier
    );
  }
  private static getSymbol(name: string, alias: string, type: Type) {
    let symbol = type?.getProperty(name);
    symbol = !!symbol ? symbol : type?.getProperty(alias);
    return symbol;
  }
  private static getNames(specifier: ExportSpecifier) {
    const name = specifier.getFirstToken().getText();
    const nameAlias = specifier.getLastToken().getText();
    return {
      name,
      alias: nameAlias === name ? undefined : nameAlias,
    };
  }
}

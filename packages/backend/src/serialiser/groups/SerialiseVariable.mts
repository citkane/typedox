import ts from 'typescript';
import { DoxDeclaration, log as log } from '../../typedox.mjs';
import { Serialised } from '../Serialised.mjs';

export class SerialiseVariable extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);

		const { initializer, expression } = this.valueNode as any;
		const valueString = initializer
			? (initializer as ts.Node).getText()
			: expression
			? (expression as ts.Node).getText()
			: this.valueNode.getText();

		this.serialised.valueString = valueString;
	}
}

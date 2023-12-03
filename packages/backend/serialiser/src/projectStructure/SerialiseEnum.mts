import ts from 'typescript';
import { DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';

export class SerialiseEnum extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);
		//events.emit('serialiser.declaration.serialised', this.serialised);
	}
}

import { DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';

export class SerialiseFunction extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);
		//events.emit('serialiser.declaration.serialised', this.serialised);
	}
}

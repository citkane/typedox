import { DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';

export class SerialiseExport extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);
		//events.emit('serialiser.declaration.serialised', this.serialised);
	}
}

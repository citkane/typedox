import { DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';
import { events } from '../index.mjs';

export class SerialiseClass extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);
		events.emit('serialiser.declaration.serialised', this.serialised);
	}
}

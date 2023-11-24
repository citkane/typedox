import { CategoryKind, DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';
import { events } from '../index.mjs';
import { log } from '@typedox/logger';

export class SerialiseNamespace extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);

		events.emit('serialiser.declaration.serialised', this.serialised);
	}
}

import ts from 'typescript';
import { DoxDeclaration } from '@typedox/core';
import { Serialised } from '../Serialised.mjs';
import { log } from '@typedox/logger';

export class SerialiseNamespace extends Serialised {
	constructor(declaration: DoxDeclaration) {
		super(declaration);

		log.info(declaration);
	}
}

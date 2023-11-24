import { CategoryKind, config } from '@typedox/core';
import { log } from '@typedox/logger';
import {
	events,
	PackageMenu,
	SerialiseVariable,
	SerialiseClass,
	SerialiseEnum,
	SerialiseType,
	SerialiseFunction,
	SerialiseExport,
	SerialiseNamespace,
} from './index.mjs';

const __filename = log.getFilename(import.meta.url);

export class Serialiser {
	constructor(options: config.coreDoxOptions) {
		log.info(log.identifier(this), 'Serialiser is listening', '\n');

		new PackageMenu();

		const { Variable, Class, Enum, Type, Function, Export, Namespace } =
			CategoryKind;
		events.on('core.declaration.related', (declaration) => {
			switch (declaration.category) {
				case Variable:
					new SerialiseVariable(declaration);
					break;
				case Class:
					new SerialiseClass(declaration);
					break;
				case Enum:
					new SerialiseEnum(declaration);
					break;
				case Type:
					new SerialiseType(declaration);
					break;
				case Function:
					new SerialiseFunction(declaration);
					break;
				case Export:
					new SerialiseExport(declaration);
					break;
				case Namespace:
					new SerialiseNamespace(declaration);
					break;
			}
		});

		/*
		events.once('main.built.project', (project) => {
			const serialisedProject = serialiseProject(project);
			const menu = serialisePackageMenu(serialisedProject.packages);
			events.emit('serialiser.packageMenu.serialised', menu);
		});
		*/
	}
}

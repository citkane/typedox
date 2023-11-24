import ts from 'typescript';
import { DoxDeclaration } from '../index.mjs';
import { Declare } from './Declare.mjs';
import { Relate } from './Relate.mjs';
import { log, logLevels, loggerUtils } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';

export const notices = {
	parse: {
		debug: function (this: Relate | Declare, fncName: string) {
			const { wrappedItem } = this.declaration;
			const { nodeText, nodeDeclarationText } = wrappedItem;
			log.debug(
				log.identifier(this),
				`[${fncName}]`,
				`[${log.toLine(nodeText, 40)}]`,
				log.toLine(nodeDeclarationText, 110),
			);
		},
	},
	throw:
		/* istanbul ignore next: soft error for debugging */
		function (
			this: Relate | Declare,
			wrapped: TsWrapper,
			fileName?: string,
		) {
			this.declaration.errored();
			const message = fileName
				? `Could not get a ts.Symbol for: ${fileName}`
				: `Could not get a target fileName.`;
			log.throwError(
				log.identifier(this),
				`[${wrapped.kindString}]`,
				message,
				wrapped.report,
			);
		},
	report:
		/* istanbul ignore next: soft error for debugging */
		function (
			this: DoxDeclaration,
			wrapped: TsWrapper,
			route: string,
			local: boolean,
			fileName: string,
		) {
			const errorMessage = `Did not ${route} a ${
				local ? 'localTargetNode' : 'node'
			} relationship`;
			deepReport.call(
				this,
				fileName,
				'error',
				errorMessage,
				wrapped,
				local,
			);
		},
	categoryKind: function (
		tsKind: ts.SyntaxKind,
		wrapped: TsWrapper,
		fileName: string,
	) {
		log.error(
			log.identifier(fileName),
			'Did not discover a category kind:',
			ts.SyntaxKind[tsKind],
			wrapped.error,
		);
	},
};

/* istanbul ignore next: soft error for debugging */
function deepReport(
	this: DoxDeclaration,
	location: string,
	logLevel: Exclude<keyof typeof logLevels, 'silent'>,
	message: string,
	wrapped: TsWrapper,
	isLocalTarget: boolean,
) {
	log[logLevel](log.identifier(location), message, {
		filename: this.wrappedItem.fileName,
		sourceReport: this.wrappedItem.report,
		sourceDeclaration: loggerUtils.shortenString(
			this.wrappedItem.nodeDeclarationText,
			80,
		),

		targetReport: isLocalTarget ? wrapped.report : undefined,
		targetDeclaration: isLocalTarget
			? wrapped.nodeDeclarationText
			: undefined,
	});
}
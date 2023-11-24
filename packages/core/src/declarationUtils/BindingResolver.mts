import { TsWrapper } from '@typedox/wrapper';
import ts from 'typescript';

export class BindingResolver {
	public kind: ts.SyntaxKind = ts.SyntaxKind.Unknown;
	public declarationNode: ts.VariableDeclaration | ts.ParameterDeclaration;
	public nodes = [] as ts.Node[];

	private checker: ts.TypeChecker;
	private bindingElement: ts.BindingElement;
	private bindingName: string;
	private bindingType: ts.Type;

	constructor(checker: ts.TypeChecker, wrapped: TsWrapper) {
		const { tsNode } = wrapped;
		const { getBindingName } = BindingResolver;
		this.checker = checker;
		this.bindingElement = tsNode as ts.BindingElement;
		this.bindingName = getBindingName(this.bindingElement);
		this.bindingType = checker.getTypeAtLocation(
			this.bindingElement.parent,
		);
		this.declarationNode = ts.walkUpBindingElementsAndPatterns(
			this.bindingElement,
		);
		if (this.isAny) {
			this.kind = ts.SyntaxKind.VariableDeclaration;
			this.nodes.push(
				this.getTargetNode(this.declarationNode.initializer!),
			);
			return;
		}
		this.isObject && this.parseObject();
		this.isArray && this.parseArray();
	}

	private parseObject = () => {
		this.kind = ts.SyntaxKind.ObjectLiteralExpression;
		const {
			bindingName,
			bindingType,
			nodes,
			bindingElement,
			getTargetNode,
		} = this;
		const { getExcludedBindingNames } = BindingResolver;

		if (!this.bindingElement.dotDotDotToken) {
			const property = bindingType.getProperty(bindingName)!;
			const bindingTarget = getTargetNode(property.valueDeclaration!);
			this.kind = bindingTarget.kind;

			nodes.push(bindingTarget);
		} else {
			const excludedNames = getExcludedBindingNames(bindingElement);
			bindingType.getProperties().forEach((property) => {
				if (excludedNames.includes(property.name)) return;
				const bindingTarget = getTargetNode(property.valueDeclaration!);

				nodes.push(bindingTarget);
			});
		}
	};
	private parseArray = () => {
		this.kind = ts.SyntaxKind.ArrayLiteralExpression;
		const {
			declarationNode,
			bindingElement,
			nodes: nodes,
			getInitializer,
			getTargetNode,
		} = this;
		const { initializer } = declarationNode;
		const targetArray = getInitializer(initializer!);

		if (!bindingElement.dotDotDotToken) {
			const i = bindingElement.parent.elements.indexOf(bindingElement);
			const bindingTarget = getTargetNode(targetArray.elements[i]);
			this.kind = bindingTarget.kind;

			nodes.push(bindingTarget);
		} else if (ts.isArrayLiteralExpression(targetArray)) {
			const { getExcludedBindingNames } = BindingResolver;
			const excludedNames = getExcludedBindingNames(bindingElement);
			const startIndex = excludedNames.length;
			targetArray.elements.slice(startIndex).forEach((node) => {
				const bindingTarget = getTargetNode(node);

				nodes.push(bindingTarget);
			});
		}
	};

	private get isObject() {
		return ts.isObjectBindingPattern(this.bindingElement.parent);
	}
	private get isArray() {
		return ts.isArrayBindingPattern(this.bindingElement.parent);
	}
	private get isAny() {
		return (
			this.bindingType.flags === ts.TypeFlags.Any &&
			!!this.declarationNode.initializer
		);
	}
	private getInitializer = (
		initializer: ts.Node,
	): ts.ArrayLiteralExpression => {
		if (ts.isArrayLiteralExpression(initializer!)) return initializer;

		const declaration = this.checker.getSymbolAtLocation(initializer!)
			?.valueDeclaration! as ts.VariableDeclaration;

		return declaration.initializer! as ts.ArrayLiteralExpression;
	};
	private getTargetNode = (node: ts.Node): ts.Node => {
		if (ts.isPropertyAssignment(node) || ts.isPropertyDeclaration(node)) {
			node = node.initializer!;
		}
		let symbol: ts.Symbol | undefined;
		try {
			symbol = this.checker.getSymbolAtLocation(node);
		} catch (error) {}

		return symbol?.valueDeclaration
			? this.getTargetNode(symbol?.valueDeclaration)
			: node;
	};
	private static getBindingName(bindingElement: ts.BindingElement) {
		const { getNameString } = BindingResolver;
		const bindingAlias = getNameString(bindingElement.propertyName);
		return bindingAlias || getNameString(bindingElement.name)!;
	}
	private static getExcludedBindingNames(bindingElement: ts.BindingElement) {
		const { getBindingName } = BindingResolver;
		const elements = (bindingElement.parent as any)
			.elements as ts.BindingElement[];
		const excludedNames = elements.reduce((accumulator, bindingElement) => {
			if (bindingElement.dotDotDotToken) return accumulator;
			accumulator.push(getBindingName(bindingElement));
			return accumulator;
		}, [] as string[]);
		return excludedNames;
	}
	private static getNameString = (
		name: ts.PropertyName | ts.BindingName | undefined,
	): string | undefined => {
		if (!name) return undefined;
		return (ts as any).getNameFromPropertyName(name);
	};
}

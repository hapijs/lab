declare const add: {
	(a: string, b: string): string;
	(a: number, b: number): number;
};

export default add;

export const sample: { readonly x: string };

export function hasProperty(property: { name: string }): boolean;

export interface UsesExactOptionalPropertyTypes {
	a?: boolean | undefined;
	b?: string;
}

export interface UncheckedIndexedAccess {
	a: UsesExactOptionalPropertyTypes;

	[prop: string]: UsesExactOptionalPropertyTypes;
}

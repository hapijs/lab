declare const add: {
	(a: string, b: string): Promise<string>;
	(a: number, b: number): Promise<number>;
};

export default add;

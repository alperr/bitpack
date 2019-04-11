declare namespace bitpack
{
	export function read(target: Uint8Array, offset: number, bitsize: number): void;
	export function write(target: Uint8Array, value: number, offset: number, bitsize: number): void;
}

declare class bitstream
{
	constructor(target: Uint8Array);
	read(bitsize: number): number;
	write(value: number, bitsize: number);
	readCursor: number;
	writeCursor: number;
}

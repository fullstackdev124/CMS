/* CONDITIONS */
export const equal = (param: string, value: string | number) => {
	return `[${param}]=${value}`;
}
export const notEqual = (param: string, value: string | number) => {
	return `[${param}][neq]=${value}`;
}
export const greaterThan = (param: string, value: string | number) => {
	return `[${param}][gt]=${value}`;
}
export const greaterEqualThan = (param: string, value: string | number) => {
	return `[${param}][gte]=${value}`;
}
export const lessThan = (param: string, value: string | number) => {
	return `[${param}][lt]=${value}`;
}
export const lessEqualThan = (param: string, value: string | number) => {
	return `[${param}][lte]=${value}`;
}
export const isInArray = (param: string, value: string | number) => {
	return `[${param}][inq]=${value}`;
}
export const matchRegexp = (param: string, expression: string | number) => {
	return `[${param}][regexp]=${expression}`;
}

/* OPERATORS */
export const or = (...conditions: string[]) => {
	let r = '';
	conditions.forEach((c, i) => r += `filter[where][or][${i}]${c}&`);
	return r.slice(12, -1);
}
export const and = (...conditions: string[]) => {
	let r = '';
	conditions.forEach((c, i) => r += `filter[where][and][${i}]${c}&`);
	return r.slice(12, -1);
}
export const between = (param: string, v1: string | number, v2: string | number) => {
	return `[${param}][between][0]=${v1}&filter[where][${param}][between][1]=${v2}&`;
}

export class ApiFilter {

	private string = '?';

	constructor() {}

	public where(...conditions: string[]) {
		conditions.forEach(c => {
			this.string += `filter[where]${c}&`;
		});
	}

	public skip(val: number) {
		this.string += `filter[skip]=${val}&`;
	}

	public limit(val: number) {
		this.string += `filter[limit]=${val}&`;
	}

	public includeRelated(relatedModel: string, propertyName: string) {
		this.string += `filter[include][${relatedModel}]=${propertyName}`;
	}

	public excludeFields(fields: string[]) {
		fields.forEach(f => {
			this.string += `filter[fields][${f}]=false&`;
		});
	}

	public get encoded(): string {
		return encodeURI(this.string);
	};
}
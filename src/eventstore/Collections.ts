export interface IDictionary<T> {
	add(key: string, value: T): void;
	remove(key: string): void;
	containsKey(key: string): boolean;
	keys(): string[];
	values(): T[];
	getValue(key: string): T;
}

export class Dictionary<T> {

	_keys: string[] = new Array<string>();
	_values: T[] = new Array<T>();

	constructor(init: { key: string; value: T; }[] = new Array<{ key: string, value: T }>()) {

		if (init) {
			for (var x = 0; x < init.length; x++) {
				this.add(init[x].key, init[x].value);
			}
		}
	}

	add(key: string, value: T) {
		this[key] = value;
		this._keys.push(key);
		this._values.push(value);
	}

	remove(key: string) {
		var index = this._keys.indexOf(key, 0);
		this._keys.splice(index, 1);
		this._values.splice(index, 1);

		delete this[key];
	}

	getValue(key: string): T {
		return this[key];
	}

	keys(): string[] {
		return this._keys;
	}

	values(): T[] {
		return this._values;
	}

	containsKey(key: string) {
		if (typeof this[key] === "undefined") {
			return false;
		}

		return true;
	}

	toLookup(): IDictionary<T> {
		return this;
	}
}

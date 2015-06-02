export interface IDictionary<T> {
    add(key: string, value: T): void;
    remove(key: string): void;
    containsKey(key: string): boolean;
    keys(): string[];
    values(): T[];
    getValue(key: string): T;
}
export declare class Dictionary<T> {
    _keys: string[];
    _values: T[];
    constructor(init?: {
        key: string;
        value: T;
    }[]);
    add(key: string, value: T): void;
    remove(key: string): void;
    getValue(key: string): T;
    keys(): string[];
    values(): T[];
    containsKey(key: string): boolean;
    toLookup(): IDictionary<T>;
}

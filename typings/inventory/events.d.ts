import * as EventStore from "../eventstore/EventStore";
export declare class ItemCreated extends EventStore.Event {
    sku: string;
    description: string;
    static Type: ItemCreated;
    constructor(sku: string, description: string);
}
export declare class ItemDisabled extends EventStore.Event {
    static Type: ItemDisabled;
    constructor();
}
export declare class ItemLoaded extends EventStore.Event {
    quantity: number;
    static Type: ItemLoaded;
    constructor(quantity: number);
}
export declare class ItemPicked extends EventStore.Event {
    quantity: number;
    static Type: ItemPicked;
    constructor(quantity: number);
}
export declare class ItemPickingFailed extends EventStore.Event {
    requested: number;
    inStock: number;
    static Type: ItemPickingFailed;
    constructor(requested: number, inStock: number);
}

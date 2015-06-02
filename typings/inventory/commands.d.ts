import * as EventStore from "../eventstore/EventStore";
export declare class RegisterItem extends EventStore.Command {
    itemId: string;
    sku: string;
    description: string;
    static Type: RegisterItem;
    __registerItem: any;
    constructor(itemId: string, sku: string, description: string);
}
export declare class DisableItem extends EventStore.Command {
    itemId: string;
    static Type: DisableItem;
    __disableItem: any;
    constructor(itemId: string);
}
export declare class LoadItem extends EventStore.Command {
    itemId: string;
    quantity: number;
    static Type: LoadItem;
    __loadItem: any;
    constructor(itemId: string, quantity: number);
}
export declare class PickItem extends EventStore.Command {
    itemId: string;
    quantity: number;
    static Type: PickItem;
    __loadItem: any;
    constructor(itemId: string, quantity: number);
}

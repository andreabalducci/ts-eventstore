/// <reference path="../eventstore/EventStore.d.ts" />
declare module Inventory {
    class RegisterItem extends EventStore.Command {
        itemId: string;
        sku: string;
        description: string;
        static Type: RegisterItem;
        __registerItem: any;
        constructor(itemId: string, sku: string, description: string);
    }
    class DisableItem extends EventStore.Command {
        itemId: string;
        static Type: DisableItem;
        __disableItem: any;
        constructor(itemId: string);
    }
    class LoadItem extends EventStore.Command {
        itemId: string;
        quantity: number;
        static Type: LoadItem;
        __loadItem: any;
        constructor(itemId: string, quantity: number);
    }
    class PickItem extends EventStore.Command {
        itemId: string;
        quantity: number;
        static Type: PickItem;
        __loadItem: any;
        constructor(itemId: string, quantity: number);
    }
}

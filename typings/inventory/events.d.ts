/// <reference path="../eventstore/EventStore.d.ts" />
declare module Inventory {
    class ItemCreated extends EventStore.Event {
        sku: string;
        description: string;
        static Type: ItemCreated;
        constructor(sku: string, description: string);
    }
    class ItemDisabled extends EventStore.Event {
        static Type: ItemDisabled;
        constructor();
    }
    class ItemLoaded extends EventStore.Event {
        quantity: number;
        static Type: ItemLoaded;
        constructor(quantity: number);
    }
    class ItemPicked extends EventStore.Event {
        quantity: number;
        static Type: ItemPicked;
        constructor(quantity: number);
    }
    class ItemPickingFailed extends EventStore.Event {
        requested: number;
        inStock: number;
        static Type: ItemPickingFailed;
        constructor(requested: number, inStock: number);
    }
}

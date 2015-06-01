/// <reference path="../eventstore/EventStore.d.ts" />
/// <reference path="events.d.ts" />
declare module Inventory {
    class ItemState extends EventStore.AggregateState {
        private disabled;
        private inStock;
        private sku;
        constructor();
        hasBeenDisabled(): boolean;
        stockLevel(): number;
    }
    class Item extends EventStore.Aggregate<ItemState> implements EventStore.IAggregateFactory {
        static Type: Item;
        constructor(id: string);
        register(id: string, description: string): void;
        disable(): void;
        load(quantity: number): void;
        unLoad(quantity: number): void;
        Factory(id: string): Item;
    }
}

/// <reference path="../eventstore/EventStore.d.ts" />
declare module Inventory {
    class ItemState extends EventStore.AggregateState {
        private disabled;
        private inStock;
        private sku;
        constructor();
        hasBeenDisabled(): boolean;
        stockLevel(): number;
    }
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
    class RegisterItemHandler implements EventStore.ICommandHandler<RegisterItem> {
        constructor(bus: EventStore.Bus);
        Handle(command: RegisterItem): void;
    }
    class DisableItemHandler implements EventStore.ICommandHandler<DisableItem> {
        constructor(bus: EventStore.Bus);
        Handle(command: DisableItem): void;
    }
    class LoadItemHandler implements EventStore.ICommandHandler<LoadItem> {
        constructor(bus: EventStore.Bus);
        Handle(command: LoadItem): void;
    }
    class PickItemHandler implements EventStore.ICommandHandler<PickItem> {
        constructor(bus: EventStore.Bus);
        Handle(command: PickItem): void;
    }
    class Handlers {
        static Register(bus: EventStore.Bus): void;
    }
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

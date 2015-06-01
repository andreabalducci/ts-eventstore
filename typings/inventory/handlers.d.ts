/// <reference path="../eventstore/EventStore.d.ts" />
/// <reference path="commands.d.ts" />
/// <reference path="Item.d.ts" />
declare module Inventory {
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
}

import * as EventStore from "../EventStore/EventStore";
import * as Commands from "commands";
export declare class RegisterItemHandler implements EventStore.ICommandHandler<Commands.RegisterItem> {
    constructor(bus: EventStore.Bus);
    Handle(command: Commands.RegisterItem): void;
}
export declare class DisableItemHandler implements EventStore.ICommandHandler<Commands.DisableItem> {
    constructor(bus: EventStore.Bus);
    Handle(command: Commands.DisableItem): void;
}
export declare class LoadItemHandler implements EventStore.ICommandHandler<Commands.LoadItem> {
    constructor(bus: EventStore.Bus);
    Handle(command: Commands.LoadItem): void;
}
export declare class PickItemHandler implements EventStore.ICommandHandler<Commands.PickItem> {
    constructor(bus: EventStore.Bus);
    Handle(command: Commands.PickItem): void;
}
export declare class HandlersRegistration {
    static Register(bus: EventStore.Bus): void;
}

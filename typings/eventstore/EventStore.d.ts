/// <reference path="Collections.d.ts" />
import * as Collections from "Collections";
export interface ICommand {
    commandId: string;
}
export interface ICommandHandler<T extends ICommand> {
    Handle(command: T): void;
}
export interface IEvent {
    streamId: string;
    eventId: string;
    GetType(): string;
}
export interface IEventHandler<T extends IEvent> {
    (event: T): void;
}
export interface IBus {
    send(command: ICommand): void;
    publish(event: IEvent): void;
}
export declare class DomainError implements Error {
    message: string;
    name: string;
    constructor(message?: string);
}
export declare class InvariantViolatedException extends DomainError {
    InvariantViolatedException: string;
}
export declare class Command implements ICommand {
    static CommandCounter: number;
    commandId: string;
    constructor();
    GetType(): string;
}
export declare class Event implements IEvent {
    static EventCounter: number;
    static Type: Event;
    streamId: string;
    eventId: string;
    constructor();
    GetType(): string;
}
export declare class Projection {
    private handlers;
    protected On<T extends IEvent>(event: T, handler: IEventHandler<T>): void;
    Handle(event: IEvent): void;
    private HandleEvent(typeName, event);
}
export interface IAggregate {
    getAggregateType(): string;
    getAggregateId(): string;
    getUncommitedEvents(): IEvent[];
    checkInvariants(): any;
}
export interface InvariantCheck {
    name: string;
    rule<T extends AggregateState>(): Boolean;
}
export declare class AggregateState extends Projection {
    private _checks;
    apply(event: IEvent): void;
    protected addCheck(check: InvariantCheck): void;
    checkInvariants(): void;
}
export interface IAggregateFactory {
    Factory(id: string): IAggregateFactory;
    loadFromEvents(events: IEvent[]): void;
}
export declare class Aggregate<TState extends AggregateState> implements IAggregate {
    protected aggregateId: string;
    protected State: TState;
    private Events;
    constructor(aggregateId: string, State: TState);
    protected RaiseEvent(event: IEvent): void;
    loadFromEvents(events: IEvent[]): void;
    getAggregateType(): string;
    getAggregateId(): string;
    getUncommitedEvents(): IEvent[];
    checkInvariants(): void;
}
export interface ICommit {
    commitId: string;
    events: IEvent[];
    headers: Collections.IDictionary<string>;
}
export declare class Stream {
    protected streamId: string;
    private commits;
    private events;
    constructor(streamId: string);
    getStreamId(): string;
    getEvents(): IEvent[];
    commit(events: Array<IEvent>, commitId: string, prepareHeaders?: (h: Collections.IDictionary<string>) => void): ICommit;
}
export declare class Persistence {
    private static streams;
    static openStream(id: string): Stream;
    static dump(): void;
}
export declare class Repository {
    static getById<T extends IAggregateFactory>(type: T, id: string): T;
    static save(aggregate: IAggregate, commitId: string, prepareHeaders?: (h: Collections.IDictionary<string>) => void): void;
}
export declare class Bus implements IBus {
    static Default: Bus;
    private Consumers;
    private Handlers;
    send(command: ICommand): void;
    publish(event: IEvent): void;
    subscribe(consumer: Projection): void;
    On<T extends ICommand>(command: T, handler: ICommandHandler<T>): void;
}

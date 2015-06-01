/// <reference path="Collections.d.ts" />
declare module EventStore {
    interface ICommand {
        commandId: string;
    }
    interface ICommandHandler<T extends ICommand> {
        Handle(command: T): void;
    }
    interface IEvent {
        streamId: string;
        eventId: string;
        GetType(): string;
    }
    interface IEventHandler<T extends IEvent> {
        (event: T): void;
    }
    interface IBus {
        send(command: ICommand): void;
        publish(event: IEvent): void;
    }
    class DomainError implements Error {
        message: string;
        name: string;
        constructor(message?: string);
    }
    class InvariantViolatedException extends DomainError {
        InvariantViolatedException: string;
    }
    class Command implements ICommand {
        static CommandCounter: number;
        commandId: string;
        constructor();
        GetType(): string;
    }
    class Event implements IEvent {
        static EventCounter: number;
        static Type: Event;
        streamId: string;
        eventId: string;
        constructor();
        GetType(): string;
    }
    class Projection {
        private handlers;
        protected On<T extends IEvent>(event: T, handler: IEventHandler<T>): void;
        Handle(event: IEvent): void;
        private HandleEvent(typeName, event);
    }
    interface IAggregate {
        getAggregateType(): string;
        getAggregateId(): string;
        getUncommitedEvents(): IEvent[];
        checkInvariants(): any;
    }
    interface InvariantCheck {
        name: string;
        rule<T extends AggregateState>(): Boolean;
    }
    class AggregateState extends Projection {
        private _checks;
        apply(event: IEvent): void;
        protected addCheck(check: InvariantCheck): void;
        checkInvariants(): void;
    }
    interface IAggregateFactory {
        Factory(id: string): IAggregateFactory;
        loadFromEvents(events: IEvent[]): void;
    }
    class Aggregate<TState extends AggregateState> implements IAggregate {
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
    interface ICommit {
        commitId: string;
        events: IEvent[];
        headers: Collections.IDictionary<string>;
    }
    class Stream {
        protected streamId: string;
        private commits;
        private events;
        constructor(streamId: string);
        getStreamId(): string;
        getEvents(): IEvent[];
        commit(events: Array<IEvent>, commitId: string, prepareHeaders?: (h: Collections.IDictionary<string>) => void): ICommit;
    }
    class Persistence {
        private static streams;
        static openStream(id: string): Stream;
        static dump(): void;
    }
    class Repository {
        static getById<T extends IAggregateFactory>(type: T, id: string): T;
        static save(aggregate: IAggregate, commitId: string, prepareHeaders?: (h: Collections.IDictionary<string>) => void): void;
    }
    class Bus implements IBus {
        static Default: Bus;
        private Consumers;
        private Handlers;
        send(command: ICommand): void;
        publish(event: IEvent): void;
        subscribe(consumer: Projection): void;
        On<T extends ICommand>(command: T, handler: ICommandHandler<T>): void;
    }
}

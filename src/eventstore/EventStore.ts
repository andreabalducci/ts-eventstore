/// <reference path="Collections.ts"/>
import * as Collections from "Collections";


/* Interfaces */
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
	
/* Implementations */
/**
 * getType from object instance
 */
function getType(o): string {
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((<any> o).constructor.toString());
	return (results && results.length > 1) ? results[1] : "";
}

/**
 * Get class name from type
 */
function getClassName(o): string {
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((<any> o).toString());
	return (results && results.length > 1) ? results[1] : "";
}

export class DomainError implements Error {
	name: string;

	constructor(public message?: string) {
		this.name = getType(this);
	}
}

export class InvariantViolatedException extends DomainError {
	InvariantViolatedException = "";
}

export class Command implements ICommand {
	static CommandCounter: number = 0;
	commandId: string;

	constructor() {
		this.commandId = "cmd_" + Command.CommandCounter++;
	}

	GetType(): string {
		return getType(this);
	}
}


export class Event implements IEvent {
	static EventCounter: number = 0;
	static Type: Event = new Event();
	streamId: string;
	eventId: string;
	constructor() {
		this.eventId = "evt_" + Event.EventCounter++;
	}

	GetType(): string {
		return getType(this);
	}
}

export class Projection {
	private handlers: Array<IEventHandler<IEvent>> = new Array<IEventHandler<IEvent>>();
	protected On<T extends IEvent>(event: T, handler: IEventHandler<T>) {
		var name = getType(event);
		this.handlers[name] = handler;
	}

	public Handle(event: IEvent) {
		this.HandleEvent(event.GetType(), event);
		this.HandleEvent(getType(Event.Type), event);
	}

	private HandleEvent(typeName: string, event: IEvent) {
		var handler = this.handlers[typeName];
		if (handler)
			handler(event);
	}
}

export interface IAggregate {
	getAggregateType(): string;
	getAggregateId(): string;
	getUncommitedEvents(): IEvent[];
	checkInvariants();
}

export interface InvariantCheck {
	name: string;
	rule<T extends AggregateState>(): Boolean;
}

export class AggregateState extends Projection {
	private _checks = new Array<InvariantCheck>();
	apply(event: IEvent): void {
		this.Handle(event);
	}

	protected addCheck(check: InvariantCheck) {
		this._checks.push(check);
	}

	checkInvariants() {
		this._checks.forEach(c => {
			if (!c.rule()) {
				console.log("rule \'" + c.name + "\' has been violated");
				throw new InvariantViolatedException(c.name);
			}
		});
	}
}

export interface IAggregateFactory {
	Factory(id: string): IAggregateFactory;
	loadFromEvents(events: IEvent[]): void;
}

export class Aggregate<TState extends AggregateState> implements IAggregate {
	private Events: Array<IEvent> = new Array<IEvent>();

	constructor(protected aggregateId: string, protected State: TState) {

	}

	protected RaiseEvent(event: IEvent): void {
		event.streamId = this.aggregateId;
		this.Events.push(event);
		this.State.apply(event);
	}

	loadFromEvents(events: IEvent[]): void {
		events.forEach(e=> this.State.apply(e));
	}

	getAggregateType() {
		return getType(this);
	}
	getAggregateId() {
		return this.aggregateId;
	}
	getUncommitedEvents(): IEvent[] {
		return this.Events;
	}
	checkInvariants() {
		this.State.checkInvariants();
	}
}

export interface ICommit {
	commitId: string;
	events: IEvent[];
	headers: Collections.IDictionary<string>
};

export class Stream {
	private commits = new Array<ICommit>();
	private events = new Array<IEvent>();

	constructor(protected streamId: string) {

	}

	getStreamId() { return this.streamId; }

	getEvents(): IEvent[] {
		return this.events;
	}

	commit(
		events: Array<IEvent>,
		commitId: string,
		prepareHeaders?: (h: Collections.IDictionary<string>) => void): ICommit {

		var commit: ICommit = {
			commitId: commitId,
			events: events,
			headers: new Collections.Dictionary<string>()
		};

		if (prepareHeaders) {
			prepareHeaders(commit.headers);
		}
		this.commits.push(commit);
		this.events = this.events.concat(events);
		console.log('saved commit', commit);

		return commit;
	}
}

export class Persistence {
	private static streams = new Collections.Dictionary<Stream>();
	static openStream(id: string): Stream {
		if (!this.streams.containsKey(id)) {
			this.streams.add(id, new Stream(id));
		}

		return this.streams.getValue(id);
	}

	static dump() {
		this.streams.values().forEach(s => { console.log('stream ' + s.getStreamId(), s) });
	}
}

export class Repository {
	static getById<T extends IAggregateFactory>(type: T, id: string): T {
		var stream = Persistence.openStream(id);
		var aggregate = <T>type.Factory(id);

		aggregate.loadFromEvents(stream.getEvents());

		return aggregate;
	}

	static save(aggregate: IAggregate, commitId: string, prepareHeaders?: (h: Collections.IDictionary<string>) => void) {
		var id = aggregate.getAggregateId();
		var type = aggregate.getAggregateType();
		console.log('saving ' + type + "[" + id + "]");
			
		// it's ok to save? 
		aggregate.checkInvariants();
			
		// save on stream
		var stream = Persistence.openStream(id);
		stream.commit(aggregate.getUncommitedEvents(), commitId, h=> {
			h.add('type', type);
			if (prepareHeaders) {
				prepareHeaders(h);
			}
		});
			
		// dispatch events to subscribers
		aggregate.getUncommitedEvents().forEach(e=> {
			Bus.Default.publish(e);
		});
	}
}


export class Bus implements IBus {
	static Default = new Bus();
	private Consumers = new Array<Projection>();
	private Handlers = new Collections.Dictionary<ICommandHandler<ICommand>>();

	send(command: ICommand): void {
		var name = getType(command);
		var handler = this.Handlers.getValue(name);
		if (!handler) {
			throw "missing handler for " + name;
		}

		handler.Handle(command);
	}

	publish(event: IEvent): void {
		this.Consumers.forEach(consumer=> consumer.Handle(event));
	}

	subscribe(consumer: Projection): void {
		this.Consumers.push(consumer);
	}

	On<T extends ICommand>(command: T, handler: ICommandHandler<T>) {
		var name = getType(command);
		this.Handlers.add(name, handler);
	}
}

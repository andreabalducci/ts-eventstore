var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "./Collections"], function (require, exports, Collections) {
    /* Implementations */
    /**
     * getType from object instance
     */
    function getType(o) {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(o.constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    }
    /**
     * Get class name from type
     */
    function getClassName(o) {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(o.toString());
        return (results && results.length > 1) ? results[1] : "";
    }
    var DomainError = (function () {
        function DomainError(message) {
            this.message = message;
            this.name = getType(this);
        }
        return DomainError;
    })();
    exports.DomainError = DomainError;
    var InvariantViolatedException = (function (_super) {
        __extends(InvariantViolatedException, _super);
        function InvariantViolatedException() {
            _super.apply(this, arguments);
            this.InvariantViolatedException = "";
        }
        return InvariantViolatedException;
    })(DomainError);
    exports.InvariantViolatedException = InvariantViolatedException;
    var Command = (function () {
        function Command() {
            this.commandId = "cmd_" + Command.CommandCounter++;
        }
        Command.prototype.GetType = function () {
            return getType(this);
        };
        Command.CommandCounter = 0;
        return Command;
    })();
    exports.Command = Command;
    var Event = (function () {
        function Event() {
            this.eventId = "evt_" + Event.EventCounter++;
        }
        Event.prototype.GetType = function () {
            return getType(this);
        };
        Event.EventCounter = 0;
        Event.Type = new Event();
        return Event;
    })();
    exports.Event = Event;
    var Projection = (function () {
        function Projection() {
            this.handlers = new Array();
        }
        Projection.prototype.On = function (event, handler) {
            var name = getType(event);
            this.handlers[name] = handler;
        };
        Projection.prototype.Handle = function (event) {
            this.HandleEvent(event.GetType(), event);
            this.HandleEvent(getType(Event.Type), event);
        };
        Projection.prototype.HandleEvent = function (typeName, event) {
            var handler = this.handlers[typeName];
            if (handler)
                handler(event);
        };
        return Projection;
    })();
    exports.Projection = Projection;
    var AggregateState = (function (_super) {
        __extends(AggregateState, _super);
        function AggregateState() {
            _super.apply(this, arguments);
            this._checks = new Array();
        }
        AggregateState.prototype.apply = function (event) {
            this.Handle(event);
        };
        AggregateState.prototype.addCheck = function (check) {
            this._checks.push(check);
        };
        AggregateState.prototype.checkInvariants = function () {
            this._checks.forEach(function (c) {
                if (!c.rule()) {
                    console.log("rule \'" + c.name + "\' has been violated");
                    throw new InvariantViolatedException(c.name);
                }
            });
        };
        return AggregateState;
    })(Projection);
    exports.AggregateState = AggregateState;
    var Aggregate = (function () {
        function Aggregate(aggregateId, State) {
            this.aggregateId = aggregateId;
            this.State = State;
            this.Events = new Array();
        }
        Aggregate.prototype.RaiseEvent = function (event) {
            event.streamId = this.aggregateId;
            this.Events.push(event);
            this.State.apply(event);
        };
        Aggregate.prototype.loadFromEvents = function (events) {
            var _this = this;
            events.forEach(function (e) { return _this.State.apply(e); });
        };
        Aggregate.prototype.getAggregateType = function () {
            return getType(this);
        };
        Aggregate.prototype.getAggregateId = function () {
            return this.aggregateId;
        };
        Aggregate.prototype.getUncommitedEvents = function () {
            return this.Events;
        };
        Aggregate.prototype.checkInvariants = function () {
            this.State.checkInvariants();
        };
        return Aggregate;
    })();
    exports.Aggregate = Aggregate;
    ;
    var Stream = (function () {
        function Stream(streamId) {
            this.streamId = streamId;
            this.commits = new Array();
            this.events = new Array();
        }
        Stream.prototype.getStreamId = function () { return this.streamId; };
        Stream.prototype.getEvents = function () {
            return this.events;
        };
        Stream.prototype.commit = function (events, commitId, prepareHeaders) {
            var commit = {
                commitId: commitId,
                events: events,
                headers: new Collections.Dictionary()
            };
            if (prepareHeaders) {
                prepareHeaders(commit.headers);
            }
            this.commits.push(commit);
            this.events = this.events.concat(events);
            console.log('saved commit', commit);
            return commit;
        };
        return Stream;
    })();
    exports.Stream = Stream;
    var Persistence = (function () {
        function Persistence() {
        }
        Persistence.openStream = function (id) {
            if (!this.streams.containsKey(id)) {
                this.streams.add(id, new Stream(id));
            }
            return this.streams.getValue(id);
        };
        Persistence.dump = function () {
            this.streams.values().forEach(function (s) { console.log('stream ' + s.getStreamId(), s); });
        };
        Persistence.streams = new Collections.Dictionary();
        return Persistence;
    })();
    exports.Persistence = Persistence;
    var Repository = (function () {
        function Repository() {
        }
        Repository.getById = function (type, id) {
            var stream = Persistence.openStream(id);
            var aggregate = type.Factory(id);
            aggregate.loadFromEvents(stream.getEvents());
            return aggregate;
        };
        Repository.save = function (aggregate, commitId, prepareHeaders) {
            var id = aggregate.getAggregateId();
            var type = aggregate.getAggregateType();
            console.log('saving ' + type + "[" + id + "]");
            // it's ok to save? 
            aggregate.checkInvariants();
            // save on stream
            var stream = Persistence.openStream(id);
            stream.commit(aggregate.getUncommitedEvents(), commitId, function (h) {
                h.add('type', type);
                if (prepareHeaders) {
                    prepareHeaders(h);
                }
            });
            // dispatch events to subscribers
            aggregate.getUncommitedEvents().forEach(function (e) {
                Bus.Default.publish(e);
            });
        };
        return Repository;
    })();
    exports.Repository = Repository;
    var Bus = (function () {
        function Bus() {
            this.Consumers = new Array();
            this.Handlers = new Collections.Dictionary();
        }
        Bus.prototype.send = function (command) {
            var name = getType(command);
            var handler = this.Handlers.getValue(name);
            if (!handler) {
                throw "missing handler for " + name;
            }
            handler.Handle(command);
        };
        Bus.prototype.publish = function (event) {
            this.Consumers.forEach(function (consumer) { return consumer.Handle(event); });
        };
        Bus.prototype.subscribe = function (consumer) {
            this.Consumers.push(consumer);
        };
        Bus.prototype.On = function (command, handler) {
            var name = getType(command);
            this.Handlers.add(name, handler);
        };
        Bus.Default = new Bus();
        return Bus;
    })();
    exports.Bus = Bus;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50c3RvcmUvRXZlbnRTdG9yZS50cyJdLCJuYW1lcyI6WyJnZXRUeXBlIiwiZ2V0Q2xhc3NOYW1lIiwiRG9tYWluRXJyb3IiLCJEb21haW5FcnJvci5jb25zdHJ1Y3RvciIsIkludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uIiwiSW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24uY29uc3RydWN0b3IiLCJDb21tYW5kIiwiQ29tbWFuZC5jb25zdHJ1Y3RvciIsIkNvbW1hbmQuR2V0VHlwZSIsIkV2ZW50IiwiRXZlbnQuY29uc3RydWN0b3IiLCJFdmVudC5HZXRUeXBlIiwiUHJvamVjdGlvbiIsIlByb2plY3Rpb24uY29uc3RydWN0b3IiLCJQcm9qZWN0aW9uLk9uIiwiUHJvamVjdGlvbi5IYW5kbGUiLCJQcm9qZWN0aW9uLkhhbmRsZUV2ZW50IiwiQWdncmVnYXRlU3RhdGUiLCJBZ2dyZWdhdGVTdGF0ZS5jb25zdHJ1Y3RvciIsIkFnZ3JlZ2F0ZVN0YXRlLmFwcGx5IiwiQWdncmVnYXRlU3RhdGUuYWRkQ2hlY2siLCJBZ2dyZWdhdGVTdGF0ZS5jaGVja0ludmFyaWFudHMiLCJBZ2dyZWdhdGUiLCJBZ2dyZWdhdGUuY29uc3RydWN0b3IiLCJBZ2dyZWdhdGUuUmFpc2VFdmVudCIsIkFnZ3JlZ2F0ZS5sb2FkRnJvbUV2ZW50cyIsIkFnZ3JlZ2F0ZS5nZXRBZ2dyZWdhdGVUeXBlIiwiQWdncmVnYXRlLmdldEFnZ3JlZ2F0ZUlkIiwiQWdncmVnYXRlLmdldFVuY29tbWl0ZWRFdmVudHMiLCJBZ2dyZWdhdGUuY2hlY2tJbnZhcmlhbnRzIiwiU3RyZWFtIiwiU3RyZWFtLmNvbnN0cnVjdG9yIiwiU3RyZWFtLmdldFN0cmVhbUlkIiwiU3RyZWFtLmdldEV2ZW50cyIsIlN0cmVhbS5jb21taXQiLCJQZXJzaXN0ZW5jZSIsIlBlcnNpc3RlbmNlLmNvbnN0cnVjdG9yIiwiUGVyc2lzdGVuY2Uub3BlblN0cmVhbSIsIlBlcnNpc3RlbmNlLmR1bXAiLCJSZXBvc2l0b3J5IiwiUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIlJlcG9zaXRvcnkuZ2V0QnlJZCIsIlJlcG9zaXRvcnkuc2F2ZSIsIkJ1cyIsIkJ1cy5jb25zdHJ1Y3RvciIsIkJ1cy5zZW5kIiwiQnVzLnB1Ymxpc2giLCJCdXMuc3Vic2NyaWJlIiwiQnVzLk9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0lBNEJBLHFCQUFxQjtJQUNyQjs7T0FFRztJQUNILGlCQUFpQixDQUFDO1FBQ2pCQSxJQUFJQSxhQUFhQSxHQUFHQSxvQkFBb0JBLENBQUNBO1FBQ3pDQSxJQUFJQSxPQUFPQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFRQSxDQUFFQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNyRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsT0FBT0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFDMURBLENBQUNBO0lBRUQ7O09BRUc7SUFDSCxzQkFBc0IsQ0FBQztRQUN0QkMsSUFBSUEsYUFBYUEsR0FBR0Esb0JBQW9CQSxDQUFDQTtRQUN6Q0EsSUFBSUEsT0FBT0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBUUEsQ0FBRUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDekRBLE1BQU1BLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLE9BQU9BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO0lBQzFEQSxDQUFDQTtJQUVEO1FBR0NDLHFCQUFtQkEsT0FBZ0JBO1lBQWhCQyxZQUFPQSxHQUFQQSxPQUFPQSxDQUFTQTtZQUNsQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7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LENBQUNBO1lBQzNDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDZEEsTUFBTUEsc0JBQXNCQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNyQ0EsQ0FBQ0E7WUFFREEsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDekJBLENBQUNBO1FBRURGLHFCQUFPQSxHQUFQQSxVQUFRQSxLQUFhQTtZQUNwQkcsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsUUFBUUEsSUFBR0EsT0FBQUEsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBdEJBLENBQXNCQSxDQUFDQSxDQUFDQTtRQUMzREEsQ0FBQ0E7UUFFREgsdUJBQVNBLEdBQVRBLFVBQVVBLFFBQW9CQTtZQUM3QkksSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDL0JBLENBQUNBO1FBRURKLGdCQUFFQSxHQUFGQSxVQUF1QkEsT0FBVUEsRUFBRUEsT0FBMkJBO1lBQzdESyxJQUFJQSxJQUFJQSxHQUFHQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUM1QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLENBQUNBO1FBekJNTCxXQUFPQSxHQUFHQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQTBCNUJBLFVBQUNBO0lBQURBLENBM0JBLEFBMkJDQSxJQUFBO0lBM0JZLFdBQUcsTUEyQmYsQ0FBQSIsImZpbGUiOiJldmVudHN0b3JlL0V2ZW50U3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiQ29sbGVjdGlvbnMudHNcIi8+XG5pbXBvcnQgKiBhcyBDb2xsZWN0aW9ucyBmcm9tIFwiLi9Db2xsZWN0aW9uc1wiO1xuXG5cbi8qIEludGVyZmFjZXMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbW1hbmQge1xuXHRjb21tYW5kSWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29tbWFuZEhhbmRsZXI8VCBleHRlbmRzIElDb21tYW5kPiB7XG5cdEhhbmRsZShjb21tYW5kOiBUKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnQge1xuXHRzdHJlYW1JZDogc3RyaW5nO1xuXHRldmVudElkOiBzdHJpbmc7XG5cdEdldFR5cGUoKTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFdmVudEhhbmRsZXI8VCBleHRlbmRzIElFdmVudD4ge1xuXHQoZXZlbnQ6IFQpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElCdXMge1xuXHRzZW5kKGNvbW1hbmQ6IElDb21tYW5kKTogdm9pZDtcblx0cHVibGlzaChldmVudDogSUV2ZW50KTogdm9pZDtcbn1cblx0XG4vKiBJbXBsZW1lbnRhdGlvbnMgKi9cbi8qKlxuICogZ2V0VHlwZSBmcm9tIG9iamVjdCBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiBnZXRUeXBlKG8pOiBzdHJpbmcge1xuXHR2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvbiAoLnsxLH0pXFwoLztcblx0dmFyIHJlc3VsdHMgPSAoZnVuY05hbWVSZWdleCkuZXhlYygoPGFueT4gbykuY29uc3RydWN0b3IudG9TdHJpbmcoKSk7XG5cdHJldHVybiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDEpID8gcmVzdWx0c1sxXSA6IFwiXCI7XG59XG5cbi8qKlxuICogR2V0IGNsYXNzIG5hbWUgZnJvbSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGdldENsYXNzTmFtZShvKTogc3RyaW5nIHtcblx0dmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb24gKC57MSx9KVxcKC87XG5cdHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKDxhbnk+IG8pLnRvU3RyaW5nKCkpO1xuXHRyZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0gOiBcIlwiO1xufVxuXG5leHBvcnQgY2xhc3MgRG9tYWluRXJyb3IgaW1wbGVtZW50cyBFcnJvciB7XG5cdG5hbWU6IHN0cmluZztcblxuXHRjb25zdHJ1Y3RvcihwdWJsaWMgbWVzc2FnZT86IHN0cmluZykge1xuXHRcdHRoaXMubmFtZSA9IGdldFR5cGUodGhpcyk7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uIGV4dGVuZHMgRG9tYWluRXJyb3Ige1xuXHRJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiA9IFwiXCI7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21tYW5kIGltcGxlbWVudHMgSUNvbW1hbmQge1xuXHRzdGF0aWMgQ29tbWFuZENvdW50ZXI6IG51bWJlciA9IDA7XG5cdGNvbW1hbmRJZDogc3RyaW5nO1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuY29tbWFuZElkID0gXCJjbWRfXCIgKyBDb21tYW5kLkNvbW1hbmRDb3VudGVyKys7XG5cdH1cblxuXHRHZXRUeXBlKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGdldFR5cGUodGhpcyk7XG5cdH1cbn1cblxuXG5leHBvcnQgY2xhc3MgRXZlbnQgaW1wbGVtZW50cyBJRXZlbnQge1xuXHRzdGF0aWMgRXZlbnRDb3VudGVyOiBudW1iZXIgPSAwO1xuXHRzdGF0aWMgVHlwZTogRXZlbnQgPSBuZXcgRXZlbnQoKTtcblx0c3RyZWFtSWQ6IHN0cmluZztcblx0ZXZlbnRJZDogc3RyaW5nO1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmV2ZW50SWQgPSBcImV2dF9cIiArIEV2ZW50LkV2ZW50Q291bnRlcisrO1xuXHR9XG5cblx0R2V0VHlwZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBnZXRUeXBlKHRoaXMpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0aW9uIHtcblx0cHJpdmF0ZSBoYW5kbGVyczogQXJyYXk8SUV2ZW50SGFuZGxlcjxJRXZlbnQ+PiA9IG5ldyBBcnJheTxJRXZlbnRIYW5kbGVyPElFdmVudD4+KCk7XG5cdHByb3RlY3RlZCBPbjxUIGV4dGVuZHMgSUV2ZW50PihldmVudDogVCwgaGFuZGxlcjogSUV2ZW50SGFuZGxlcjxUPikge1xuXHRcdHZhciBuYW1lID0gZ2V0VHlwZShldmVudCk7XG5cdFx0dGhpcy5oYW5kbGVyc1tuYW1lXSA9IGhhbmRsZXI7XG5cdH1cblxuXHRwdWJsaWMgSGFuZGxlKGV2ZW50OiBJRXZlbnQpIHtcblx0XHR0aGlzLkhhbmRsZUV2ZW50KGV2ZW50LkdldFR5cGUoKSwgZXZlbnQpO1xuXHRcdHRoaXMuSGFuZGxlRXZlbnQoZ2V0VHlwZShFdmVudC5UeXBlKSwgZXZlbnQpO1xuXHR9XG5cblx0cHJpdmF0ZSBIYW5kbGVFdmVudCh0eXBlTmFtZTogc3RyaW5nLCBldmVudDogSUV2ZW50KSB7XG5cdFx0dmFyIGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJzW3R5cGVOYW1lXTtcblx0XHRpZiAoaGFuZGxlcilcblx0XHRcdGhhbmRsZXIoZXZlbnQpO1xuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUFnZ3JlZ2F0ZSB7XG5cdGdldEFnZ3JlZ2F0ZVR5cGUoKTogc3RyaW5nO1xuXHRnZXRBZ2dyZWdhdGVJZCgpOiBzdHJpbmc7XG5cdGdldFVuY29tbWl0ZWRFdmVudHMoKTogSUV2ZW50W107XG5cdGNoZWNrSW52YXJpYW50cygpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludmFyaWFudENoZWNrIHtcblx0bmFtZTogc3RyaW5nO1xuXHRydWxlPFQgZXh0ZW5kcyBBZ2dyZWdhdGVTdGF0ZT4oKTogQm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEFnZ3JlZ2F0ZVN0YXRlIGV4dGVuZHMgUHJvamVjdGlvbiB7XG5cdHByaXZhdGUgX2NoZWNrcyA9IG5ldyBBcnJheTxJbnZhcmlhbnRDaGVjaz4oKTtcblx0YXBwbHkoZXZlbnQ6IElFdmVudCk6IHZvaWQge1xuXHRcdHRoaXMuSGFuZGxlKGV2ZW50KTtcblx0fVxuXG5cdHByb3RlY3RlZCBhZGRDaGVjayhjaGVjazogSW52YXJpYW50Q2hlY2spIHtcblx0XHR0aGlzLl9jaGVja3MucHVzaChjaGVjayk7XG5cdH1cblxuXHRjaGVja0ludmFyaWFudHMoKSB7XG5cdFx0dGhpcy5fY2hlY2tzLmZvckVhY2goYyA9PiB7XG5cdFx0XHRpZiAoIWMucnVsZSgpKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicnVsZSBcXCdcIiArIGMubmFtZSArIFwiXFwnIGhhcyBiZWVuIHZpb2xhdGVkXCIpO1xuXHRcdFx0XHR0aHJvdyBuZXcgSW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24oYy5uYW1lKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBZ2dyZWdhdGVGYWN0b3J5IHtcblx0RmFjdG9yeShpZDogc3RyaW5nKTogSUFnZ3JlZ2F0ZUZhY3Rvcnk7XG5cdGxvYWRGcm9tRXZlbnRzKGV2ZW50czogSUV2ZW50W10pOiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgQWdncmVnYXRlPFRTdGF0ZSBleHRlbmRzIEFnZ3JlZ2F0ZVN0YXRlPiBpbXBsZW1lbnRzIElBZ2dyZWdhdGUge1xuXHRwcml2YXRlIEV2ZW50czogQXJyYXk8SUV2ZW50PiA9IG5ldyBBcnJheTxJRXZlbnQ+KCk7XG5cblx0Y29uc3RydWN0b3IocHJvdGVjdGVkIGFnZ3JlZ2F0ZUlkOiBzdHJpbmcsIHByb3RlY3RlZCBTdGF0ZTogVFN0YXRlKSB7XG5cblx0fVxuXG5cdHByb3RlY3RlZCBSYWlzZUV2ZW50KGV2ZW50OiBJRXZlbnQpOiB2b2lkIHtcblx0XHRldmVudC5zdHJlYW1JZCA9IHRoaXMuYWdncmVnYXRlSWQ7XG5cdFx0dGhpcy5FdmVudHMucHVzaChldmVudCk7XG5cdFx0dGhpcy5TdGF0ZS5hcHBseShldmVudCk7XG5cdH1cblxuXHRsb2FkRnJvbUV2ZW50cyhldmVudHM6IElFdmVudFtdKTogdm9pZCB7XG5cdFx0ZXZlbnRzLmZvckVhY2goZT0+IHRoaXMuU3RhdGUuYXBwbHkoZSkpO1xuXHR9XG5cblx0Z2V0QWdncmVnYXRlVHlwZSgpIHtcblx0XHRyZXR1cm4gZ2V0VHlwZSh0aGlzKTtcblx0fVxuXHRnZXRBZ2dyZWdhdGVJZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5hZ2dyZWdhdGVJZDtcblx0fVxuXHRnZXRVbmNvbW1pdGVkRXZlbnRzKCk6IElFdmVudFtdIHtcblx0XHRyZXR1cm4gdGhpcy5FdmVudHM7XG5cdH1cblx0Y2hlY2tJbnZhcmlhbnRzKCkge1xuXHRcdHRoaXMuU3RhdGUuY2hlY2tJbnZhcmlhbnRzKCk7XG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29tbWl0IHtcblx0Y29tbWl0SWQ6IHN0cmluZztcblx0ZXZlbnRzOiBJRXZlbnRbXTtcblx0aGVhZGVyczogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8c3RyaW5nPlxufTtcblxuZXhwb3J0IGNsYXNzIFN0cmVhbSB7XG5cdHByaXZhdGUgY29tbWl0cyA9IG5ldyBBcnJheTxJQ29tbWl0PigpO1xuXHRwcml2YXRlIGV2ZW50cyA9IG5ldyBBcnJheTxJRXZlbnQ+KCk7XG5cblx0Y29uc3RydWN0b3IocHJvdGVjdGVkIHN0cmVhbUlkOiBzdHJpbmcpIHtcblxuXHR9XG5cblx0Z2V0U3RyZWFtSWQoKSB7IHJldHVybiB0aGlzLnN0cmVhbUlkOyB9XG5cblx0Z2V0RXZlbnRzKCk6IElFdmVudFtdIHtcblx0XHRyZXR1cm4gdGhpcy5ldmVudHM7XG5cdH1cblxuXHRjb21taXQoXG5cdFx0ZXZlbnRzOiBBcnJheTxJRXZlbnQ+LFxuXHRcdGNvbW1pdElkOiBzdHJpbmcsXG5cdFx0cHJlcGFyZUhlYWRlcnM/OiAoaDogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8c3RyaW5nPikgPT4gdm9pZCk6IElDb21taXQge1xuXG5cdFx0dmFyIGNvbW1pdDogSUNvbW1pdCA9IHtcblx0XHRcdGNvbW1pdElkOiBjb21taXRJZCxcblx0XHRcdGV2ZW50czogZXZlbnRzLFxuXHRcdFx0aGVhZGVyczogbmV3IENvbGxlY3Rpb25zLkRpY3Rpb25hcnk8c3RyaW5nPigpXG5cdFx0fTtcblxuXHRcdGlmIChwcmVwYXJlSGVhZGVycykge1xuXHRcdFx0cHJlcGFyZUhlYWRlcnMoY29tbWl0LmhlYWRlcnMpO1xuXHRcdH1cblx0XHR0aGlzLmNvbW1pdHMucHVzaChjb21taXQpO1xuXHRcdHRoaXMuZXZlbnRzID0gdGhpcy5ldmVudHMuY29uY2F0KGV2ZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ3NhdmVkIGNvbW1pdCcsIGNvbW1pdCk7XG5cblx0XHRyZXR1cm4gY29tbWl0O1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBQZXJzaXN0ZW5jZSB7XG5cdHByaXZhdGUgc3RhdGljIHN0cmVhbXMgPSBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxTdHJlYW0+KCk7XG5cdHN0YXRpYyBvcGVuU3RyZWFtKGlkOiBzdHJpbmcpOiBTdHJlYW0ge1xuXHRcdGlmICghdGhpcy5zdHJlYW1zLmNvbnRhaW5zS2V5KGlkKSkge1xuXHRcdFx0dGhpcy5zdHJlYW1zLmFkZChpZCwgbmV3IFN0cmVhbShpZCkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnN0cmVhbXMuZ2V0VmFsdWUoaWQpO1xuXHR9XG5cblx0c3RhdGljIGR1bXAoKSB7XG5cdFx0dGhpcy5zdHJlYW1zLnZhbHVlcygpLmZvckVhY2gocyA9PiB7IGNvbnNvbGUubG9nKCdzdHJlYW0gJyArIHMuZ2V0U3RyZWFtSWQoKSwgcykgfSk7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlcG9zaXRvcnkge1xuXHRzdGF0aWMgZ2V0QnlJZDxUIGV4dGVuZHMgSUFnZ3JlZ2F0ZUZhY3Rvcnk+KHR5cGU6IFQsIGlkOiBzdHJpbmcpOiBUIHtcblx0XHR2YXIgc3RyZWFtID0gUGVyc2lzdGVuY2Uub3BlblN0cmVhbShpZCk7XG5cdFx0dmFyIGFnZ3JlZ2F0ZSA9IDxUPnR5cGUuRmFjdG9yeShpZCk7XG5cblx0XHRhZ2dyZWdhdGUubG9hZEZyb21FdmVudHMoc3RyZWFtLmdldEV2ZW50cygpKTtcblxuXHRcdHJldHVybiBhZ2dyZWdhdGU7XG5cdH1cblxuXHRzdGF0aWMgc2F2ZShhZ2dyZWdhdGU6IElBZ2dyZWdhdGUsIGNvbW1pdElkOiBzdHJpbmcsIHByZXBhcmVIZWFkZXJzPzogKGg6IENvbGxlY3Rpb25zLklEaWN0aW9uYXJ5PHN0cmluZz4pID0+IHZvaWQpIHtcblx0XHR2YXIgaWQgPSBhZ2dyZWdhdGUuZ2V0QWdncmVnYXRlSWQoKTtcblx0XHR2YXIgdHlwZSA9IGFnZ3JlZ2F0ZS5nZXRBZ2dyZWdhdGVUeXBlKCk7XG5cdFx0Y29uc29sZS5sb2coJ3NhdmluZyAnICsgdHlwZSArIFwiW1wiICsgaWQgKyBcIl1cIik7XG5cdFx0XHRcblx0XHQvLyBpdCdzIG9rIHRvIHNhdmU/IFxuXHRcdGFnZ3JlZ2F0ZS5jaGVja0ludmFyaWFudHMoKTtcblx0XHRcdFxuXHRcdC8vIHNhdmUgb24gc3RyZWFtXG5cdFx0dmFyIHN0cmVhbSA9IFBlcnNpc3RlbmNlLm9wZW5TdHJlYW0oaWQpO1xuXHRcdHN0cmVhbS5jb21taXQoYWdncmVnYXRlLmdldFVuY29tbWl0ZWRFdmVudHMoKSwgY29tbWl0SWQsIGg9PiB7XG5cdFx0XHRoLmFkZCgndHlwZScsIHR5cGUpO1xuXHRcdFx0aWYgKHByZXBhcmVIZWFkZXJzKSB7XG5cdFx0XHRcdHByZXBhcmVIZWFkZXJzKGgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFx0XG5cdFx0Ly8gZGlzcGF0Y2ggZXZlbnRzIHRvIHN1YnNjcmliZXJzXG5cdFx0YWdncmVnYXRlLmdldFVuY29tbWl0ZWRFdmVudHMoKS5mb3JFYWNoKGU9PiB7XG5cdFx0XHRCdXMuRGVmYXVsdC5wdWJsaXNoKGUpO1xuXHRcdH0pO1xuXHR9XG59XG5cblxuZXhwb3J0IGNsYXNzIEJ1cyBpbXBsZW1lbnRzIElCdXMge1xuXHRzdGF0aWMgRGVmYXVsdCA9IG5ldyBCdXMoKTtcblx0cHJpdmF0ZSBDb25zdW1lcnMgPSBuZXcgQXJyYXk8UHJvamVjdGlvbj4oKTtcblx0cHJpdmF0ZSBIYW5kbGVycyA9IG5ldyBDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5PElDb21tYW5kSGFuZGxlcjxJQ29tbWFuZD4+KCk7XG5cblx0c2VuZChjb21tYW5kOiBJQ29tbWFuZCk6IHZvaWQge1xuXHRcdHZhciBuYW1lID0gZ2V0VHlwZShjb21tYW5kKTtcblx0XHR2YXIgaGFuZGxlciA9IHRoaXMuSGFuZGxlcnMuZ2V0VmFsdWUobmFtZSk7XG5cdFx0aWYgKCFoYW5kbGVyKSB7XG5cdFx0XHR0aHJvdyBcIm1pc3NpbmcgaGFuZGxlciBmb3IgXCIgKyBuYW1lO1xuXHRcdH1cblxuXHRcdGhhbmRsZXIuSGFuZGxlKGNvbW1hbmQpO1xuXHR9XG5cblx0cHVibGlzaChldmVudDogSUV2ZW50KTogdm9pZCB7XG5cdFx0dGhpcy5Db25zdW1lcnMuZm9yRWFjaChjb25zdW1lcj0+IGNvbnN1bWVyLkhhbmRsZShldmVudCkpO1xuXHR9XG5cblx0c3Vic2NyaWJlKGNvbnN1bWVyOiBQcm9qZWN0aW9uKTogdm9pZCB7XG5cdFx0dGhpcy5Db25zdW1lcnMucHVzaChjb25zdW1lcik7XG5cdH1cblxuXHRPbjxUIGV4dGVuZHMgSUNvbW1hbmQ+KGNvbW1hbmQ6IFQsIGhhbmRsZXI6IElDb21tYW5kSGFuZGxlcjxUPikge1xuXHRcdHZhciBuYW1lID0gZ2V0VHlwZShjb21tYW5kKTtcblx0XHR0aGlzLkhhbmRsZXJzLmFkZChuYW1lLCBoYW5kbGVyKTtcblx0fVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
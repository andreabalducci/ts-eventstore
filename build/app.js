var Dictionary = (function () {
    function Dictionary(init) {
        if (init === void 0) { init = new Array(); }
        this._keys = new Array();
        this._values = new Array();
        if (init) {
            for (var x = 0; x < init.length; x++) {
                this.add(init[x].key, init[x].value);
            }
        }
    }
    Dictionary.prototype.add = function (key, value) {
        this[key] = value;
        this._keys.push(key);
        this._values.push(value);
    };
    Dictionary.prototype.remove = function (key) {
        var index = this._keys.indexOf(key, 0);
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        delete this[key];
    };
    Dictionary.prototype.getValue = function (key) {
        return this[key];
    };
    Dictionary.prototype.keys = function () {
        return this._keys;
    };
    Dictionary.prototype.values = function () {
        return this._values;
    };
    Dictionary.prototype.containsKey = function (key) {
        if (typeof this[key] === "undefined") {
            return false;
        }
        return true;
    };
    Dictionary.prototype.toLookup = function () {
        return this;
    };
    return Dictionary;
})();
exports.Dictionary = Dictionary;

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="Collections.ts"/>
var Collections = require("Collections");
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

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EventStore = require("../EventStore/EventStore");
/* events */
var ItemCreated = (function (_super) {
    __extends(ItemCreated, _super);
    function ItemCreated(sku, description) {
        _super.call(this);
        this.sku = sku;
        this.description = description;
    }
    ItemCreated.Type = new ItemCreated(null, null);
    return ItemCreated;
})(EventStore.Event);
exports.ItemCreated = ItemCreated;
var ItemDisabled = (function (_super) {
    __extends(ItemDisabled, _super);
    function ItemDisabled() {
        _super.call(this);
    }
    ItemDisabled.Type = new ItemDisabled();
    return ItemDisabled;
})(EventStore.Event);
exports.ItemDisabled = ItemDisabled;
var ItemLoaded = (function (_super) {
    __extends(ItemLoaded, _super);
    function ItemLoaded(quantity) {
        _super.call(this);
        this.quantity = quantity;
    }
    ItemLoaded.Type = new ItemLoaded(0);
    return ItemLoaded;
})(EventStore.Event);
exports.ItemLoaded = ItemLoaded;
var ItemPicked = (function (_super) {
    __extends(ItemPicked, _super);
    function ItemPicked(quantity) {
        _super.call(this);
        this.quantity = quantity;
    }
    ItemPicked.Type = new ItemPicked(0);
    return ItemPicked;
})(EventStore.Event);
exports.ItemPicked = ItemPicked;
var ItemPickingFailed = (function (_super) {
    __extends(ItemPickingFailed, _super);
    function ItemPickingFailed(requested, inStock) {
        _super.call(this);
        this.requested = requested;
        this.inStock = inStock;
    }
    ItemPickingFailed.Type = new ItemPickingFailed(0, 0);
    return ItemPickingFailed;
})(EventStore.Event);
exports.ItemPickingFailed = ItemPickingFailed;

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Collections = require("../EventStore/Collections");
var EventStore = require("../EventStore/EventStore");
var Events = require("events");
function padStringRight(str, len) {
    var padding = "                             ";
    return (str + padding).slice(0, len);
}
function padNumberLeft(v, len) {
    return padStringLeft('' + v, len);
}
function padStringLeft(str, len) {
    var padding = "                             ";
    return padding.slice(0, len - str.length) + str;
}
var ItemsList = (function (_super) {
    __extends(ItemsList, _super);
    function ItemsList() {
        var _this = this;
        _super.call(this);
        this.allItems = new Collections.Dictionary();
        this.On(Events.ItemCreated.Type, function (e) {
            _this.allItems.add(e.streamId, {
                id: e.sku,
                description: e.description,
                active: true,
                inStock: 0
            });
        });
        this.On(Events.ItemDisabled.Type, function (e) {
            return _this.allItems.getValue(e.streamId).active = false;
        });
        this.On(EventStore.Event.Type, function (e) {
            console.log('generic handler for ', e);
        });
        this.On(Events.ItemLoaded.Type, function (e) {
            return _this.allItems.getValue(e.streamId).inStock += e.quantity;
        });
        this.On(Events.ItemPicked.Type, function (e) {
            return _this.allItems.getValue(e.streamId).inStock -= e.quantity;
        });
    }
    ItemsList.prototype.print = function () {
        console.log("----------------------------");
        console.log("Item list");
        console.log("----------------------------");
        var text = "==========================================================\n";
        text += padStringRight("Id", 10) + " | " + padStringRight("Description", 32) + " | " + padStringLeft("In Stock", 10) + "\n";
        text += "----------------------------------------------------------\n";
        this.allItems.values().forEach(function (e) {
            text += padStringRight(e.id, 10) + " | " + padStringRight(e.description, 32) + " | " + padNumberLeft(e.inStock, 10) + "\n";
        });
        text += "==========================================================\n";
        var pre = document.createElement('pre');
        pre.innerText = text;
        document.body.appendChild(pre);
    };
    return ItemsList;
})(EventStore.Projection);
exports.ItemsList = ItemsList;

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EventStore = require("../EventStore/EventStore");
/* Commands */
var RegisterItem = (function (_super) {
    __extends(RegisterItem, _super);
    function RegisterItem(itemId, sku, description) {
        _super.call(this);
        this.itemId = itemId;
        this.sku = sku;
        this.description = description;
        this.__registerItem = null;
    }
    RegisterItem.Type = new RegisterItem(null, null, null);
    return RegisterItem;
})(EventStore.Command);
exports.RegisterItem = RegisterItem;
var DisableItem = (function (_super) {
    __extends(DisableItem, _super);
    function DisableItem(itemId) {
        _super.call(this);
        this.itemId = itemId;
        this.__disableItem = null;
    }
    DisableItem.Type = new DisableItem(null);
    return DisableItem;
})(EventStore.Command);
exports.DisableItem = DisableItem;
var LoadItem = (function (_super) {
    __extends(LoadItem, _super);
    function LoadItem(itemId, quantity) {
        _super.call(this);
        this.itemId = itemId;
        this.quantity = quantity;
        this.__loadItem = null;
    }
    LoadItem.Type = new LoadItem(null, 0);
    return LoadItem;
})(EventStore.Command);
exports.LoadItem = LoadItem;
var PickItem = (function (_super) {
    __extends(PickItem, _super);
    function PickItem(itemId, quantity) {
        _super.call(this);
        this.itemId = itemId;
        this.quantity = quantity;
        this.__loadItem = null;
    }
    PickItem.Type = new PickItem(null, 0);
    return PickItem;
})(EventStore.Command);
exports.PickItem = PickItem;

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EventStore = require("../EventStore/EventStore");
var Events = require("events");
/* state & aggregate */
var ItemState = (function (_super) {
    __extends(ItemState, _super);
    function ItemState() {
        var _this = this;
        _super.call(this);
        this.disabled = false;
        this.inStock = 0;
        this.sku = null;
        this.On(Events.ItemDisabled.Type, function (e) { return _this.disabled = true; });
        this.On(Events.ItemLoaded.Type, function (e) { return _this.inStock += e.quantity; });
        this.On(Events.ItemPicked.Type, function (e) { return _this.inStock -= e.quantity; });
        this.On(Events.ItemCreated.Type, function (e) { return _this.sku = e.sku; });
        this.addCheck({ name: "Item must have a SKU", rule: function () {
                return _this.sku != null;
            }
        });
        this.addCheck({ name: "Item in stock must not be disabled", rule: function () {
                return _this.stockLevel() == 0 || (_this.stockLevel() > 0 && !_this.hasBeenDisabled());
            }
        });
    }
    ItemState.prototype.hasBeenDisabled = function () { return this.disabled; };
    ;
    ItemState.prototype.stockLevel = function () { return this.inStock; };
    return ItemState;
})(EventStore.AggregateState);
exports.ItemState = ItemState;
/* AGGREGATE */
var Item = (function (_super) {
    __extends(Item, _super);
    function Item(id) {
        _super.call(this, id, new ItemState());
    }
    Item.prototype.register = function (id, description) {
        this.RaiseEvent(new Events.ItemCreated(id, description));
    };
    Item.prototype.disable = function () {
        if (!this.State.hasBeenDisabled()) {
            this.RaiseEvent(new Events.ItemDisabled());
        }
    };
    Item.prototype.load = function (quantity) {
        Error();
        this.RaiseEvent(new Events.ItemLoaded(quantity));
    };
    Item.prototype.unLoad = function (quantity) {
        var currentStock = this.State.stockLevel();
        if (currentStock >= quantity) {
            this.RaiseEvent(new Events.ItemPicked(quantity));
        }
        else {
            this.RaiseEvent(new Events.ItemPickingFailed(quantity, currentStock));
        }
    };
    Item.prototype.Factory = function (id) {
        return new Item(id);
    };
    Item.Type = new Item(null);
    return Item;
})(EventStore.Aggregate);
exports.Item = Item;

var EventStore = require("../EventStore/EventStore");
var Commands = require("commands");
var item_1 = require("item");
/* handlers */
var RegisterItemHandler = (function () {
    function RegisterItemHandler(bus) {
        bus.On(Commands.RegisterItem.Type, this);
    }
    RegisterItemHandler.prototype.Handle = function (command) {
        var item = EventStore.Repository.getById(item_1.Item.Type, command.itemId);
        item.register(command.sku, command.description);
        EventStore.Repository.save(item, command.commandId, function (h) {
            h.add('ts', Date());
        });
    };
    return RegisterItemHandler;
})();
exports.RegisterItemHandler = RegisterItemHandler;
var DisableItemHandler = (function () {
    function DisableItemHandler(bus) {
        bus.On(Commands.DisableItem.Type, this);
    }
    DisableItemHandler.prototype.Handle = function (command) {
        var item = EventStore.Repository.getById(item_1.Item.Type, command.itemId);
        item.disable();
        EventStore.Repository.save(item, command.commandId, function (h) {
            h.add('ts', Date());
        });
    };
    return DisableItemHandler;
})();
exports.DisableItemHandler = DisableItemHandler;
var LoadItemHandler = (function () {
    function LoadItemHandler(bus) {
        bus.On(Commands.LoadItem.Type, this);
    }
    LoadItemHandler.prototype.Handle = function (command) {
        var item = EventStore.Repository.getById(item_1.Item.Type, command.itemId);
        item.load(command.quantity);
        EventStore.Repository.save(item, command.commandId);
    };
    return LoadItemHandler;
})();
exports.LoadItemHandler = LoadItemHandler;
var PickItemHandler = (function () {
    function PickItemHandler(bus) {
        bus.On(Commands.PickItem.Type, this);
    }
    PickItemHandler.prototype.Handle = function (command) {
        var item = EventStore.Repository.getById(item_1.Item.Type, command.itemId);
        item.unLoad(command.quantity);
        EventStore.Repository.save(item, command.commandId);
    };
    return PickItemHandler;
})();
exports.PickItemHandler = PickItemHandler;
var HandlersRegistration = (function () {
    function HandlersRegistration() {
    }
    HandlersRegistration.Register = function (bus) {
        new RegisterItemHandler(bus);
        new DisableItemHandler(bus);
        new LoadItemHandler(bus);
        new PickItemHandler(bus);
    };
    return HandlersRegistration;
})();
exports.HandlersRegistration = HandlersRegistration;

var EventStore = require("./EventStore/EventStore");
var Projections = require("./Inventory/projections");
var handlers_1 = require("./Inventory/handlers");
var Commands = require("./Inventory/commands");
var bus = EventStore.Bus.Default;
var itemsList = new Projections.ItemsList();
function configure() {
    /* Handlers setup */
    handlers_1.HandlersRegistration.Register(bus);
    bus.subscribe(itemsList);
}
function run() {
    try {
        bus.send(new Commands.RegisterItem("item_1", "TS", "Intro to typescript"));
        bus.send(new Commands.RegisterItem("item_2", "NG", "Intro to angularjs"));
        bus.send(new Commands.LoadItem("item_1", 100));
        bus.send(new Commands.PickItem("item_1", 69));
        bus.send(new Commands.DisableItem("item_1"));
    }
    catch (error) {
        console.error(error.message);
    }
    itemsList.print();
}
configure();
run();
EventStore.Persistence.dump();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50c3RvcmUvQ29sbGVjdGlvbnMudHMiLCJldmVudHN0b3JlL0V2ZW50U3RvcmUudHMiLCJpbnZlbnRvcnkvZXZlbnRzLnRzIiwiaW52ZW50b3J5L3Byb2plY3Rpb25zLnRzIiwiaW52ZW50b3J5L2NvbW1hbmRzLnRzIiwiaW52ZW50b3J5L0l0ZW0udHMiLCJpbnZlbnRvcnkvaGFuZGxlcnMudHMiLCJNYWluLnRzIl0sIm5hbWVzIjpbIkRpY3Rpb25hcnkiLCJEaWN0aW9uYXJ5LmNvbnN0cnVjdG9yIiwiRGljdGlvbmFyeS5hZGQiLCJEaWN0aW9uYXJ5LnJlbW92ZSIsIkRpY3Rpb25hcnkuZ2V0VmFsdWUiLCJEaWN0aW9uYXJ5LmtleXMiLCJEaWN0aW9uYXJ5LnZhbHVlcyIsIkRpY3Rpb25hcnkuY29udGFpbnNLZXkiLCJEaWN0aW9uYXJ5LnRvTG9va3VwIiwiZ2V0VHlwZSIsImdldENsYXNzTmFtZSIsIkRvbWFpbkVycm9yIiwiRG9tYWluRXJyb3IuY29uc3RydWN0b3IiLCJJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiIsIkludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uLmNvbnN0cnVjdG9yIiwiQ29tbWFuZCIsIkNvbW1hbmQuY29uc3RydWN0b3IiLCJDb21tYW5kLkdldFR5cGUiLCJFdmVudCIsIkV2ZW50LmNvbnN0cnVjdG9yIiwiRXZlbnQuR2V0VHlwZSIsIlByb2plY3Rpb24iLCJQcm9qZWN0aW9uLmNvbnN0cnVjdG9yIiwiUHJvamVjdGlvbi5PbiIsIlByb2plY3Rpb24uSGFuZGxlIiwiUHJvamVjdGlvbi5IYW5kbGVFdmVudCIsIkFnZ3JlZ2F0ZVN0YXRlIiwiQWdncmVnYXRlU3RhdGUuY29uc3RydWN0b3IiLCJBZ2dyZWdhdGVTdGF0ZS5hcHBseSIsIkFnZ3JlZ2F0ZVN0YXRlLmFkZENoZWNrIiwiQWdncmVnYXRlU3RhdGUuY2hlY2tJbnZhcmlhbnRzIiwiQWdncmVnYXRlIiwiQWdncmVnYXRlLmNvbnN0cnVjdG9yIiwiQWdncmVnYXRlLlJhaXNlRXZlbnQiLCJBZ2dyZWdhdGUubG9hZEZyb21FdmVudHMiLCJBZ2dyZWdhdGUuZ2V0QWdncmVnYXRlVHlwZSIsIkFnZ3JlZ2F0ZS5nZXRBZ2dyZWdhdGVJZCIsIkFnZ3JlZ2F0ZS5nZXRVbmNvbW1pdGVkRXZlbnRzIiwiQWdncmVnYXRlLmNoZWNrSW52YXJpYW50cyIsIlN0cmVhbSIsIlN0cmVhbS5jb25zdHJ1Y3RvciIsIlN0cmVhbS5nZXRTdHJlYW1JZCIsIlN0cmVhbS5nZXRFdmVudHMiLCJTdHJlYW0uY29tbWl0IiwiUGVyc2lzdGVuY2UiLCJQZXJzaXN0ZW5jZS5jb25zdHJ1Y3RvciIsIlBlcnNpc3RlbmNlLm9wZW5TdHJlYW0iLCJQZXJzaXN0ZW5jZS5kdW1wIiwiUmVwb3NpdG9yeSIsIlJlcG9zaXRvcnkuY29uc3RydWN0b3IiLCJSZXBvc2l0b3J5LmdldEJ5SWQiLCJSZXBvc2l0b3J5LnNhdmUiLCJCdXMiLCJCdXMuY29uc3RydWN0b3IiLCJCdXMuc2VuZCIsIkJ1cy5wdWJsaXNoIiwiQnVzLnN1YnNjcmliZSIsIkJ1cy5PbiIsIkl0ZW1DcmVhdGVkIiwiSXRlbUNyZWF0ZWQuY29uc3RydWN0b3IiLCJJdGVtRGlzYWJsZWQiLCJJdGVtRGlzYWJsZWQuY29uc3RydWN0b3IiLCJJdGVtTG9hZGVkIiwiSXRlbUxvYWRlZC5jb25zdHJ1Y3RvciIsIkl0ZW1QaWNrZWQiLCJJdGVtUGlja2VkLmNvbnN0cnVjdG9yIiwiSXRlbVBpY2tpbmdGYWlsZWQiLCJJdGVtUGlja2luZ0ZhaWxlZC5jb25zdHJ1Y3RvciIsInBhZFN0cmluZ1JpZ2h0IiwicGFkTnVtYmVyTGVmdCIsInBhZFN0cmluZ0xlZnQiLCJJdGVtc0xpc3QiLCJJdGVtc0xpc3QuY29uc3RydWN0b3IiLCJJdGVtc0xpc3QucHJpbnQiLCJSZWdpc3Rlckl0ZW0iLCJSZWdpc3Rlckl0ZW0uY29uc3RydWN0b3IiLCJEaXNhYmxlSXRlbSIsIkRpc2FibGVJdGVtLmNvbnN0cnVjdG9yIiwiTG9hZEl0ZW0iLCJMb2FkSXRlbS5jb25zdHJ1Y3RvciIsIlBpY2tJdGVtIiwiUGlja0l0ZW0uY29uc3RydWN0b3IiLCJJdGVtU3RhdGUiLCJJdGVtU3RhdGUuY29uc3RydWN0b3IiLCJJdGVtU3RhdGUuaGFzQmVlbkRpc2FibGVkIiwiSXRlbVN0YXRlLnN0b2NrTGV2ZWwiLCJJdGVtIiwiSXRlbS5jb25zdHJ1Y3RvciIsIkl0ZW0ucmVnaXN0ZXIiLCJJdGVtLmRpc2FibGUiLCJJdGVtLmxvYWQiLCJJdGVtLnVuTG9hZCIsIkl0ZW0uRmFjdG9yeSIsIlJlZ2lzdGVySXRlbUhhbmRsZXIiLCJSZWdpc3Rlckl0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiUmVnaXN0ZXJJdGVtSGFuZGxlci5IYW5kbGUiLCJEaXNhYmxlSXRlbUhhbmRsZXIiLCJEaXNhYmxlSXRlbUhhbmRsZXIuY29uc3RydWN0b3IiLCJEaXNhYmxlSXRlbUhhbmRsZXIuSGFuZGxlIiwiTG9hZEl0ZW1IYW5kbGVyIiwiTG9hZEl0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiTG9hZEl0ZW1IYW5kbGVyLkhhbmRsZSIsIlBpY2tJdGVtSGFuZGxlciIsIlBpY2tJdGVtSGFuZGxlci5jb25zdHJ1Y3RvciIsIlBpY2tJdGVtSGFuZGxlci5IYW5kbGUiLCJIYW5kbGVyc1JlZ2lzdHJhdGlvbiIsIkhhbmRsZXJzUmVnaXN0cmF0aW9uLmNvbnN0cnVjdG9yIiwiSGFuZGxlcnNSZWdpc3RyYXRpb24uUmVnaXN0ZXIiLCJjb25maWd1cmUiLCJydW4iXSwibWFwcGluZ3MiOiJBQVNBO0lBS0NBLG9CQUFZQSxJQUEyRUE7UUFBM0VDLG9CQUEyRUEsR0FBM0VBLFdBQXlDQSxLQUFLQSxFQUE2QkE7UUFIdkZBLFVBQUtBLEdBQWFBLElBQUlBLEtBQUtBLEVBQVVBLENBQUNBO1FBQ3RDQSxZQUFPQSxHQUFRQSxJQUFJQSxLQUFLQSxFQUFLQSxDQUFDQTtRQUk3QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDVkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQ3RDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUN0Q0EsQ0FBQ0E7UUFDRkEsQ0FBQ0E7SUFDRkEsQ0FBQ0E7SUFFREQsd0JBQUdBLEdBQUhBLFVBQUlBLEdBQVdBLEVBQUVBLEtBQVFBO1FBQ3hCRSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDckJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO0lBQzFCQSxDQUFDQTtJQUVERiwyQkFBTUEsR0FBTkEsVUFBT0EsR0FBV0E7UUFDakJHLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM1QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFFOUJBLE9BQU9BLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ2xCQSxDQUFDQTtJQUVESCw2QkFBUUEsR0FBUkEsVUFBU0EsR0FBV0E7UUFDbkJJLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ2xCQSxDQUFDQTtJQUVESix5QkFBSUEsR0FBSkE7UUFDQ0ssTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7SUFDbkJBLENBQUNBO0lBRURMLDJCQUFNQSxHQUFOQTtRQUNDTSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQTtJQUNyQkEsQ0FBQ0E7SUFFRE4sZ0NBQVdBLEdBQVhBLFVBQVlBLEdBQVdBO1FBQ3RCTyxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0Q0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDYkEsQ0FBQ0E7SUFFRFAsNkJBQVFBLEdBQVJBO1FBQ0NRLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2JBLENBQUNBO0lBQ0ZSLGlCQUFDQTtBQUFEQSxDQW5EQSxBQW1EQ0EsSUFBQTtBQW5EWSxrQkFBVSxhQW1EdEIsQ0FBQTs7Ozs7Ozs7QUM1REQsQUFDQSxzQ0FEc0M7QUFDdEMsSUFBWSxXQUFXLFdBQU0sYUFBYSxDQUFDLENBQUE7QUEyQjNDLHFCQUFxQjtBQUNyQjs7R0FFRztBQUNILGlCQUFpQixDQUFDO0lBQ2pCUyxJQUFJQSxhQUFhQSxHQUFHQSxvQkFBb0JBLENBQUNBO0lBQ3pDQSxJQUFJQSxPQUFPQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFRQSxDQUFFQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNyRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsT0FBT0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7QUFDMURBLENBQUNBO0FBRUQ7O0dBRUc7QUFDSCxzQkFBc0IsQ0FBQztJQUN0QkMsSUFBSUEsYUFBYUEsR0FBR0Esb0JBQW9CQSxDQUFDQTtJQUN6Q0EsSUFBSUEsT0FBT0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBUUEsQ0FBRUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFDekRBLE1BQU1BLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLE9BQU9BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO0FBQzFEQSxDQUFDQTtBQUVEO0lBR0NDLHFCQUFtQkEsT0FBZ0JBO1FBQWhCQyxZQUFPQSxHQUFQQSxPQUFPQSxDQUFTQTtRQUNsQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDM0JBLENBQUNBO0lBQ0ZELGtCQUFDQTtBQUFEQSxDQU5BLEFBTUNBLElBQUE7QUFOWSxtQkFBVyxjQU12QixDQUFBO0FBRUQ7SUFBZ0RFLDhDQUFXQTtJQUEzREE7UUFBZ0RDLDhCQUFXQTtRQUMxREEsK0JBQTBCQSxHQUFHQSxFQUFFQSxDQUFDQTtJQUNqQ0EsQ0FBQ0E7SUFBREQsaUNBQUNBO0FBQURBLENBRkEsQUFFQ0EsRUFGK0MsV0FBVyxFQUUxRDtBQUZZLGtDQUEwQiw2QkFFdEMsQ0FBQTtBQUVEO0lBSUNFO1FBQ0NDLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLE1BQU1BLEdBQUdBLE9BQU9BLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBO0lBQ3BEQSxDQUFDQTtJQUVERCx5QkFBT0EsR0FBUEE7UUFDQ0UsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDdEJBLENBQUNBO0lBVE1GLHNCQUFjQSxHQUFXQSxDQUFDQSxDQUFDQTtJQVVuQ0EsY0FBQ0E7QUFBREEsQ0FYQSxBQVdDQSxJQUFBO0FBWFksZUFBTyxVQVduQixDQUFBO0FBR0Q7SUFLQ0c7UUFDQ0MsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsTUFBTUEsR0FBR0EsS0FBS0EsQ0FBQ0EsWUFBWUEsRUFBRUEsQ0FBQ0E7SUFDOUNBLENBQUNBO0lBRURELHVCQUFPQSxHQUFQQTtRQUNDRSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUN0QkEsQ0FBQ0E7SUFWTUYsa0JBQVlBLEdBQVdBLENBQUNBLENBQUNBO0lBQ3pCQSxVQUFJQSxHQUFVQSxJQUFJQSxLQUFLQSxFQUFFQSxDQUFDQTtJQVVsQ0EsWUFBQ0E7QUFBREEsQ0FaQSxBQVlDQSxJQUFBO0FBWlksYUFBSyxRQVlqQixDQUFBO0FBRUQ7SUFBQUc7UUFDU0MsYUFBUUEsR0FBaUNBLElBQUlBLEtBQUtBLEVBQXlCQSxDQUFDQTtJQWdCckZBLENBQUNBO0lBZlVELHVCQUFFQSxHQUFaQSxVQUErQkEsS0FBUUEsRUFBRUEsT0FBeUJBO1FBQ2pFRSxJQUFJQSxJQUFJQSxHQUFHQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUMxQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsT0FBT0EsQ0FBQ0E7SUFDL0JBLENBQUNBO0lBRU1GLDJCQUFNQSxHQUFiQSxVQUFjQSxLQUFhQTtRQUMxQkcsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFDQTtJQUVPSCxnQ0FBV0EsR0FBbkJBLFVBQW9CQSxRQUFnQkEsRUFBRUEsS0FBYUE7UUFDbERJLElBQUlBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQTtZQUNYQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtJQUNqQkEsQ0FBQ0E7SUFDRkosaUJBQUNBO0FBQURBLENBakJBLEFBaUJDQSxJQUFBO0FBakJZLGtCQUFVLGFBaUJ0QixDQUFBO0FBY0Q7SUFBb0NLLGtDQUFVQTtJQUE5Q0E7UUFBb0NDLDhCQUFVQTtRQUNyQ0EsWUFBT0EsR0FBR0EsSUFBSUEsS0FBS0EsRUFBa0JBLENBQUNBO0lBaUIvQ0EsQ0FBQ0E7SUFoQkFELDhCQUFLQSxHQUFMQSxVQUFNQSxLQUFhQTtRQUNsQkUsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDcEJBLENBQUNBO0lBRVNGLGlDQUFRQSxHQUFsQkEsVUFBbUJBLEtBQXFCQTtRQUN2Q0csSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBRURILHdDQUFlQSxHQUFmQTtRQUNDSSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxDQUFDQTtZQUNyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2ZBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLHNCQUFzQkEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pEQSxNQUFNQSxJQUFJQSwwQkFBMEJBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQzlDQSxDQUFDQTtRQUNGQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNKQSxDQUFDQTtJQUNGSixxQkFBQ0E7QUFBREEsQ0FsQkEsQUFrQkNBLEVBbEJtQyxVQUFVLEVBa0I3QztBQWxCWSxzQkFBYyxpQkFrQjFCLENBQUE7QUFPRDtJQUdDSyxtQkFBc0JBLFdBQW1CQSxFQUFZQSxLQUFhQTtRQUE1Q0MsZ0JBQVdBLEdBQVhBLFdBQVdBLENBQVFBO1FBQVlBLFVBQUtBLEdBQUxBLEtBQUtBLENBQVFBO1FBRjFEQSxXQUFNQSxHQUFrQkEsSUFBSUEsS0FBS0EsRUFBVUEsQ0FBQ0E7SUFJcERBLENBQUNBO0lBRVNELDhCQUFVQSxHQUFwQkEsVUFBcUJBLEtBQWFBO1FBQ2pDRSxLQUFLQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQTtRQUNsQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDeEJBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO0lBQ3pCQSxDQUFDQTtJQUVERixrQ0FBY0EsR0FBZEEsVUFBZUEsTUFBZ0JBO1FBQS9CRyxpQkFFQ0E7UUFEQUEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBR0EsT0FBQUEsS0FBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBbkJBLENBQW1CQSxDQUFDQSxDQUFDQTtJQUN6Q0EsQ0FBQ0E7SUFFREgsb0NBQWdCQSxHQUFoQkE7UUFDQ0ksTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDdEJBLENBQUNBO0lBQ0RKLGtDQUFjQSxHQUFkQTtRQUNDSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQTtJQUN6QkEsQ0FBQ0E7SUFDREwsdUNBQW1CQSxHQUFuQkE7UUFDQ00sTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDcEJBLENBQUNBO0lBQ0ROLG1DQUFlQSxHQUFmQTtRQUNDTyxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtJQUM5QkEsQ0FBQ0E7SUFDRlAsZ0JBQUNBO0FBQURBLENBN0JBLEFBNkJDQSxJQUFBO0FBN0JZLGlCQUFTLFlBNkJyQixDQUFBO0FBTUEsQ0FBQztBQUVGO0lBSUNRLGdCQUFzQkEsUUFBZ0JBO1FBQWhCQyxhQUFRQSxHQUFSQSxRQUFRQSxDQUFRQTtRQUg5QkEsWUFBT0EsR0FBR0EsSUFBSUEsS0FBS0EsRUFBV0EsQ0FBQ0E7UUFDL0JBLFdBQU1BLEdBQUdBLElBQUlBLEtBQUtBLEVBQVVBLENBQUNBO0lBSXJDQSxDQUFDQTtJQUVERCw0QkFBV0EsR0FBWEEsY0FBZ0JFLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO0lBRXZDRiwwQkFBU0EsR0FBVEE7UUFDQ0csTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDcEJBLENBQUNBO0lBRURILHVCQUFNQSxHQUFOQSxVQUNDQSxNQUFxQkEsRUFDckJBLFFBQWdCQSxFQUNoQkEsY0FBNkRBO1FBRTdESSxJQUFJQSxNQUFNQSxHQUFZQTtZQUNyQkEsUUFBUUEsRUFBRUEsUUFBUUE7WUFDbEJBLE1BQU1BLEVBQUVBLE1BQU1BO1lBQ2RBLE9BQU9BLEVBQUVBLElBQUlBLFdBQVdBLENBQUNBLFVBQVVBLEVBQVVBO1NBQzdDQSxDQUFDQTtRQUVGQSxFQUFFQSxDQUFDQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNwQkEsY0FBY0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzFCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUN6Q0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsY0FBY0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFFcENBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQ2ZBLENBQUNBO0lBQ0ZKLGFBQUNBO0FBQURBLENBbENBLEFBa0NDQSxJQUFBO0FBbENZLGNBQU0sU0FrQ2xCLENBQUE7QUFFRDtJQUFBSztJQWFBQyxDQUFDQTtJQVhPRCxzQkFBVUEsR0FBakJBLFVBQWtCQSxFQUFVQTtRQUMzQkUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLElBQUlBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3RDQSxDQUFDQTtRQUVEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNsQ0EsQ0FBQ0E7SUFFTUYsZ0JBQUlBLEdBQVhBO1FBQ0NHLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLE9BQU9BLENBQUNBLFVBQUFBLENBQUNBLElBQU1BLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLEdBQUdBLENBQUNBLENBQUNBLFdBQVdBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQ3JGQSxDQUFDQTtJQVhjSCxtQkFBT0EsR0FBR0EsSUFBSUEsV0FBV0EsQ0FBQ0EsVUFBVUEsRUFBVUEsQ0FBQ0E7SUFZL0RBLGtCQUFDQTtBQUFEQSxDQWJBLEFBYUNBLElBQUE7QUFiWSxtQkFBVyxjQWF2QixDQUFBO0FBRUQ7SUFBQUk7SUFnQ0FDLENBQUNBO0lBL0JPRCxrQkFBT0EsR0FBZEEsVUFBNENBLElBQU9BLEVBQUVBLEVBQVVBO1FBQzlERSxJQUFJQSxNQUFNQSxHQUFHQSxXQUFXQSxDQUFDQSxVQUFVQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUN4Q0EsSUFBSUEsU0FBU0EsR0FBTUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFFcENBLFNBQVNBLENBQUNBLGNBQWNBLENBQUNBLE1BQU1BLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBLENBQUNBO1FBRTdDQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQTtJQUNsQkEsQ0FBQ0E7SUFFTUYsZUFBSUEsR0FBWEEsVUFBWUEsU0FBcUJBLEVBQUVBLFFBQWdCQSxFQUFFQSxjQUE2REE7UUFDakhHLElBQUlBLEVBQUVBLEdBQUdBLFNBQVNBLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxnQkFBZ0JBLEVBQUVBLENBQUNBO1FBQ3hDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxTQUFTQSxHQUFHQSxJQUFJQSxHQUFHQSxHQUFHQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUUvQ0Esb0JBQW9CQTtRQUNwQkEsU0FBU0EsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0E7UUFFNUJBLGlCQUFpQkE7UUFDakJBLElBQUlBLE1BQU1BLEdBQUdBLFdBQVdBLENBQUNBLFVBQVVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQ3hDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxtQkFBbUJBLEVBQUVBLEVBQUVBLFFBQVFBLEVBQUVBLFVBQUFBLENBQUNBO1lBQ3pEQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNwQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BCQSxjQUFjQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuQkEsQ0FBQ0E7UUFDRkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFFSEEsaUNBQWlDQTtRQUNqQ0EsU0FBU0EsQ0FBQ0EsbUJBQW1CQSxFQUFFQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxDQUFDQTtZQUN4Q0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDeEJBLENBQUNBLENBQUNBLENBQUNBO0lBQ0pBLENBQUNBO0lBQ0ZILGlCQUFDQTtBQUFEQSxDQWhDQSxBQWdDQ0EsSUFBQTtBQWhDWSxrQkFBVSxhQWdDdEIsQ0FBQTtBQUdEO0lBQUFJO1FBRVNDLGNBQVNBLEdBQUdBLElBQUlBLEtBQUtBLEVBQWNBLENBQUNBO1FBQ3BDQSxhQUFRQSxHQUFHQSxJQUFJQSxXQUFXQSxDQUFDQSxVQUFVQSxFQUE2QkEsQ0FBQ0E7SUF3QjVFQSxDQUFDQTtJQXRCQUQsa0JBQUlBLEdBQUpBLFVBQUtBLE9BQWlCQTtRQUNyQkUsSUFBSUEsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDNUJBLElBQUlBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNkQSxNQUFNQSxzQkFBc0JBLEdBQUdBLElBQUlBLENBQUNBO1FBQ3JDQSxDQUFDQTtRQUVEQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUN6QkEsQ0FBQ0E7SUFFREYscUJBQU9BLEdBQVBBLFVBQVFBLEtBQWFBO1FBQ3BCRyxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxRQUFRQSxJQUFHQSxPQUFBQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxFQUF0QkEsQ0FBc0JBLENBQUNBLENBQUNBO0lBQzNEQSxDQUFDQTtJQUVESCx1QkFBU0EsR0FBVEEsVUFBVUEsUUFBb0JBO1FBQzdCSSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtJQUMvQkEsQ0FBQ0E7SUFFREosZ0JBQUVBLEdBQUZBLFVBQXVCQSxPQUFVQSxFQUFFQSxPQUEyQkE7UUFDN0RLLElBQUlBLElBQUlBLEdBQUdBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQzVCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUNsQ0EsQ0FBQ0E7SUF6Qk1MLFdBQU9BLEdBQUdBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO0lBMEI1QkEsVUFBQ0E7QUFBREEsQ0EzQkEsQUEyQkNBLElBQUE7QUEzQlksV0FBRyxNQTJCZixDQUFBOzs7Ozs7OztBQ3JTRCxJQUFZLFVBQVUsV0FBTSwwQkFJM0IsQ0FBQyxDQUpvRDtBQUdyRCxZQUFZO0FBQ1o7SUFBaUNNLCtCQUFnQkE7SUFFaERBLHFCQUFtQkEsR0FBV0EsRUFBU0EsV0FBbUJBO1FBQ3pEQyxpQkFBT0EsQ0FBQ0E7UUFEVUEsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBUUE7UUFBU0EsZ0JBQVdBLEdBQVhBLFdBQVdBLENBQVFBO0lBRTFEQSxDQUFDQTtJQUhNRCxnQkFBSUEsR0FBZ0JBLElBQUlBLFdBQVdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO0lBSXhEQSxrQkFBQ0E7QUFBREEsQ0FMQSxBQUtDQSxFQUxnQyxVQUFVLENBQUMsS0FBSyxFQUtoRDtBQUxZLG1CQUFXLGNBS3ZCLENBQUE7QUFFRDtJQUFrQ0UsZ0NBQWdCQTtJQUVqREE7UUFDQ0MsaUJBQU9BLENBQUNBO0lBQ1RBLENBQUNBO0lBSE1ELGlCQUFJQSxHQUFpQkEsSUFBSUEsWUFBWUEsRUFBRUEsQ0FBQ0E7SUFJaERBLG1CQUFDQTtBQUFEQSxDQUxBLEFBS0NBLEVBTGlDLFVBQVUsQ0FBQyxLQUFLLEVBS2pEO0FBTFksb0JBQVksZUFLeEIsQ0FBQTtBQUVEO0lBQWdDRSw4QkFBZ0JBO0lBRS9DQSxvQkFBbUJBLFFBQWdCQTtRQUNsQ0MsaUJBQU9BLENBQUNBO1FBRFVBLGFBQVFBLEdBQVJBLFFBQVFBLENBQVFBO0lBRW5DQSxDQUFDQTtJQUhNRCxlQUFJQSxHQUFlQSxJQUFJQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUk3Q0EsaUJBQUNBO0FBQURBLENBTEEsQUFLQ0EsRUFMK0IsVUFBVSxDQUFDLEtBQUssRUFLL0M7QUFMWSxrQkFBVSxhQUt0QixDQUFBO0FBR0Q7SUFBZ0NFLDhCQUFnQkE7SUFFL0NBLG9CQUFtQkEsUUFBZ0JBO1FBQ2xDQyxpQkFBT0EsQ0FBQ0E7UUFEVUEsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBUUE7SUFFbkNBLENBQUNBO0lBSE1ELGVBQUlBLEdBQWVBLElBQUlBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBSTdDQSxpQkFBQ0E7QUFBREEsQ0FMQSxBQUtDQSxFQUwrQixVQUFVLENBQUMsS0FBSyxFQUsvQztBQUxZLGtCQUFVLGFBS3RCLENBQUE7QUFDRDtJQUF1Q0UscUNBQWdCQTtJQUV0REEsMkJBQW1CQSxTQUFpQkEsRUFBU0EsT0FBZUE7UUFDM0RDLGlCQUFPQSxDQUFDQTtRQURVQSxjQUFTQSxHQUFUQSxTQUFTQSxDQUFRQTtRQUFTQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUFRQTtJQUU1REEsQ0FBQ0E7SUFITUQsc0JBQUlBLEdBQXNCQSxJQUFJQSxpQkFBaUJBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO0lBSTlEQSx3QkFBQ0E7QUFBREEsQ0FMQSxBQUtDQSxFQUxzQyxVQUFVLENBQUMsS0FBSyxFQUt0RDtBQUxZLHlCQUFpQixvQkFLN0IsQ0FBQTs7Ozs7Ozs7QUNyQ0YsSUFBWSxXQUFXLFdBQU0sMkJBQzdCLENBQUMsQ0FEdUQ7QUFDeEQsSUFBWSxVQUFVLFdBQU0sMEJBQzVCLENBQUMsQ0FEcUQ7QUFDdEQsSUFBWSxNQUFNLFdBQU0sUUFFeEIsQ0FBQyxDQUYrQjtBQUVoQyx3QkFBd0IsR0FBVyxFQUFFLEdBQVc7SUFDL0NFLElBQU1BLE9BQU9BLEdBQUdBLCtCQUErQkEsQ0FBQ0E7SUFDaERBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLE9BQU9BLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO0FBQ3RDQSxDQUFDQTtBQUVELHVCQUF1QixDQUFTLEVBQUUsR0FBVztJQUM1Q0MsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7QUFDbkNBLENBQUNBO0FBRUQsdUJBQXVCLEdBQVcsRUFBRSxHQUFXO0lBQzlDQyxJQUFNQSxPQUFPQSxHQUFHQSwrQkFBK0JBLENBQUNBO0lBQ2hEQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtBQUNqREEsQ0FBQ0E7QUFTRDtJQUErQkMsNkJBQXFCQTtJQUduREE7UUFIREMsaUJBaURDQTtRQTdDQ0EsaUJBQU9BLENBQUNBO1FBSERBLGFBQVFBLEdBQTJDQSxJQUFJQSxXQUFXQSxDQUFDQSxVQUFVQSxFQUFpQkEsQ0FBQ0E7UUFLdEdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLEVBQUVBLFVBQUFBLENBQUNBO1lBQ2pDQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUFFQTtnQkFDN0JBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBO2dCQUNUQSxXQUFXQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQTtnQkFDMUJBLE1BQU1BLEVBQUVBLElBQUlBO2dCQUNaQSxPQUFPQSxFQUFFQSxDQUFDQTthQUNWQSxDQUFDQSxDQUFDQTtRQUNKQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUVIQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQTttQkFDbENBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLE1BQU1BLEdBQUdBLEtBQUtBO1FBQWpEQSxDQUFpREEsQ0FDaERBLENBQUNBO1FBRUhBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLFVBQVVBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLFVBQUFBLENBQUNBO1lBQy9CQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxzQkFBc0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3hDQSxDQUFDQSxDQUFDQSxDQUFBQTtRQUVGQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQTttQkFDaENBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLENBQUNBLENBQUNBLFFBQVFBO1FBQXhEQSxDQUF3REEsQ0FDdkRBLENBQUNBO1FBRUhBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLEVBQUVBLFVBQUFBLENBQUNBO21CQUNoQ0EsS0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsUUFBUUE7UUFBeERBLENBQXdEQSxDQUN2REEsQ0FBQ0E7SUFDSkEsQ0FBQ0E7SUFFREQseUJBQUtBLEdBQUxBO1FBQ0NFLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLDhCQUE4QkEsQ0FBQ0EsQ0FBQUE7UUFDM0NBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1FBQ3pCQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSw4QkFBOEJBLENBQUNBLENBQUFBO1FBQzNDQSxJQUFJQSxJQUFJQSxHQUFHQSw4REFBOERBLENBQUNBO1FBQzFFQSxJQUFJQSxJQUFPQSxjQUFjQSxDQUFDQSxJQUFJQSxFQUFFQSxFQUFFQSxDQUFDQSxXQUFPQSxjQUFjQSxDQUFDQSxhQUFhQSxFQUFFQSxFQUFFQSxDQUFDQSxXQUFPQSxhQUFhQSxDQUFDQSxVQUFVQSxFQUFFQSxFQUFFQSxDQUFDQSxPQUFLQSxDQUFDQTtRQUNySEEsSUFBSUEsSUFBSUEsOERBQThEQSxDQUFDQTtRQUN2RUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7WUFDL0JBLElBQUlBLElBQU9BLGNBQWNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBLFdBQU9BLGNBQWNBLENBQUNBLENBQUNBLENBQUNBLFdBQVdBLEVBQUVBLEVBQUVBLENBQUNBLFdBQU9BLGFBQWFBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLEVBQUVBLENBQUNBLE9BQUtBLENBQUNBO1FBQ3JIQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNIQSxJQUFJQSxJQUFJQSw4REFBOERBLENBQUNBO1FBRXZFQSxJQUFJQSxHQUFHQSxHQUFvQkEsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFFekRBLEdBQUdBLENBQUNBLFNBQVNBLEdBQUdBLElBQUlBLENBQUNBO1FBQ3JCQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUNoQ0EsQ0FBQ0E7SUFDRkYsZ0JBQUNBO0FBQURBLENBakRBLEFBaURDQSxFQWpEOEIsVUFBVSxDQUFDLFVBQVUsRUFpRG5EO0FBakRZLGlCQUFTLFlBaURyQixDQUFBOzs7Ozs7OztBQzFFRCxJQUFZLFVBQVUsV0FBTSwwQkFHM0IsQ0FBQyxDQUhvRDtBQUVyRCxjQUFjO0FBQ2Q7SUFBa0NHLGdDQUFrQkE7SUFHbkRBLHNCQUFtQkEsTUFBYUEsRUFBU0EsR0FBVUEsRUFBU0EsV0FBa0JBO1FBQzdFQyxpQkFBT0EsQ0FBQ0E7UUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7UUFBU0EsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBT0E7UUFBU0EsZ0JBQVdBLEdBQVhBLFdBQVdBLENBQU9BO1FBRDlFQSxtQkFBY0EsR0FBR0EsSUFBSUEsQ0FBQ0E7SUFHdEJBLENBQUNBO0lBSk1ELGlCQUFJQSxHQUFpQkEsSUFBSUEsWUFBWUEsQ0FBQ0EsSUFBSUEsRUFBQ0EsSUFBSUEsRUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFLOURBLG1CQUFDQTtBQUFEQSxDQU5BLEFBTUNBLEVBTmlDLFVBQVUsQ0FBQyxPQUFPLEVBTW5EO0FBTlksb0JBQVksZUFNeEIsQ0FBQTtBQUVEO0lBQWlDRSwrQkFBa0JBO0lBR2xEQSxxQkFBbUJBLE1BQWFBO1FBQy9CQyxpQkFBT0EsQ0FBQ0E7UUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7UUFEaENBLGtCQUFhQSxHQUFHQSxJQUFJQSxDQUFDQTtJQUdyQkEsQ0FBQ0E7SUFKTUQsZ0JBQUlBLEdBQWdCQSxJQUFJQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUtsREEsa0JBQUNBO0FBQURBLENBTkEsQUFNQ0EsRUFOZ0MsVUFBVSxDQUFDLE9BQU8sRUFNbEQ7QUFOWSxtQkFBVyxjQU12QixDQUFBO0FBRUQ7SUFBOEJFLDRCQUFrQkE7SUFHL0NBLGtCQUFtQkEsTUFBYUEsRUFBU0EsUUFBZ0JBO1FBQ3hEQyxpQkFBT0EsQ0FBQ0E7UUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7UUFBU0EsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBUUE7UUFEekRBLGVBQVVBLEdBQUdBLElBQUlBLENBQUNBO0lBR2xCQSxDQUFDQTtJQUpNRCxhQUFJQSxHQUFhQSxJQUFJQSxRQUFRQSxDQUFDQSxJQUFJQSxFQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUs5Q0EsZUFBQ0E7QUFBREEsQ0FOQSxBQU1DQSxFQU42QixVQUFVLENBQUMsT0FBTyxFQU0vQztBQU5ZLGdCQUFRLFdBTXBCLENBQUE7QUFFRDtJQUE4QkUsNEJBQWtCQTtJQUcvQ0Esa0JBQW1CQSxNQUFhQSxFQUFTQSxRQUFnQkE7UUFDeERDLGlCQUFPQSxDQUFDQTtRQURVQSxXQUFNQSxHQUFOQSxNQUFNQSxDQUFPQTtRQUFTQSxhQUFRQSxHQUFSQSxRQUFRQSxDQUFRQTtRQUR6REEsZUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0E7SUFHbEJBLENBQUNBO0lBSk1ELGFBQUlBLEdBQWFBLElBQUlBLFFBQVFBLENBQUNBLElBQUlBLEVBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBSzlDQSxlQUFDQTtBQUFEQSxDQU5BLEFBTUNBLEVBTjZCLFVBQVUsQ0FBQyxPQUFPLEVBTS9DO0FBTlksZ0JBQVEsV0FNcEIsQ0FBQTs7Ozs7Ozs7QUNqQ0YsSUFBWSxVQUFVLFdBQU0sMEJBQzVCLENBQUMsQ0FEcUQ7QUFDdEQsSUFBWSxNQUFNLFdBQU0sUUFJdkIsQ0FBQyxDQUo4QjtBQUUvQix1QkFBdUI7QUFFdkI7SUFBK0JFLDZCQUF5QkE7SUFLdkRBO1FBTERDLGlCQXVCQ0E7UUFqQkNBLGlCQUFPQSxDQUFDQTtRQUxEQSxhQUFRQSxHQUFZQSxLQUFLQSxDQUFDQTtRQUMxQkEsWUFBT0EsR0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFDcEJBLFFBQUdBLEdBQVVBLElBQUlBLENBQUNBO1FBSXpCQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQSxJQUFHQSxPQUFBQSxLQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxFQUFwQkEsQ0FBb0JBLENBQUNBLENBQUNBO1FBQzVEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQSxJQUFHQSxPQUFBQSxLQUFJQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUExQkEsQ0FBMEJBLENBQUNBLENBQUNBO1FBQ2hFQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQSxJQUFHQSxPQUFBQSxLQUFJQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUExQkEsQ0FBMEJBLENBQUNBLENBQUNBO1FBQ2hFQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxLQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFoQkEsQ0FBZ0JBLENBQUNBLENBQUNBO1FBRXhEQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFDQSxJQUFJQSxFQUFDQSxzQkFBc0JBLEVBQUVBLElBQUlBLEVBQUdBO3VCQUNsREEsS0FBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsSUFBSUE7WUFBaEJBLENBQWdCQTtTQUNoQkEsQ0FBQ0EsQ0FBQ0E7UUFFSEEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBQ0EsSUFBSUEsRUFBQ0Esb0NBQW9DQSxFQUFFQSxJQUFJQSxFQUFHQTt1QkFDaEVBLEtBQUlBLENBQUNBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUlBLENBQUNBLFVBQVVBLEVBQUVBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEtBQUlBLENBQUNBLGVBQWVBLEVBQUVBLENBQUNBO1lBQTVFQSxDQUE0RUE7U0FDNUVBLENBQUNBLENBQUNBO0lBQ0pBLENBQUNBO0lBRURELG1DQUFlQSxHQUFmQSxjQUE2QkUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQUEsQ0FBQ0EsQ0FBQ0E7O0lBQ25ERiw4QkFBVUEsR0FBVkEsY0FBdUJHLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO0lBQzlDSCxnQkFBQ0E7QUFBREEsQ0F2QkEsQUF1QkNBLEVBdkI4QixVQUFVLENBQUMsY0FBYyxFQXVCdkQ7QUF2QlksaUJBQVMsWUF1QnJCLENBQUE7QUFHRCxlQUFlO0FBRWY7SUFBMEJJLHdCQUErQkE7SUFFeERBLGNBQVlBLEVBQVVBO1FBQ3JCQyxrQkFBTUEsRUFBRUEsRUFBRUEsSUFBSUEsU0FBU0EsRUFBRUEsQ0FBQ0EsQ0FBQUE7SUFDM0JBLENBQUNBO0lBRURELHVCQUFRQSxHQUFSQSxVQUFTQSxFQUFVQSxFQUFFQSxXQUFtQkE7UUFDdkNFLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLEVBQUVBLEVBQUVBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO0lBQzFEQSxDQUFDQTtJQUVERixzQkFBT0EsR0FBUEE7UUFDQ0csRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLE1BQU1BLENBQUNBLFlBQVlBLEVBQUVBLENBQUNBLENBQUNBO1FBQzVDQSxDQUFDQTtJQUNGQSxDQUFDQTtJQUVESCxtQkFBSUEsR0FBSkEsVUFBS0EsUUFBZ0JBO1FBQ3BCSSxLQUFLQSxFQUFFQSxDQUFBQTtRQUNQQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFBQTtJQUNqREEsQ0FBQ0E7SUFFREoscUJBQU1BLEdBQU5BLFVBQU9BLFFBQWdCQTtRQUN0QkssSUFBSUEsWUFBWUEsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsRUFBRUEsQ0FBQ0E7UUFDM0NBLEVBQUVBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFBQTtRQUNqREEsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDUEEsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsTUFBTUEsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxRQUFRQSxFQUFFQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN2RUEsQ0FBQ0E7SUFDRkEsQ0FBQ0E7SUFFREwsc0JBQU9BLEdBQVBBLFVBQVFBLEVBQVNBO1FBQ2hCTSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNyQkEsQ0FBQ0E7SUEvQk1OLFNBQUlBLEdBQVNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO0lBZ0NwQ0EsV0FBQ0E7QUFBREEsQ0FqQ0EsQUFpQ0NBLEVBakN5QixVQUFVLENBQUMsU0FBUyxFQWlDN0M7QUFqQ1ksWUFBSSxPQWlDaEIsQ0FBQTs7QUNsRUYsSUFBWSxVQUFVLFdBQU0sMEJBQzVCLENBQUMsQ0FEcUQ7QUFDdEQsSUFBWSxRQUFRLFdBQU0sVUFDMUIsQ0FBQyxDQURtQztBQUNwQyxxQkFBbUIsTUFHbEIsQ0FBQyxDQUh1QjtBQUV6QixjQUFjO0FBQ2I7SUFDQ08sNkJBQVlBLEdBQW1CQTtRQUM5QkMsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDMUNBLENBQUNBO0lBRURELG9DQUFNQSxHQUFOQSxVQUFPQSxPQUErQkE7UUFDckNFLElBQUlBLElBQUlBLEdBQUdBLFVBQVVBLENBQUNBLFVBQVVBLENBQUNBLE9BQU9BLENBQUNBLFdBQUlBLENBQUNBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3BFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxFQUFFQSxPQUFPQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUNoREEsVUFBVUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsU0FBU0EsRUFBRUEsVUFBQUEsQ0FBQ0E7WUFDcERBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLENBQUNBLENBQUFBO1FBQ3BCQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNKQSxDQUFDQTtJQUNGRiwwQkFBQ0E7QUFBREEsQ0FaQSxBQVlDQSxJQUFBO0FBWlksMkJBQW1CLHNCQVkvQixDQUFBO0FBRUQ7SUFDQ0csNEJBQVlBLEdBQW1CQTtRQUM5QkMsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDekNBLENBQUNBO0lBRURELG1DQUFNQSxHQUFOQSxVQUFPQSxPQUE4QkE7UUFDcENFLElBQUlBLElBQUlBLEdBQUdBLFVBQVVBLENBQUNBLFVBQVVBLENBQUNBLE9BQU9BLENBQUNBLFdBQUlBLENBQUNBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3BFQSxJQUFJQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQTtRQUNmQSxVQUFVQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxTQUFTQSxFQUFFQSxVQUFBQSxDQUFDQTtZQUNwREEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQUE7UUFDcEJBLENBQUNBLENBQUNBLENBQUNBO0lBQ0pBLENBQUNBO0lBQ0ZGLHlCQUFDQTtBQUFEQSxDQVpBLEFBWUNBLElBQUE7QUFaWSwwQkFBa0IscUJBWTlCLENBQUE7QUFFRDtJQUNDRyx5QkFBWUEsR0FBbUJBO1FBQzlCQyxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUN0Q0EsQ0FBQ0E7SUFFREQsZ0NBQU1BLEdBQU5BLFVBQU9BLE9BQTJCQTtRQUNqQ0UsSUFBSUEsSUFBSUEsR0FBR0EsVUFBVUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDcEVBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBQzVCQSxVQUFVQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUNyREEsQ0FBQ0E7SUFDRkYsc0JBQUNBO0FBQURBLENBVkEsQUFVQ0EsSUFBQTtBQVZZLHVCQUFlLGtCQVUzQixDQUFBO0FBRUQ7SUFDQ0cseUJBQVlBLEdBQW1CQTtRQUM5QkMsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDdENBLENBQUNBO0lBRURELGdDQUFNQSxHQUFOQSxVQUFPQSxPQUEyQkE7UUFDakNFLElBQUlBLElBQUlBLEdBQUdBLFVBQVVBLENBQUNBLFVBQVVBLENBQUNBLE9BQU9BLENBQUNBLFdBQUlBLENBQUNBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3BFQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUM5QkEsVUFBVUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDckRBLENBQUNBO0lBQ0ZGLHNCQUFDQTtBQUFEQSxDQVZBLEFBVUNBLElBQUE7QUFWWSx1QkFBZSxrQkFVM0IsQ0FBQTtBQUVEO0lBQUFHO0lBUUFDLENBQUNBO0lBTk9ELDZCQUFRQSxHQUFmQSxVQUFnQkEsR0FBb0JBO1FBQ25DRSxJQUFJQSxtQkFBbUJBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxrQkFBa0JBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQzVCQSxJQUFJQSxlQUFlQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUN6QkEsSUFBSUEsZUFBZUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBQ0ZGLDJCQUFDQTtBQUFEQSxDQVJBLEFBUUNBLElBQUE7QUFSWSw0QkFBb0IsdUJBUWhDLENBQUE7O0FDaEVGLElBQVksVUFBVSxXQUFNLHlCQUM1QixDQUFDLENBRG9EO0FBQ3JELElBQVksV0FBVyxXQUFNLHlCQUM3QixDQUFDLENBRHFEO0FBQ3RELHlCQUFtQyxzQkFDbkMsQ0FBQyxDQUR3RDtBQUN6RCxJQUFZLFFBQVEsV0FBTSxzQkFFekIsQ0FBQyxDQUY4QztBQUUvQyxJQUFJLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNqQyxJQUFJLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUU1QztJQUNDRyxvQkFBb0JBO0lBQ3BCQSwrQkFBb0JBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ25DQSxHQUFHQSxDQUFDQSxTQUFTQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtBQUMxQkEsQ0FBQ0E7QUFFRDtJQUNDQyxJQUFJQSxDQUFDQTtRQUNKQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxZQUFZQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxxQkFBcUJBLENBQUNBLENBQUNBLENBQUNBO1FBQzNFQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxZQUFZQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxvQkFBb0JBLENBQUNBLENBQUNBLENBQUNBO1FBQzFFQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUMvQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFFQTtJQUFBQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNoQkEsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7SUFDOUJBLENBQUNBO0lBQ0RBLFNBQVNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO0FBQ25CQSxDQUFDQTtBQUVELFNBQVMsRUFBRSxDQUFDO0FBQ1osR0FBRyxFQUFFLENBQUM7QUFFTixVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgSURpY3Rpb25hcnk8VD4ge1xuXHRhZGQoa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogdm9pZDtcblx0cmVtb3ZlKGtleTogc3RyaW5nKTogdm9pZDtcblx0Y29udGFpbnNLZXkoa2V5OiBzdHJpbmcpOiBib29sZWFuO1xuXHRrZXlzKCk6IHN0cmluZ1tdO1xuXHR2YWx1ZXMoKTogVFtdO1xuXHRnZXRWYWx1ZShrZXk6IHN0cmluZyk6IFQ7XG59XG5cbmV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5PFQ+IHtcblxuXHRfa2V5czogc3RyaW5nW10gPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuXHRfdmFsdWVzOiBUW10gPSBuZXcgQXJyYXk8VD4oKTtcblxuXHRjb25zdHJ1Y3Rvcihpbml0OiB7IGtleTogc3RyaW5nOyB2YWx1ZTogVDsgfVtdID0gbmV3IEFycmF5PHsga2V5OiBzdHJpbmcsIHZhbHVlOiBUIH0+KCkpIHtcblxuXHRcdGlmIChpbml0KSB7XG5cdFx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IGluaXQubGVuZ3RoOyB4KyspIHtcblx0XHRcdFx0dGhpcy5hZGQoaW5pdFt4XS5rZXksIGluaXRbeF0udmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFkZChrZXk6IHN0cmluZywgdmFsdWU6IFQpIHtcblx0XHR0aGlzW2tleV0gPSB2YWx1ZTtcblx0XHR0aGlzLl9rZXlzLnB1c2goa2V5KTtcblx0XHR0aGlzLl92YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdH1cblxuXHRyZW1vdmUoa2V5OiBzdHJpbmcpIHtcblx0XHR2YXIgaW5kZXggPSB0aGlzLl9rZXlzLmluZGV4T2Yoa2V5LCAwKTtcblx0XHR0aGlzLl9rZXlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5fdmFsdWVzLnNwbGljZShpbmRleCwgMSk7XG5cblx0XHRkZWxldGUgdGhpc1trZXldO1xuXHR9XG5cblx0Z2V0VmFsdWUoa2V5OiBzdHJpbmcpOiBUIHtcblx0XHRyZXR1cm4gdGhpc1trZXldO1xuXHR9XG5cblx0a2V5cygpOiBzdHJpbmdbXSB7XG5cdFx0cmV0dXJuIHRoaXMuX2tleXM7XG5cdH1cblxuXHR2YWx1ZXMoKTogVFtdIHtcblx0XHRyZXR1cm4gdGhpcy5fdmFsdWVzO1xuXHR9XG5cblx0Y29udGFpbnNLZXkoa2V5OiBzdHJpbmcpIHtcblx0XHRpZiAodHlwZW9mIHRoaXNba2V5XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0dG9Mb29rdXAoKTogSURpY3Rpb25hcnk8VD4ge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiQ29sbGVjdGlvbnMudHNcIi8+XG5pbXBvcnQgKiBhcyBDb2xsZWN0aW9ucyBmcm9tIFwiQ29sbGVjdGlvbnNcIjtcblxuXG4vKiBJbnRlcmZhY2VzICovXG5leHBvcnQgaW50ZXJmYWNlIElDb21tYW5kIHtcblx0Y29tbWFuZElkOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbW1hbmRIYW5kbGVyPFQgZXh0ZW5kcyBJQ29tbWFuZD4ge1xuXHRIYW5kbGUoY29tbWFuZDogVCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUV2ZW50IHtcblx0c3RyZWFtSWQ6IHN0cmluZztcblx0ZXZlbnRJZDogc3RyaW5nO1xuXHRHZXRUeXBlKCk6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnRIYW5kbGVyPFQgZXh0ZW5kcyBJRXZlbnQ+IHtcblx0KGV2ZW50OiBUKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQnVzIHtcblx0c2VuZChjb21tYW5kOiBJQ29tbWFuZCk6IHZvaWQ7XG5cdHB1Ymxpc2goZXZlbnQ6IElFdmVudCk6IHZvaWQ7XG59XG5cdFxuLyogSW1wbGVtZW50YXRpb25zICovXG4vKipcbiAqIGdldFR5cGUgZnJvbSBvYmplY3QgaW5zdGFuY2VcbiAqL1xuZnVuY3Rpb24gZ2V0VHlwZShvKTogc3RyaW5nIHtcblx0dmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb24gKC57MSx9KVxcKC87XG5cdHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKDxhbnk+IG8pLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkpO1xuXHRyZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0gOiBcIlwiO1xufVxuXG4vKipcbiAqIEdldCBjbGFzcyBuYW1lIGZyb20gdHlwZVxuICovXG5mdW5jdGlvbiBnZXRDbGFzc05hbWUobyk6IHN0cmluZyB7XG5cdHZhciBmdW5jTmFtZVJlZ2V4ID0gL2Z1bmN0aW9uICguezEsfSlcXCgvO1xuXHR2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKCg8YW55PiBvKS50b1N0cmluZygpKTtcblx0cmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdIDogXCJcIjtcbn1cblxuZXhwb3J0IGNsYXNzIERvbWFpbkVycm9yIGltcGxlbWVudHMgRXJyb3Ige1xuXHRuYW1lOiBzdHJpbmc7XG5cblx0Y29uc3RydWN0b3IocHVibGljIG1lc3NhZ2U/OiBzdHJpbmcpIHtcblx0XHR0aGlzLm5hbWUgPSBnZXRUeXBlKHRoaXMpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiBleHRlbmRzIERvbWFpbkVycm9yIHtcblx0SW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24gPSBcIlwiO1xufVxuXG5leHBvcnQgY2xhc3MgQ29tbWFuZCBpbXBsZW1lbnRzIElDb21tYW5kIHtcblx0c3RhdGljIENvbW1hbmRDb3VudGVyOiBudW1iZXIgPSAwO1xuXHRjb21tYW5kSWQ6IHN0cmluZztcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmNvbW1hbmRJZCA9IFwiY21kX1wiICsgQ29tbWFuZC5Db21tYW5kQ291bnRlcisrO1xuXHR9XG5cblx0R2V0VHlwZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBnZXRUeXBlKHRoaXMpO1xuXHR9XG59XG5cblxuZXhwb3J0IGNsYXNzIEV2ZW50IGltcGxlbWVudHMgSUV2ZW50IHtcblx0c3RhdGljIEV2ZW50Q291bnRlcjogbnVtYmVyID0gMDtcblx0c3RhdGljIFR5cGU6IEV2ZW50ID0gbmV3IEV2ZW50KCk7XG5cdHN0cmVhbUlkOiBzdHJpbmc7XG5cdGV2ZW50SWQ6IHN0cmluZztcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5ldmVudElkID0gXCJldnRfXCIgKyBFdmVudC5FdmVudENvdW50ZXIrKztcblx0fVxuXG5cdEdldFR5cGUoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gZ2V0VHlwZSh0aGlzKTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUHJvamVjdGlvbiB7XG5cdHByaXZhdGUgaGFuZGxlcnM6IEFycmF5PElFdmVudEhhbmRsZXI8SUV2ZW50Pj4gPSBuZXcgQXJyYXk8SUV2ZW50SGFuZGxlcjxJRXZlbnQ+PigpO1xuXHRwcm90ZWN0ZWQgT248VCBleHRlbmRzIElFdmVudD4oZXZlbnQ6IFQsIGhhbmRsZXI6IElFdmVudEhhbmRsZXI8VD4pIHtcblx0XHR2YXIgbmFtZSA9IGdldFR5cGUoZXZlbnQpO1xuXHRcdHRoaXMuaGFuZGxlcnNbbmFtZV0gPSBoYW5kbGVyO1xuXHR9XG5cblx0cHVibGljIEhhbmRsZShldmVudDogSUV2ZW50KSB7XG5cdFx0dGhpcy5IYW5kbGVFdmVudChldmVudC5HZXRUeXBlKCksIGV2ZW50KTtcblx0XHR0aGlzLkhhbmRsZUV2ZW50KGdldFR5cGUoRXZlbnQuVHlwZSksIGV2ZW50KTtcblx0fVxuXG5cdHByaXZhdGUgSGFuZGxlRXZlbnQodHlwZU5hbWU6IHN0cmluZywgZXZlbnQ6IElFdmVudCkge1xuXHRcdHZhciBoYW5kbGVyID0gdGhpcy5oYW5kbGVyc1t0eXBlTmFtZV07XG5cdFx0aWYgKGhhbmRsZXIpXG5cdFx0XHRoYW5kbGVyKGV2ZW50KTtcblx0fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBZ2dyZWdhdGUge1xuXHRnZXRBZ2dyZWdhdGVUeXBlKCk6IHN0cmluZztcblx0Z2V0QWdncmVnYXRlSWQoKTogc3RyaW5nO1xuXHRnZXRVbmNvbW1pdGVkRXZlbnRzKCk6IElFdmVudFtdO1xuXHRjaGVja0ludmFyaWFudHMoKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnZhcmlhbnRDaGVjayB7XG5cdG5hbWU6IHN0cmluZztcblx0cnVsZTxUIGV4dGVuZHMgQWdncmVnYXRlU3RhdGU+KCk6IEJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBBZ2dyZWdhdGVTdGF0ZSBleHRlbmRzIFByb2plY3Rpb24ge1xuXHRwcml2YXRlIF9jaGVja3MgPSBuZXcgQXJyYXk8SW52YXJpYW50Q2hlY2s+KCk7XG5cdGFwcGx5KGV2ZW50OiBJRXZlbnQpOiB2b2lkIHtcblx0XHR0aGlzLkhhbmRsZShldmVudCk7XG5cdH1cblxuXHRwcm90ZWN0ZWQgYWRkQ2hlY2soY2hlY2s6IEludmFyaWFudENoZWNrKSB7XG5cdFx0dGhpcy5fY2hlY2tzLnB1c2goY2hlY2spO1xuXHR9XG5cblx0Y2hlY2tJbnZhcmlhbnRzKCkge1xuXHRcdHRoaXMuX2NoZWNrcy5mb3JFYWNoKGMgPT4ge1xuXHRcdFx0aWYgKCFjLnJ1bGUoKSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInJ1bGUgXFwnXCIgKyBjLm5hbWUgKyBcIlxcJyBoYXMgYmVlbiB2aW9sYXRlZFwiKTtcblx0XHRcdFx0dGhyb3cgbmV3IEludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uKGMubmFtZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQWdncmVnYXRlRmFjdG9yeSB7XG5cdEZhY3RvcnkoaWQ6IHN0cmluZyk6IElBZ2dyZWdhdGVGYWN0b3J5O1xuXHRsb2FkRnJvbUV2ZW50cyhldmVudHM6IElFdmVudFtdKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIEFnZ3JlZ2F0ZTxUU3RhdGUgZXh0ZW5kcyBBZ2dyZWdhdGVTdGF0ZT4gaW1wbGVtZW50cyBJQWdncmVnYXRlIHtcblx0cHJpdmF0ZSBFdmVudHM6IEFycmF5PElFdmVudD4gPSBuZXcgQXJyYXk8SUV2ZW50PigpO1xuXG5cdGNvbnN0cnVjdG9yKHByb3RlY3RlZCBhZ2dyZWdhdGVJZDogc3RyaW5nLCBwcm90ZWN0ZWQgU3RhdGU6IFRTdGF0ZSkge1xuXG5cdH1cblxuXHRwcm90ZWN0ZWQgUmFpc2VFdmVudChldmVudDogSUV2ZW50KTogdm9pZCB7XG5cdFx0ZXZlbnQuc3RyZWFtSWQgPSB0aGlzLmFnZ3JlZ2F0ZUlkO1xuXHRcdHRoaXMuRXZlbnRzLnB1c2goZXZlbnQpO1xuXHRcdHRoaXMuU3RhdGUuYXBwbHkoZXZlbnQpO1xuXHR9XG5cblx0bG9hZEZyb21FdmVudHMoZXZlbnRzOiBJRXZlbnRbXSk6IHZvaWQge1xuXHRcdGV2ZW50cy5mb3JFYWNoKGU9PiB0aGlzLlN0YXRlLmFwcGx5KGUpKTtcblx0fVxuXG5cdGdldEFnZ3JlZ2F0ZVR5cGUoKSB7XG5cdFx0cmV0dXJuIGdldFR5cGUodGhpcyk7XG5cdH1cblx0Z2V0QWdncmVnYXRlSWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWdncmVnYXRlSWQ7XG5cdH1cblx0Z2V0VW5jb21taXRlZEV2ZW50cygpOiBJRXZlbnRbXSB7XG5cdFx0cmV0dXJuIHRoaXMuRXZlbnRzO1xuXHR9XG5cdGNoZWNrSW52YXJpYW50cygpIHtcblx0XHR0aGlzLlN0YXRlLmNoZWNrSW52YXJpYW50cygpO1xuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbW1pdCB7XG5cdGNvbW1pdElkOiBzdHJpbmc7XG5cdGV2ZW50czogSUV2ZW50W107XG5cdGhlYWRlcnM6IENvbGxlY3Rpb25zLklEaWN0aW9uYXJ5PHN0cmluZz5cbn07XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW0ge1xuXHRwcml2YXRlIGNvbW1pdHMgPSBuZXcgQXJyYXk8SUNvbW1pdD4oKTtcblx0cHJpdmF0ZSBldmVudHMgPSBuZXcgQXJyYXk8SUV2ZW50PigpO1xuXG5cdGNvbnN0cnVjdG9yKHByb3RlY3RlZCBzdHJlYW1JZDogc3RyaW5nKSB7XG5cblx0fVxuXG5cdGdldFN0cmVhbUlkKCkgeyByZXR1cm4gdGhpcy5zdHJlYW1JZDsgfVxuXG5cdGdldEV2ZW50cygpOiBJRXZlbnRbXSB7XG5cdFx0cmV0dXJuIHRoaXMuZXZlbnRzO1xuXHR9XG5cblx0Y29tbWl0KFxuXHRcdGV2ZW50czogQXJyYXk8SUV2ZW50Pixcblx0XHRjb21taXRJZDogc3RyaW5nLFxuXHRcdHByZXBhcmVIZWFkZXJzPzogKGg6IENvbGxlY3Rpb25zLklEaWN0aW9uYXJ5PHN0cmluZz4pID0+IHZvaWQpOiBJQ29tbWl0IHtcblxuXHRcdHZhciBjb21taXQ6IElDb21taXQgPSB7XG5cdFx0XHRjb21taXRJZDogY29tbWl0SWQsXG5cdFx0XHRldmVudHM6IGV2ZW50cyxcblx0XHRcdGhlYWRlcnM6IG5ldyBDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5PHN0cmluZz4oKVxuXHRcdH07XG5cblx0XHRpZiAocHJlcGFyZUhlYWRlcnMpIHtcblx0XHRcdHByZXBhcmVIZWFkZXJzKGNvbW1pdC5oZWFkZXJzKTtcblx0XHR9XG5cdFx0dGhpcy5jb21taXRzLnB1c2goY29tbWl0KTtcblx0XHR0aGlzLmV2ZW50cyA9IHRoaXMuZXZlbnRzLmNvbmNhdChldmVudHMpO1xuXHRcdGNvbnNvbGUubG9nKCdzYXZlZCBjb21taXQnLCBjb21taXQpO1xuXG5cdFx0cmV0dXJuIGNvbW1pdDtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc2lzdGVuY2Uge1xuXHRwcml2YXRlIHN0YXRpYyBzdHJlYW1zID0gbmV3IENvbGxlY3Rpb25zLkRpY3Rpb25hcnk8U3RyZWFtPigpO1xuXHRzdGF0aWMgb3BlblN0cmVhbShpZDogc3RyaW5nKTogU3RyZWFtIHtcblx0XHRpZiAoIXRoaXMuc3RyZWFtcy5jb250YWluc0tleShpZCkpIHtcblx0XHRcdHRoaXMuc3RyZWFtcy5hZGQoaWQsIG5ldyBTdHJlYW0oaWQpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5zdHJlYW1zLmdldFZhbHVlKGlkKTtcblx0fVxuXG5cdHN0YXRpYyBkdW1wKCkge1xuXHRcdHRoaXMuc3RyZWFtcy52YWx1ZXMoKS5mb3JFYWNoKHMgPT4geyBjb25zb2xlLmxvZygnc3RyZWFtICcgKyBzLmdldFN0cmVhbUlkKCksIHMpIH0pO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXBvc2l0b3J5IHtcblx0c3RhdGljIGdldEJ5SWQ8VCBleHRlbmRzIElBZ2dyZWdhdGVGYWN0b3J5Pih0eXBlOiBULCBpZDogc3RyaW5nKTogVCB7XG5cdFx0dmFyIHN0cmVhbSA9IFBlcnNpc3RlbmNlLm9wZW5TdHJlYW0oaWQpO1xuXHRcdHZhciBhZ2dyZWdhdGUgPSA8VD50eXBlLkZhY3RvcnkoaWQpO1xuXG5cdFx0YWdncmVnYXRlLmxvYWRGcm9tRXZlbnRzKHN0cmVhbS5nZXRFdmVudHMoKSk7XG5cblx0XHRyZXR1cm4gYWdncmVnYXRlO1xuXHR9XG5cblx0c3RhdGljIHNhdmUoYWdncmVnYXRlOiBJQWdncmVnYXRlLCBjb21taXRJZDogc3RyaW5nLCBwcmVwYXJlSGVhZGVycz86IChoOiBDb2xsZWN0aW9ucy5JRGljdGlvbmFyeTxzdHJpbmc+KSA9PiB2b2lkKSB7XG5cdFx0dmFyIGlkID0gYWdncmVnYXRlLmdldEFnZ3JlZ2F0ZUlkKCk7XG5cdFx0dmFyIHR5cGUgPSBhZ2dyZWdhdGUuZ2V0QWdncmVnYXRlVHlwZSgpO1xuXHRcdGNvbnNvbGUubG9nKCdzYXZpbmcgJyArIHR5cGUgKyBcIltcIiArIGlkICsgXCJdXCIpO1xuXHRcdFx0XG5cdFx0Ly8gaXQncyBvayB0byBzYXZlPyBcblx0XHRhZ2dyZWdhdGUuY2hlY2tJbnZhcmlhbnRzKCk7XG5cdFx0XHRcblx0XHQvLyBzYXZlIG9uIHN0cmVhbVxuXHRcdHZhciBzdHJlYW0gPSBQZXJzaXN0ZW5jZS5vcGVuU3RyZWFtKGlkKTtcblx0XHRzdHJlYW0uY29tbWl0KGFnZ3JlZ2F0ZS5nZXRVbmNvbW1pdGVkRXZlbnRzKCksIGNvbW1pdElkLCBoPT4ge1xuXHRcdFx0aC5hZGQoJ3R5cGUnLCB0eXBlKTtcblx0XHRcdGlmIChwcmVwYXJlSGVhZGVycykge1xuXHRcdFx0XHRwcmVwYXJlSGVhZGVycyhoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcdFxuXHRcdC8vIGRpc3BhdGNoIGV2ZW50cyB0byBzdWJzY3JpYmVyc1xuXHRcdGFnZ3JlZ2F0ZS5nZXRVbmNvbW1pdGVkRXZlbnRzKCkuZm9yRWFjaChlPT4ge1xuXHRcdFx0QnVzLkRlZmF1bHQucHVibGlzaChlKTtcblx0XHR9KTtcblx0fVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCdXMgaW1wbGVtZW50cyBJQnVzIHtcblx0c3RhdGljIERlZmF1bHQgPSBuZXcgQnVzKCk7XG5cdHByaXZhdGUgQ29uc3VtZXJzID0gbmV3IEFycmF5PFByb2plY3Rpb24+KCk7XG5cdHByaXZhdGUgSGFuZGxlcnMgPSBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxJQ29tbWFuZEhhbmRsZXI8SUNvbW1hbmQ+PigpO1xuXG5cdHNlbmQoY29tbWFuZDogSUNvbW1hbmQpOiB2b2lkIHtcblx0XHR2YXIgbmFtZSA9IGdldFR5cGUoY29tbWFuZCk7XG5cdFx0dmFyIGhhbmRsZXIgPSB0aGlzLkhhbmRsZXJzLmdldFZhbHVlKG5hbWUpO1xuXHRcdGlmICghaGFuZGxlcikge1xuXHRcdFx0dGhyb3cgXCJtaXNzaW5nIGhhbmRsZXIgZm9yIFwiICsgbmFtZTtcblx0XHR9XG5cblx0XHRoYW5kbGVyLkhhbmRsZShjb21tYW5kKTtcblx0fVxuXG5cdHB1Ymxpc2goZXZlbnQ6IElFdmVudCk6IHZvaWQge1xuXHRcdHRoaXMuQ29uc3VtZXJzLmZvckVhY2goY29uc3VtZXI9PiBjb25zdW1lci5IYW5kbGUoZXZlbnQpKTtcblx0fVxuXG5cdHN1YnNjcmliZShjb25zdW1lcjogUHJvamVjdGlvbik6IHZvaWQge1xuXHRcdHRoaXMuQ29uc3VtZXJzLnB1c2goY29uc3VtZXIpO1xuXHR9XG5cblx0T248VCBleHRlbmRzIElDb21tYW5kPihjb21tYW5kOiBULCBoYW5kbGVyOiBJQ29tbWFuZEhhbmRsZXI8VD4pIHtcblx0XHR2YXIgbmFtZSA9IGdldFR5cGUoY29tbWFuZCk7XG5cdFx0dGhpcy5IYW5kbGVycy5hZGQobmFtZSwgaGFuZGxlcik7XG5cdH1cbn1cbiIsImltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZVwiXG5cblxuXHQvKiBldmVudHMgKi9cblx0ZXhwb3J0IGNsYXNzIEl0ZW1DcmVhdGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1DcmVhdGVkID0gbmV3IEl0ZW1DcmVhdGVkKG51bGwsIG51bGwpO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBza3U6IHN0cmluZywgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIEl0ZW1EaXNhYmxlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtRGlzYWJsZWQgPSBuZXcgSXRlbURpc2FibGVkKCk7XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBJdGVtTG9hZGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1Mb2FkZWQgPSBuZXcgSXRlbUxvYWRlZCgwKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgcXVhbnRpdHk6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblxuXG5cdGV4cG9ydCBjbGFzcyBJdGVtUGlja2VkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1QaWNrZWQgPSBuZXcgSXRlbVBpY2tlZCgwKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgcXVhbnRpdHk6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0ZXhwb3J0IGNsYXNzIEl0ZW1QaWNraW5nRmFpbGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1QaWNraW5nRmFpbGVkID0gbmV3IEl0ZW1QaWNraW5nRmFpbGVkKDAsIDApO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyByZXF1ZXN0ZWQ6IG51bWJlciwgcHVibGljIGluU3RvY2s6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cbiIsImltcG9ydCAqIGFzIENvbGxlY3Rpb25zIGZyb20gXCIuLi9FdmVudFN0b3JlL0NvbGxlY3Rpb25zXCJcbmltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZVwiXG5pbXBvcnQgKiBhcyBFdmVudHMgZnJvbSBcImV2ZW50c1wiXG5cbmZ1bmN0aW9uIHBhZFN0cmluZ1JpZ2h0KHN0cjogc3RyaW5nLCBsZW46IG51bWJlcikge1xuXHRjb25zdCBwYWRkaW5nID0gXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiO1xuXHRyZXR1cm4gKHN0ciArIHBhZGRpbmcpLnNsaWNlKDAsIGxlbik7XG59XG5cbmZ1bmN0aW9uIHBhZE51bWJlckxlZnQodjogbnVtYmVyLCBsZW46IG51bWJlcikge1xuXHRyZXR1cm4gcGFkU3RyaW5nTGVmdCgnJyArIHYsIGxlbik7XG59XG5cbmZ1bmN0aW9uIHBhZFN0cmluZ0xlZnQoc3RyOiBzdHJpbmcsIGxlbjogbnVtYmVyKSB7XG5cdGNvbnN0IHBhZGRpbmcgPSBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI7XG5cdHJldHVybiBwYWRkaW5nLnNsaWNlKDAsIGxlbiAtIHN0ci5sZW5ndGgpICsgc3RyO1xufVxuXG5pbnRlcmZhY2UgSXRlbVJlYWRNb2RlbCB7XG5cdGlkOiBzdHJpbmc7XG5cdGRlc2NyaXB0aW9uOiBzdHJpbmc7XG5cdGFjdGl2ZTogYm9vbGVhbjtcblx0aW5TdG9jazogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgSXRlbXNMaXN0IGV4dGVuZHMgRXZlbnRTdG9yZS5Qcm9qZWN0aW9uIHtcblx0cHJpdmF0ZSBhbGxJdGVtczogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8SXRlbVJlYWRNb2RlbD4gPSBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxJdGVtUmVhZE1vZGVsPigpO1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLk9uKEV2ZW50cy5JdGVtQ3JlYXRlZC5UeXBlLCBlID0+IHtcblx0XHRcdHRoaXMuYWxsSXRlbXMuYWRkKGUuc3RyZWFtSWQsIHtcblx0XHRcdFx0aWQ6IGUuc2t1LFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogZS5kZXNjcmlwdGlvbixcblx0XHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0XHRpblN0b2NrOiAwXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1EaXNhYmxlZC5UeXBlLCBlID0+XG5cdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHQpO1xuXG5cdFx0dGhpcy5PbihFdmVudFN0b3JlLkV2ZW50LlR5cGUsIGUgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2dlbmVyaWMgaGFuZGxlciBmb3IgJywgZSk7XG5cdFx0fSlcblxuXHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1Mb2FkZWQuVHlwZSwgZT0+XG5cdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgKz0gZS5xdWFudGl0eVxuXHRcdFx0KTtcblxuXHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1QaWNrZWQuVHlwZSwgZT0+XG5cdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgLT0gZS5xdWFudGl0eVxuXHRcdFx0KTtcblx0fVxuXG5cdHByaW50KCkge1xuXHRcdGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKVxuXHRcdGNvbnNvbGUubG9nKFwiSXRlbSBsaXN0XCIpO1xuXHRcdGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKVxuXHRcdHZhciB0ZXh0ID0gXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuXCI7XG5cdFx0dGV4dCArPSBgJHtwYWRTdHJpbmdSaWdodChcIklkXCIsIDEwKSB9IHwgJHtwYWRTdHJpbmdSaWdodChcIkRlc2NyaXB0aW9uXCIsIDMyKSB9IHwgJHtwYWRTdHJpbmdMZWZ0KFwiSW4gU3RvY2tcIiwgMTApIH1cXG5gO1xuXHRcdHRleHQgKz0gXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXFxuXCI7XG5cdFx0dGhpcy5hbGxJdGVtcy52YWx1ZXMoKS5mb3JFYWNoKGUgPT4ge1xuXHRcdFx0dGV4dCArPSBgJHtwYWRTdHJpbmdSaWdodChlLmlkLCAxMCkgfSB8ICR7cGFkU3RyaW5nUmlnaHQoZS5kZXNjcmlwdGlvbiwgMzIpIH0gfCAke3BhZE51bWJlckxlZnQoZS5pblN0b2NrLCAxMCkgfVxcbmA7XG5cdFx0fSk7XG5cdFx0dGV4dCArPSBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG5cIjtcblxuXHRcdHZhciBwcmUgPSA8SFRNTFByZUVsZW1lbnQ+IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXG5cdFx0cHJlLmlubmVyVGV4dCA9IHRleHQ7XG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwcmUpO1xuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyBFdmVudFN0b3JlIGZyb20gXCIuLi9FdmVudFN0b3JlL0V2ZW50U3RvcmVcIlxuXG5cdC8qIENvbW1hbmRzICovXG5cdGV4cG9ydCBjbGFzcyBSZWdpc3Rlckl0ZW0gZXh0ZW5kcyBFdmVudFN0b3JlLkNvbW1hbmR7XG5cdFx0c3RhdGljIFR5cGU6IFJlZ2lzdGVySXRlbSA9IG5ldyBSZWdpc3Rlckl0ZW0obnVsbCxudWxsLG51bGwpO1xuXHRcdF9fcmVnaXN0ZXJJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHNrdTpzdHJpbmcsIHB1YmxpYyBkZXNjcmlwdGlvbjpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBEaXNhYmxlSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogRGlzYWJsZUl0ZW0gPSBuZXcgRGlzYWJsZUl0ZW0obnVsbCk7XG5cdFx0X19kaXNhYmxlSXRlbSA9IG51bGw7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIGl0ZW1JZDpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBMb2FkSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogTG9hZEl0ZW0gPSBuZXcgTG9hZEl0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBQaWNrSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogUGlja0l0ZW0gPSBuZXcgUGlja0l0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cbiIsImltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZVwiXG5pbXBvcnQgKiBhcyBFdmVudHMgZnJvbSBcImV2ZW50c1wiXG5cblx0Lyogc3RhdGUgJiBhZ2dyZWdhdGUgKi9cblxuXHRleHBvcnQgY2xhc3MgSXRlbVN0YXRlIGV4dGVuZHMgRXZlbnRTdG9yZS5BZ2dyZWdhdGVTdGF0ZSAge1xuXHRcdHByaXZhdGUgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRwcml2YXRlIGluU3RvY2s6IG51bWJlciA9IDA7XG5cdFx0cHJpdmF0ZSBza3U6c3RyaW5nID0gbnVsbDtcblx0XHRcblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0XHR0aGlzLk9uKEV2ZW50cy5JdGVtRGlzYWJsZWQuVHlwZSwgZT0+IHRoaXMuZGlzYWJsZWQgPSB0cnVlKTtcblx0XHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1Mb2FkZWQuVHlwZSwgZT0+IHRoaXMuaW5TdG9jayArPSBlLnF1YW50aXR5KTtcblx0XHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1QaWNrZWQuVHlwZSwgZT0+IHRoaXMuaW5TdG9jayAtPSBlLnF1YW50aXR5KTtcblx0XHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1DcmVhdGVkLlR5cGUsIGUgPT4gdGhpcy5za3UgPSBlLnNrdSk7XG5cdFx0XHRcblx0XHRcdHRoaXMuYWRkQ2hlY2soe25hbWU6XCJJdGVtIG11c3QgaGF2ZSBhIFNLVVwiLCBydWxlIDogKCk9PlxuXHRcdFx0XHR0aGlzLnNrdSAhPSBudWxsXG5cdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0dGhpcy5hZGRDaGVjayh7bmFtZTpcIkl0ZW0gaW4gc3RvY2sgbXVzdCBub3QgYmUgZGlzYWJsZWRcIiwgcnVsZSA6ICgpPT5cblx0XHRcdFx0dGhpcy5zdG9ja0xldmVsKCkgPT0gMCB8fCAodGhpcy5zdG9ja0xldmVsKCkgPiAwICYmICF0aGlzLmhhc0JlZW5EaXNhYmxlZCgpKVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aGFzQmVlbkRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5kaXNhYmxlZCB9O1xuXHRcdHN0b2NrTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuaW5TdG9jazsgfVxuXHR9XG5cblx0XG5cdC8qIEFHR1JFR0FURSAqL1xuXHRcblx0ZXhwb3J0IGNsYXNzIEl0ZW0gZXh0ZW5kcyBFdmVudFN0b3JlLkFnZ3JlZ2F0ZTxJdGVtU3RhdGU+IGltcGxlbWVudHMgRXZlbnRTdG9yZS5JQWdncmVnYXRlRmFjdG9yeSB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW0gPSBuZXcgSXRlbShudWxsKTtcblx0XHRjb25zdHJ1Y3RvcihpZDogc3RyaW5nKSB7XG5cdFx0XHRzdXBlcihpZCwgbmV3IEl0ZW1TdGF0ZSgpKVxuXHRcdH1cblxuXHRcdHJlZ2lzdGVyKGlkOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcblx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgRXZlbnRzLkl0ZW1DcmVhdGVkKGlkLCBkZXNjcmlwdGlvbikpO1xuXHRcdH1cblxuXHRcdGRpc2FibGUoKSB7XG5cdFx0XHRpZiAoIXRoaXMuU3RhdGUuaGFzQmVlbkRpc2FibGVkKCkpIHtcblx0XHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBFdmVudHMuSXRlbURpc2FibGVkKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxvYWQocXVhbnRpdHk6IG51bWJlcik6IHZvaWQge1xuXHRcdFx0RXJyb3IoKVxuXHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBFdmVudHMuSXRlbUxvYWRlZChxdWFudGl0eSkpXG5cdFx0fVxuXG5cdFx0dW5Mb2FkKHF1YW50aXR5OiBudW1iZXIpOiB2b2lkIHtcblx0XHRcdHZhciBjdXJyZW50U3RvY2sgPSB0aGlzLlN0YXRlLnN0b2NrTGV2ZWwoKTtcblx0XHRcdGlmIChjdXJyZW50U3RvY2sgPj0gcXVhbnRpdHkpIHtcblx0XHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBFdmVudHMuSXRlbVBpY2tlZChxdWFudGl0eSkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEV2ZW50cy5JdGVtUGlja2luZ0ZhaWxlZChxdWFudGl0eSwgY3VycmVudFN0b2NrKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdEZhY3RvcnkoaWQ6c3RyaW5nKXtcblx0XHRcdHJldHVybiBuZXcgSXRlbShpZCk7XG5cdFx0fVxuXHR9XG4iLCJpbXBvcnQgKiBhcyBFdmVudFN0b3JlIGZyb20gXCIuLi9FdmVudFN0b3JlL0V2ZW50U3RvcmVcIlxuaW1wb3J0ICogYXMgQ29tbWFuZHMgZnJvbSBcImNvbW1hbmRzXCJcbmltcG9ydCB7SXRlbX0gZnJvbSBcIml0ZW1cIlxuXG4vKiBoYW5kbGVycyAqL1xuXHRleHBvcnQgY2xhc3MgUmVnaXN0ZXJJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPENvbW1hbmRzLlJlZ2lzdGVySXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oQ29tbWFuZHMuUmVnaXN0ZXJJdGVtLlR5cGUsIHRoaXMpO1xuXHRcdH1cblx0XHRcblx0XHRIYW5kbGUoY29tbWFuZCA6IENvbW1hbmRzLlJlZ2lzdGVySXRlbSl7XG5cdFx0XHR2YXIgaXRlbSA9IEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5nZXRCeUlkKEl0ZW0uVHlwZSwgY29tbWFuZC5pdGVtSWQpO1xuXHRcdFx0aXRlbS5yZWdpc3Rlcihjb21tYW5kLnNrdSwgY29tbWFuZC5kZXNjcmlwdGlvbik7XG5cdFx0XHRFdmVudFN0b3JlLlJlcG9zaXRvcnkuc2F2ZShpdGVtLCBjb21tYW5kLmNvbW1hbmRJZCwgaCA9Pntcblx0XHRcdFx0aC5hZGQoJ3RzJywgRGF0ZSgpKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cdFxuXHRleHBvcnQgY2xhc3MgRGlzYWJsZUl0ZW1IYW5kbGVyIGltcGxlbWVudHMgRXZlbnRTdG9yZS5JQ29tbWFuZEhhbmRsZXI8Q29tbWFuZHMuRGlzYWJsZUl0ZW0+e1xuXHRcdGNvbnN0cnVjdG9yKGJ1czogRXZlbnRTdG9yZS5CdXMpe1xuXHRcdFx0YnVzLk9uKENvbW1hbmRzLkRpc2FibGVJdGVtLlR5cGUsIHRoaXMpO1xuXHRcdH1cblx0XHRcblx0XHRIYW5kbGUoY29tbWFuZCA6IENvbW1hbmRzLkRpc2FibGVJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLmRpc2FibGUoKTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkLCBoID0+e1xuXHRcdFx0XHRoLmFkZCgndHMnLCBEYXRlKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBMb2FkSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxDb21tYW5kcy5Mb2FkSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oQ29tbWFuZHMuTG9hZEl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogQ29tbWFuZHMuTG9hZEl0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0ubG9hZChjb21tYW5kLnF1YW50aXR5KTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBQaWNrSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxDb21tYW5kcy5QaWNrSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oQ29tbWFuZHMuUGlja0l0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogQ29tbWFuZHMuUGlja0l0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0udW5Mb2FkKGNvbW1hbmQucXVhbnRpdHkpO1xuXHRcdFx0RXZlbnRTdG9yZS5SZXBvc2l0b3J5LnNhdmUoaXRlbSwgY29tbWFuZC5jb21tYW5kSWQpO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIEhhbmRsZXJzUmVnaXN0cmF0aW9uXG5cdHtcblx0XHRzdGF0aWMgUmVnaXN0ZXIoYnVzIDogRXZlbnRTdG9yZS5CdXMpe1xuXHRcdFx0bmV3IFJlZ2lzdGVySXRlbUhhbmRsZXIoYnVzKTtcblx0XHRcdG5ldyBEaXNhYmxlSXRlbUhhbmRsZXIoYnVzKTtcblx0XHRcdG5ldyBMb2FkSXRlbUhhbmRsZXIoYnVzKTtcblx0XHRcdG5ldyBQaWNrSXRlbUhhbmRsZXIoYnVzKTtcblx0XHR9XG5cdH1cdFxuIiwiaW1wb3J0ICogYXMgQ29sbGVjdGlvbnMgZnJvbSBcIi4vRXZlbnRTdG9yZS9Db2xsZWN0aW9uc1wiXG5pbXBvcnQgKiBhcyBFdmVudFN0b3JlIGZyb20gXCIuL0V2ZW50U3RvcmUvRXZlbnRTdG9yZVwiXG5pbXBvcnQgKiBhcyBQcm9qZWN0aW9ucyBmcm9tIFwiLi9JbnZlbnRvcnkvcHJvamVjdGlvbnNcIlxuaW1wb3J0IHtIYW5kbGVyc1JlZ2lzdHJhdGlvbn0gZnJvbSBcIi4vSW52ZW50b3J5L2hhbmRsZXJzXCJcbmltcG9ydCAqIGFzIENvbW1hbmRzIGZyb20gXCIuL0ludmVudG9yeS9jb21tYW5kc1wiXG5cblx0dmFyIGJ1cyA9IEV2ZW50U3RvcmUuQnVzLkRlZmF1bHQ7XG5cdHZhciBpdGVtc0xpc3QgPSBuZXcgUHJvamVjdGlvbnMuSXRlbXNMaXN0KCk7XG5cblx0ZnVuY3Rpb24gY29uZmlndXJlKCkge1xuXHRcdC8qIEhhbmRsZXJzIHNldHVwICovXG5cdFx0SGFuZGxlcnNSZWdpc3RyYXRpb24uUmVnaXN0ZXIoYnVzKTtcblx0XHRidXMuc3Vic2NyaWJlKGl0ZW1zTGlzdCk7XG5cdH1cblxuXHRmdW5jdGlvbiBydW4oKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGJ1cy5zZW5kKG5ldyBDb21tYW5kcy5SZWdpc3Rlckl0ZW0oXCJpdGVtXzFcIiwgXCJUU1wiLCBcIkludHJvIHRvIHR5cGVzY3JpcHRcIikpO1xuXHRcdFx0YnVzLnNlbmQobmV3IENvbW1hbmRzLlJlZ2lzdGVySXRlbShcIml0ZW1fMlwiLCBcIk5HXCIsIFwiSW50cm8gdG8gYW5ndWxhcmpzXCIpKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBDb21tYW5kcy5Mb2FkSXRlbShcIml0ZW1fMVwiLCAxMDApKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBDb21tYW5kcy5QaWNrSXRlbShcIml0ZW1fMVwiLCA2OSkpO1xuXHRcdFx0YnVzLnNlbmQobmV3IENvbW1hbmRzLkRpc2FibGVJdGVtKFwiaXRlbV8xXCIpKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvci5tZXNzYWdlKTtcblx0XHR9XG5cdFx0aXRlbXNMaXN0LnByaW50KCk7XG5cdH1cblxuXHRjb25maWd1cmUoKTtcblx0cnVuKCk7XG5cblx0RXZlbnRTdG9yZS5QZXJzaXN0ZW5jZS5kdW1wKCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
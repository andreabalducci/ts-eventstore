var Collections;
(function (Collections) {
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
    Collections.Dictionary = Dictionary;
})(Collections || (Collections = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="Collections.ts"/>
var EventStore;
(function (EventStore) {
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
    EventStore.DomainError = DomainError;
    var InvariantViolatedException = (function (_super) {
        __extends(InvariantViolatedException, _super);
        function InvariantViolatedException() {
            _super.apply(this, arguments);
            this.InvariantViolatedException = "";
        }
        return InvariantViolatedException;
    })(DomainError);
    EventStore.InvariantViolatedException = InvariantViolatedException;
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
    EventStore.Command = Command;
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
    EventStore.Event = Event;
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
    EventStore.Projection = Projection;
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
    EventStore.AggregateState = AggregateState;
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
    EventStore.Aggregate = Aggregate;
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
    EventStore.Stream = Stream;
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
    EventStore.Persistence = Persistence;
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
    EventStore.Repository = Repository;
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
    EventStore.Bus = Bus;
})(EventStore || (EventStore = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../EventStore/EventStore.ts"/>
var Inventory;
(function (Inventory) {
    /* state & aggregate */
    var ItemState = (function (_super) {
        __extends(ItemState, _super);
        function ItemState() {
            var _this = this;
            _super.call(this);
            this.disabled = false;
            this.inStock = 0;
            this.sku = null;
            this.On(ItemDisabled.Type, function (e) { return _this.disabled = true; });
            this.On(ItemLoaded.Type, function (e) { return _this.inStock += e.quantity; });
            this.On(ItemPicked.Type, function (e) { return _this.inStock -= e.quantity; });
            this.On(ItemCreated.Type, function (e) { return _this.sku = e.sku; });
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
    Inventory.ItemState = ItemState;
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
    Inventory.RegisterItem = RegisterItem;
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
    Inventory.DisableItem = DisableItem;
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
    Inventory.LoadItem = LoadItem;
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
    Inventory.PickItem = PickItem;
    /* handlers */
    var RegisterItemHandler = (function () {
        function RegisterItemHandler(bus) {
            bus.On(Inventory.RegisterItem.Type, this);
        }
        RegisterItemHandler.prototype.Handle = function (command) {
            var item = EventStore.Repository.getById(Item.Type, command.itemId);
            item.register(command.sku, command.description);
            EventStore.Repository.save(item, command.commandId, function (h) {
                h.add('ts', Date());
            });
        };
        return RegisterItemHandler;
    })();
    Inventory.RegisterItemHandler = RegisterItemHandler;
    var DisableItemHandler = (function () {
        function DisableItemHandler(bus) {
            bus.On(Inventory.DisableItem.Type, this);
        }
        DisableItemHandler.prototype.Handle = function (command) {
            var item = EventStore.Repository.getById(Item.Type, command.itemId);
            item.disable();
            EventStore.Repository.save(item, command.commandId, function (h) {
                h.add('ts', Date());
            });
        };
        return DisableItemHandler;
    })();
    Inventory.DisableItemHandler = DisableItemHandler;
    var LoadItemHandler = (function () {
        function LoadItemHandler(bus) {
            bus.On(Inventory.LoadItem.Type, this);
        }
        LoadItemHandler.prototype.Handle = function (command) {
            var item = EventStore.Repository.getById(Item.Type, command.itemId);
            item.load(command.quantity);
            EventStore.Repository.save(item, command.commandId);
        };
        return LoadItemHandler;
    })();
    Inventory.LoadItemHandler = LoadItemHandler;
    var PickItemHandler = (function () {
        function PickItemHandler(bus) {
            bus.On(Inventory.PickItem.Type, this);
        }
        PickItemHandler.prototype.Handle = function (command) {
            var item = EventStore.Repository.getById(Item.Type, command.itemId);
            item.unLoad(command.quantity);
            EventStore.Repository.save(item, command.commandId);
        };
        return PickItemHandler;
    })();
    Inventory.PickItemHandler = PickItemHandler;
    var Handlers = (function () {
        function Handlers() {
        }
        Handlers.Register = function (bus) {
            new Inventory.RegisterItemHandler(bus);
            new Inventory.DisableItemHandler(bus);
            new Inventory.LoadItemHandler(bus);
            new Inventory.PickItemHandler(bus);
        };
        return Handlers;
    })();
    Inventory.Handlers = Handlers;
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
    Inventory.ItemCreated = ItemCreated;
    var ItemDisabled = (function (_super) {
        __extends(ItemDisabled, _super);
        function ItemDisabled() {
            _super.call(this);
        }
        ItemDisabled.Type = new ItemDisabled();
        return ItemDisabled;
    })(EventStore.Event);
    Inventory.ItemDisabled = ItemDisabled;
    var ItemLoaded = (function (_super) {
        __extends(ItemLoaded, _super);
        function ItemLoaded(quantity) {
            _super.call(this);
            this.quantity = quantity;
        }
        ItemLoaded.Type = new ItemLoaded(0);
        return ItemLoaded;
    })(EventStore.Event);
    Inventory.ItemLoaded = ItemLoaded;
    var ItemPicked = (function (_super) {
        __extends(ItemPicked, _super);
        function ItemPicked(quantity) {
            _super.call(this);
            this.quantity = quantity;
        }
        ItemPicked.Type = new ItemPicked(0);
        return ItemPicked;
    })(EventStore.Event);
    Inventory.ItemPicked = ItemPicked;
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
    Inventory.ItemPickingFailed = ItemPickingFailed;
    /* AGGREGATE */
    var Item = (function (_super) {
        __extends(Item, _super);
        function Item(id) {
            _super.call(this, id, new ItemState());
        }
        Item.prototype.register = function (id, description) {
            this.RaiseEvent(new ItemCreated(id, description));
        };
        Item.prototype.disable = function () {
            if (!this.State.hasBeenDisabled()) {
                this.RaiseEvent(new ItemDisabled());
            }
        };
        Item.prototype.load = function (quantity) {
            Error();
            this.RaiseEvent(new ItemLoaded(quantity));
        };
        Item.prototype.unLoad = function (quantity) {
            var currentStock = this.State.stockLevel();
            if (currentStock >= quantity) {
                this.RaiseEvent(new ItemPicked(quantity));
            }
            else {
                this.RaiseEvent(new ItemPickingFailed(quantity, currentStock));
            }
        };
        Item.prototype.Factory = function (id) {
            return new Item(id);
        };
        Item.Type = new Item(null);
        return Item;
    })(EventStore.Aggregate);
    Inventory.Item = Item;
})(Inventory || (Inventory = {}));

/// <reference path="./EventStore/Collections.ts"/>
/// <reference path="./Inventory/Item.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Program;
(function (Program) {
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
            this.On(Inventory.ItemCreated.Type, function (e) {
                _this.allItems.add(e.streamId, {
                    id: e.sku,
                    description: e.description,
                    active: true,
                    inStock: 0
                });
            });
            this.On(Inventory.ItemDisabled.Type, function (e) {
                return _this.allItems.getValue(e.streamId).active = false;
            });
            this.On(EventStore.Event.Type, function (e) {
                console.log('generic handler for ', e);
            });
            this.On(Inventory.ItemLoaded.Type, function (e) {
                return _this.allItems.getValue(e.streamId).inStock += e.quantity;
            });
            this.On(Inventory.ItemPicked.Type, function (e) {
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
    var bus = EventStore.Bus.Default;
    var itemsList = new ItemsList();
    function configure() {
        /* Handlers setup */
        Inventory.Handlers.Register(bus);
        bus.subscribe(itemsList);
    }
    function run() {
        try {
            bus.send(new Inventory.RegisterItem("item_1", "TS", "Intro to typescript"));
            bus.send(new Inventory.RegisterItem("item_2", "NG", "Intro to angularjs"));
            bus.send(new Inventory.LoadItem("item_1", 100));
            bus.send(new Inventory.PickItem("item_1", 69));
            bus.send(new Inventory.DisableItem("item_1"));
        }
        catch (error) {
            console.error(error.message);
        }
        itemsList.print();
    }
    configure();
    run();
    EventStore.Persistence.dump();
})(Program || (Program = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50c3RvcmUvQ29sbGVjdGlvbnMudHMiLCJldmVudHN0b3JlL0V2ZW50U3RvcmUudHMiLCJpbnZlbnRvcnkvSXRlbS50cyIsIk1haW4udHMiXSwibmFtZXMiOlsiQ29sbGVjdGlvbnMiLCJDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5IiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS5jb25zdHJ1Y3RvciIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkuYWRkIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS5yZW1vdmUiLCJDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5LmdldFZhbHVlIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS5rZXlzIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS52YWx1ZXMiLCJDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5LmNvbnRhaW5zS2V5IiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS50b0xvb2t1cCIsIkV2ZW50U3RvcmUiLCJFdmVudFN0b3JlLmdldFR5cGUiLCJFdmVudFN0b3JlLmdldENsYXNzTmFtZSIsIkV2ZW50U3RvcmUuRG9tYWluRXJyb3IiLCJFdmVudFN0b3JlLkRvbWFpbkVycm9yLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5JbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiIsIkV2ZW50U3RvcmUuSW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24uY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLkNvbW1hbmQiLCJFdmVudFN0b3JlLkNvbW1hbmQuY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLkNvbW1hbmQuR2V0VHlwZSIsIkV2ZW50U3RvcmUuRXZlbnQiLCJFdmVudFN0b3JlLkV2ZW50LmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5FdmVudC5HZXRUeXBlIiwiRXZlbnRTdG9yZS5Qcm9qZWN0aW9uIiwiRXZlbnRTdG9yZS5Qcm9qZWN0aW9uLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5Qcm9qZWN0aW9uLk9uIiwiRXZlbnRTdG9yZS5Qcm9qZWN0aW9uLkhhbmRsZSIsIkV2ZW50U3RvcmUuUHJvamVjdGlvbi5IYW5kbGVFdmVudCIsIkV2ZW50U3RvcmUuQWdncmVnYXRlU3RhdGUiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZVN0YXRlLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGVTdGF0ZS5hcHBseSIsIkV2ZW50U3RvcmUuQWdncmVnYXRlU3RhdGUuYWRkQ2hlY2siLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZVN0YXRlLmNoZWNrSW52YXJpYW50cyIsIkV2ZW50U3RvcmUuQWdncmVnYXRlIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZS5SYWlzZUV2ZW50IiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUubG9hZEZyb21FdmVudHMiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZS5nZXRBZ2dyZWdhdGVUeXBlIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuZ2V0QWdncmVnYXRlSWQiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZS5nZXRVbmNvbW1pdGVkRXZlbnRzIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuY2hlY2tJbnZhcmlhbnRzIiwiRXZlbnRTdG9yZS5TdHJlYW0iLCJFdmVudFN0b3JlLlN0cmVhbS5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuU3RyZWFtLmdldFN0cmVhbUlkIiwiRXZlbnRTdG9yZS5TdHJlYW0uZ2V0RXZlbnRzIiwiRXZlbnRTdG9yZS5TdHJlYW0uY29tbWl0IiwiRXZlbnRTdG9yZS5QZXJzaXN0ZW5jZSIsIkV2ZW50U3RvcmUuUGVyc2lzdGVuY2UuY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLlBlcnNpc3RlbmNlLm9wZW5TdHJlYW0iLCJFdmVudFN0b3JlLlBlcnNpc3RlbmNlLmR1bXAiLCJFdmVudFN0b3JlLlJlcG9zaXRvcnkiLCJFdmVudFN0b3JlLlJlcG9zaXRvcnkuY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZCIsIkV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlIiwiRXZlbnRTdG9yZS5CdXMiLCJFdmVudFN0b3JlLkJ1cy5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuQnVzLnNlbmQiLCJFdmVudFN0b3JlLkJ1cy5wdWJsaXNoIiwiRXZlbnRTdG9yZS5CdXMuc3Vic2NyaWJlIiwiRXZlbnRTdG9yZS5CdXMuT24iLCJJbnZlbnRvcnkiLCJJbnZlbnRvcnkuSXRlbVN0YXRlIiwiSW52ZW50b3J5Lkl0ZW1TdGF0ZS5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5JdGVtU3RhdGUuaGFzQmVlbkRpc2FibGVkIiwiSW52ZW50b3J5Lkl0ZW1TdGF0ZS5zdG9ja0xldmVsIiwiSW52ZW50b3J5LlJlZ2lzdGVySXRlbSIsIkludmVudG9yeS5SZWdpc3Rlckl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW0iLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuTG9hZEl0ZW0iLCJJbnZlbnRvcnkuTG9hZEl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuUGlja0l0ZW0iLCJJbnZlbnRvcnkuUGlja0l0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtSGFuZGxlciIsIkludmVudG9yeS5SZWdpc3Rlckl0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5LlJlZ2lzdGVySXRlbUhhbmRsZXIuSGFuZGxlIiwiSW52ZW50b3J5LkRpc2FibGVJdGVtSGFuZGxlciIsIkludmVudG9yeS5EaXNhYmxlSXRlbUhhbmRsZXIuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW1IYW5kbGVyLkhhbmRsZSIsIkludmVudG9yeS5Mb2FkSXRlbUhhbmRsZXIiLCJJbnZlbnRvcnkuTG9hZEl0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5LkxvYWRJdGVtSGFuZGxlci5IYW5kbGUiLCJJbnZlbnRvcnkuUGlja0l0ZW1IYW5kbGVyIiwiSW52ZW50b3J5LlBpY2tJdGVtSGFuZGxlci5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5QaWNrSXRlbUhhbmRsZXIuSGFuZGxlIiwiSW52ZW50b3J5LkhhbmRsZXJzIiwiSW52ZW50b3J5LkhhbmRsZXJzLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5LkhhbmRsZXJzLlJlZ2lzdGVyIiwiSW52ZW50b3J5Lkl0ZW1DcmVhdGVkIiwiSW52ZW50b3J5Lkl0ZW1DcmVhdGVkLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5Lkl0ZW1EaXNhYmxlZCIsIkludmVudG9yeS5JdGVtRGlzYWJsZWQuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbUxvYWRlZCIsIkludmVudG9yeS5JdGVtTG9hZGVkLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5Lkl0ZW1QaWNrZWQiLCJJbnZlbnRvcnkuSXRlbVBpY2tlZC5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5JdGVtUGlja2luZ0ZhaWxlZCIsIkludmVudG9yeS5JdGVtUGlja2luZ0ZhaWxlZC5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5JdGVtIiwiSW52ZW50b3J5Lkl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbS5yZWdpc3RlciIsIkludmVudG9yeS5JdGVtLmRpc2FibGUiLCJJbnZlbnRvcnkuSXRlbS5sb2FkIiwiSW52ZW50b3J5Lkl0ZW0udW5Mb2FkIiwiSW52ZW50b3J5Lkl0ZW0uRmFjdG9yeSIsIlByb2dyYW0iLCJQcm9ncmFtLnBhZFN0cmluZ1JpZ2h0IiwiUHJvZ3JhbS5wYWROdW1iZXJMZWZ0IiwiUHJvZ3JhbS5wYWRTdHJpbmdMZWZ0IiwiUHJvZ3JhbS5JdGVtc0xpc3QiLCJQcm9ncmFtLkl0ZW1zTGlzdC5jb25zdHJ1Y3RvciIsIlByb2dyYW0uSXRlbXNMaXN0LnByaW50IiwiUHJvZ3JhbS5jb25maWd1cmUiLCJQcm9ncmFtLnJ1biJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBTyxXQUFXLENBK0RqQjtBQS9ERCxXQUFPLFdBQVcsRUFBQyxDQUFDO0lBV25CQTtRQUtDQyxvQkFBWUEsSUFBdUVB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QUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxxQkFBcUJBLENBQUNBLENBQUNBLENBQUNBO1lBQzVFQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxvQkFBb0JBLENBQUNBLENBQUNBLENBQUNBO1lBQzNFQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoREEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1FBQy9DQSxDQUFFQTtRQUFBQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoQkEsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDOUJBLENBQUNBO1FBQ0RBLFNBQVNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO0lBQ25CQSxDQUFDQTtJQUVEUixTQUFTQSxFQUFFQSxDQUFDQTtJQUNaQSxHQUFHQSxFQUFFQSxDQUFDQTtJQUVOQSxVQUFVQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtBQUMvQkEsQ0FBQ0EsRUFuR00sT0FBTyxLQUFQLE9BQU8sUUFtR2IiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIENvbGxlY3Rpb25zIHtcblxuXHRleHBvcnQgaW50ZXJmYWNlIElEaWN0aW9uYXJ5PFQ+IHtcblx0XHRhZGQoa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogdm9pZDtcblx0XHRyZW1vdmUoa2V5OiBzdHJpbmcpOiB2b2lkO1xuXHRcdGNvbnRhaW5zS2V5KGtleTogc3RyaW5nKTogYm9vbGVhbjtcblx0XHRrZXlzKCk6IHN0cmluZ1tdO1xuXHRcdHZhbHVlcygpOiBUW107XG5cdFx0Z2V0VmFsdWUoa2V5OnN0cmluZyk6VDtcblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5PFQ+IHtcblxuXHRcdF9rZXlzOiBzdHJpbmdbXSA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG5cdFx0X3ZhbHVlczogVFtdID0gbmV3IEFycmF5PFQ+KCk7XG5cblx0XHRjb25zdHJ1Y3Rvcihpbml0OiB7IGtleTogc3RyaW5nOyB2YWx1ZTogVDsgfVtdID0gbmV3IEFycmF5PHtrZXk6c3RyaW5nLCB2YWx1ZTpUfT4oKSkge1xuXG5cdFx0XHRpZiAoaW5pdCkge1xuXHRcdFx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IGluaXQubGVuZ3RoOyB4KyspIHtcblx0XHRcdFx0XHR0aGlzLmFkZChpbml0W3hdLmtleSwgaW5pdFt4XS52YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRhZGQoa2V5OiBzdHJpbmcsIHZhbHVlOiBUKSB7XG5cdFx0XHR0aGlzW2tleV0gPSB2YWx1ZTtcblx0XHRcdHRoaXMuX2tleXMucHVzaChrZXkpO1xuXHRcdFx0dGhpcy5fdmFsdWVzLnB1c2godmFsdWUpO1xuXHRcdH1cblxuXHRcdHJlbW92ZShrZXk6IHN0cmluZykge1xuXHRcdFx0dmFyIGluZGV4ID0gdGhpcy5fa2V5cy5pbmRleE9mKGtleSwgMCk7XG5cdFx0XHR0aGlzLl9rZXlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR0aGlzLl92YWx1ZXMuc3BsaWNlKGluZGV4LCAxKTtcblxuXHRcdFx0ZGVsZXRlIHRoaXNba2V5XTtcblx0XHR9XG5cblx0XHRnZXRWYWx1ZShrZXk6c3RyaW5nKTpUe1xuXHRcdFx0cmV0dXJuIHRoaXNba2V5XTtcblx0XHR9XG5cblx0XHRrZXlzKCk6IHN0cmluZ1tdIHtcblx0XHRcdHJldHVybiB0aGlzLl9rZXlzO1xuXHRcdH1cblxuXHRcdHZhbHVlcygpOiBUW10ge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlcztcblx0XHR9XG5cblx0XHRjb250YWluc0tleShrZXk6IHN0cmluZykge1xuXHRcdFx0aWYgKHR5cGVvZiB0aGlzW2tleV0gPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0b0xvb2t1cCgpOiBJRGljdGlvbmFyeTxUPiB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiQ29sbGVjdGlvbnMudHNcIi8+XG5tb2R1bGUgRXZlbnRTdG9yZSB7XG5cdC8qIEludGVyZmFjZXMgKi9cblx0ZXhwb3J0IGludGVyZmFjZSBJQ29tbWFuZCB7XG5cdFx0Y29tbWFuZElkOiBzdHJpbmc7XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElDb21tYW5kSGFuZGxlcjxUIGV4dGVuZHMgSUNvbW1hbmQ+IHtcblx0XHRIYW5kbGUoY29tbWFuZDogVCk6IHZvaWQ7XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElFdmVudCB7XG5cdFx0c3RyZWFtSWQ6IHN0cmluZztcblx0XHRldmVudElkOiBzdHJpbmc7XG5cdFx0R2V0VHlwZSgpOiBzdHJpbmc7XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElFdmVudEhhbmRsZXI8VCBleHRlbmRzIElFdmVudD4ge1xuXHRcdChldmVudDogVCk6IHZvaWQ7XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElCdXMge1xuXHRcdHNlbmQoY29tbWFuZDogSUNvbW1hbmQpOiB2b2lkO1xuXHRcdHB1Ymxpc2goZXZlbnQ6IElFdmVudCk6IHZvaWQ7XG5cdH1cblx0XG5cdC8qIEltcGxlbWVudGF0aW9ucyAqL1xuXHQvKipcblx0ICogZ2V0VHlwZSBmcm9tIG9iamVjdCBpbnN0YW5jZVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0VHlwZShvKTogc3RyaW5nIHtcblx0XHR2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvbiAoLnsxLH0pXFwoLztcbiAgICAgICAgdmFyIHJlc3VsdHMgPSAoZnVuY05hbWVSZWdleCkuZXhlYygoPGFueT4gbykuY29uc3RydWN0b3IudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDEpID8gcmVzdWx0c1sxXSA6IFwiXCI7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGNsYXNzIG5hbWUgZnJvbSB0eXBlXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRDbGFzc05hbWUobyk6IHN0cmluZyB7XG5cdFx0dmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb24gKC57MSx9KVxcKC87XG4gICAgICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKDxhbnk+IG8pLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0gOiBcIlwiO1xuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIERvbWFpbkVycm9yIGltcGxlbWVudHMgRXJyb3Ige1xuXHRcdG5hbWU6IHN0cmluZztcblxuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBtZXNzYWdlPzogc3RyaW5nKSB7XG5cdFx0XHR0aGlzLm5hbWUgPSBnZXRUeXBlKHRoaXMpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiBleHRlbmRzIERvbWFpbkVycm9yIHtcblx0XHRJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbiA9IFwiXCI7XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgQ29tbWFuZCBpbXBsZW1lbnRzIElDb21tYW5kIHtcblx0XHRzdGF0aWMgQ29tbWFuZENvdW50ZXI6IG51bWJlciA9IDA7XG5cdFx0Y29tbWFuZElkOiBzdHJpbmc7XG5cblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHRoaXMuY29tbWFuZElkID0gXCJjbWRfXCIgKyBDb21tYW5kLkNvbW1hbmRDb3VudGVyKys7XG5cdFx0fVxuXG5cdFx0R2V0VHlwZSgpOiBzdHJpbmcge1xuXHRcdFx0cmV0dXJuIGdldFR5cGUodGhpcyk7XG5cdFx0fVxuXHR9XG5cblxuXHRleHBvcnQgY2xhc3MgRXZlbnQgaW1wbGVtZW50cyBJRXZlbnQge1xuXHRcdHN0YXRpYyBFdmVudENvdW50ZXI6IG51bWJlciA9IDA7XG5cdFx0c3RhdGljIFR5cGU6IEV2ZW50ID0gbmV3IEV2ZW50KCk7XG5cdFx0c3RyZWFtSWQ6IHN0cmluZztcblx0XHRldmVudElkOiBzdHJpbmc7XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHR0aGlzLmV2ZW50SWQgPSBcImV2dF9cIiArIEV2ZW50LkV2ZW50Q291bnRlcisrO1xuXHRcdH1cblxuXHRcdEdldFR5cGUoKTogc3RyaW5nIHtcblx0XHRcdHJldHVybiBnZXRUeXBlKHRoaXMpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBQcm9qZWN0aW9uIHtcblx0XHRwcml2YXRlIGhhbmRsZXJzOiBBcnJheTxJRXZlbnRIYW5kbGVyPElFdmVudD4+ID0gbmV3IEFycmF5PElFdmVudEhhbmRsZXI8SUV2ZW50Pj4oKTtcblx0XHRwcm90ZWN0ZWQgT248VCBleHRlbmRzIElFdmVudD4oZXZlbnQ6IFQsIGhhbmRsZXI6IElFdmVudEhhbmRsZXI8VD4pIHtcblx0XHRcdHZhciBuYW1lID0gZ2V0VHlwZShldmVudCk7XG5cdFx0XHR0aGlzLmhhbmRsZXJzW25hbWVdID0gaGFuZGxlcjtcblx0XHR9XG5cblx0XHRwdWJsaWMgSGFuZGxlKGV2ZW50OiBJRXZlbnQpIHtcblx0XHRcdHRoaXMuSGFuZGxlRXZlbnQoZXZlbnQuR2V0VHlwZSgpLCBldmVudCk7XG5cdFx0XHR0aGlzLkhhbmRsZUV2ZW50KGdldFR5cGUoRXZlbnQuVHlwZSksIGV2ZW50KTtcblx0XHR9XG5cblx0XHRwcml2YXRlIEhhbmRsZUV2ZW50KHR5cGVOYW1lOiBzdHJpbmcsIGV2ZW50OiBJRXZlbnQpIHtcblx0XHRcdHZhciBoYW5kbGVyID0gdGhpcy5oYW5kbGVyc1t0eXBlTmFtZV07XG5cdFx0XHRpZiAoaGFuZGxlcilcblx0XHRcdFx0aGFuZGxlcihldmVudCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJQWdncmVnYXRlIHtcblx0XHRnZXRBZ2dyZWdhdGVUeXBlKCk6IHN0cmluZztcblx0XHRnZXRBZ2dyZWdhdGVJZCgpOiBzdHJpbmc7XG5cdFx0Z2V0VW5jb21taXRlZEV2ZW50cygpOiBJRXZlbnRbXTtcblx0XHRjaGVja0ludmFyaWFudHMoKTtcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSW52YXJpYW50Q2hlY2sge1xuXHRcdG5hbWU6IHN0cmluZztcblx0XHRydWxlPFQgZXh0ZW5kcyBBZ2dyZWdhdGVTdGF0ZT4oKTogQm9vbGVhbjtcblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBBZ2dyZWdhdGVTdGF0ZSBleHRlbmRzIFByb2plY3Rpb24ge1xuXHRcdHByaXZhdGUgX2NoZWNrcyA9IG5ldyBBcnJheTxJbnZhcmlhbnRDaGVjaz4oKTtcblx0XHRhcHBseShldmVudDogSUV2ZW50KTogdm9pZCB7XG5cdFx0XHR0aGlzLkhhbmRsZShldmVudCk7XG5cdFx0fVxuXG5cdFx0cHJvdGVjdGVkIGFkZENoZWNrKGNoZWNrOiBJbnZhcmlhbnRDaGVjaykge1xuXHRcdFx0dGhpcy5fY2hlY2tzLnB1c2goY2hlY2spO1xuXHRcdH1cblxuXHRcdGNoZWNrSW52YXJpYW50cygpIHtcblx0XHRcdHRoaXMuX2NoZWNrcy5mb3JFYWNoKGMgPT4ge1xuXHRcdFx0XHRpZiAoIWMucnVsZSgpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJydWxlIFxcJ1wiICsgYy5uYW1lICsgXCJcXCcgaGFzIGJlZW4gdmlvbGF0ZWRcIik7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uKGMubmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSUFnZ3JlZ2F0ZUZhY3Rvcnkge1xuXHRcdEZhY3RvcnkoaWQ6IHN0cmluZyk6IElBZ2dyZWdhdGVGYWN0b3J5O1xuXHRcdGxvYWRGcm9tRXZlbnRzKGV2ZW50czogSUV2ZW50W10pIDogdm9pZDtcblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBBZ2dyZWdhdGU8VFN0YXRlIGV4dGVuZHMgQWdncmVnYXRlU3RhdGU+IGltcGxlbWVudHMgSUFnZ3JlZ2F0ZSB7XG5cdFx0cHJpdmF0ZSBFdmVudHM6IEFycmF5PElFdmVudD4gPSBuZXcgQXJyYXk8SUV2ZW50PigpO1xuXG5cdFx0Y29uc3RydWN0b3IocHJvdGVjdGVkIGFnZ3JlZ2F0ZUlkOiBzdHJpbmcsIHByb3RlY3RlZCBTdGF0ZTogVFN0YXRlKSB7XG5cblx0XHR9XG5cblx0XHRwcm90ZWN0ZWQgUmFpc2VFdmVudChldmVudDogSUV2ZW50KTogdm9pZCB7XG5cdFx0XHRldmVudC5zdHJlYW1JZCA9IHRoaXMuYWdncmVnYXRlSWQ7XG5cdFx0XHR0aGlzLkV2ZW50cy5wdXNoKGV2ZW50KTtcblx0XHRcdHRoaXMuU3RhdGUuYXBwbHkoZXZlbnQpO1xuXHRcdH1cblxuXHRcdGxvYWRGcm9tRXZlbnRzKGV2ZW50czogSUV2ZW50W10pIDogdm9pZHtcblx0XHRcdGV2ZW50cy5mb3JFYWNoKGU9PnRoaXMuU3RhdGUuYXBwbHkoZSkpO1xuXHRcdH1cblxuXHRcdGdldEFnZ3JlZ2F0ZVR5cGUoKSB7XG5cdFx0XHRyZXR1cm4gZ2V0VHlwZSh0aGlzKTtcblx0XHR9XG5cdFx0Z2V0QWdncmVnYXRlSWQoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5hZ2dyZWdhdGVJZDtcblx0XHR9XG5cdFx0Z2V0VW5jb21taXRlZEV2ZW50cygpOiBJRXZlbnRbXSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5FdmVudHM7XG5cdFx0fVxuXHRcdGNoZWNrSW52YXJpYW50cygpIHtcblx0XHRcdHRoaXMuU3RhdGUuY2hlY2tJbnZhcmlhbnRzKCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJQ29tbWl0IHtcblx0XHRjb21taXRJZDogc3RyaW5nO1xuXHRcdGV2ZW50czogSUV2ZW50W107XG5cdFx0aGVhZGVyczogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8c3RyaW5nPlxuXHR9O1xuXG5cdGV4cG9ydCBjbGFzcyBTdHJlYW0ge1xuXHRcdHByaXZhdGUgY29tbWl0cyA9IG5ldyBBcnJheTxJQ29tbWl0PigpO1xuXHRcdHByaXZhdGUgZXZlbnRzID0gbmV3IEFycmF5PElFdmVudD4oKTtcblx0XHRcblx0XHRjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgc3RyZWFtSWQ6IHN0cmluZykge1xuXG5cdFx0fVxuXG5cdFx0Z2V0U3RyZWFtSWQoKSB7cmV0dXJuIHRoaXMuc3RyZWFtSWQ7fVxuXHRcdFxuXHRcdGdldEV2ZW50cygpOklFdmVudFtde1xuXHRcdFx0cmV0dXJuIHRoaXMuZXZlbnRzO1xuXHRcdH1cblxuXHRcdGNvbW1pdChcblx0XHRcdGV2ZW50czogQXJyYXk8SUV2ZW50Pixcblx0XHRcdGNvbW1pdElkOiBzdHJpbmcsXG5cdFx0XHRwcmVwYXJlSGVhZGVycz86IChoOiBDb2xsZWN0aW9ucy5JRGljdGlvbmFyeTxzdHJpbmc+KSA9PiB2b2lkKTogSUNvbW1pdCB7XG5cblx0XHRcdHZhciBjb21taXQ6IElDb21taXQgPSB7XG5cdFx0XHRcdGNvbW1pdElkOiBjb21taXRJZCxcblx0XHRcdFx0ZXZlbnRzOiBldmVudHMsXG5cdFx0XHRcdGhlYWRlcnM6IG5ldyBDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5PHN0cmluZz4oKVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHByZXBhcmVIZWFkZXJzKSB7XG5cdFx0XHRcdHByZXBhcmVIZWFkZXJzKGNvbW1pdC5oZWFkZXJzKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuY29tbWl0cy5wdXNoKGNvbW1pdCk7XG5cdFx0XHR0aGlzLmV2ZW50cyA9IHRoaXMuZXZlbnRzLmNvbmNhdChldmVudHMpO1xuXHRcdFx0Y29uc29sZS5sb2coJ3NhdmVkIGNvbW1pdCcsIGNvbW1pdCk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBjb21taXQ7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIFBlcnNpc3RlbmNlIHtcblx0XHRwcml2YXRlIHN0YXRpYyBzdHJlYW1zID0gbmV3IENvbGxlY3Rpb25zLkRpY3Rpb25hcnk8U3RyZWFtPigpO1xuXHRcdHN0YXRpYyBvcGVuU3RyZWFtKGlkOiBzdHJpbmcpOiBTdHJlYW0ge1xuXHRcdFx0aWYgKCF0aGlzLnN0cmVhbXMuY29udGFpbnNLZXkoaWQpKSB7XG5cdFx0XHRcdHRoaXMuc3RyZWFtcy5hZGQoaWQsIG5ldyBTdHJlYW0oaWQpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXMuc3RyZWFtcy5nZXRWYWx1ZShpZCk7XG5cdFx0fVxuXHRcdFxuXHRcdHN0YXRpYyBkdW1wKCl7XG5cdFx0XHR0aGlzLnN0cmVhbXMudmFsdWVzKCkuZm9yRWFjaChzID0+IHtjb25zb2xlLmxvZygnc3RyZWFtICcrcy5nZXRTdHJlYW1JZCgpLCBzKX0pO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBSZXBvc2l0b3J5IHtcblx0XHRzdGF0aWMgZ2V0QnlJZDxUIGV4dGVuZHMgSUFnZ3JlZ2F0ZUZhY3Rvcnk+KHR5cGU6IFQsIGlkOiBzdHJpbmcpOiBUIHtcblx0XHRcdHZhciBzdHJlYW0gPSBQZXJzaXN0ZW5jZS5vcGVuU3RyZWFtKGlkKTtcblx0XHRcdHZhciBhZ2dyZWdhdGUgPSA8VD50eXBlLkZhY3RvcnkoaWQpO1xuXHRcdFxuXHRcdFx0YWdncmVnYXRlLmxvYWRGcm9tRXZlbnRzKHN0cmVhbS5nZXRFdmVudHMoKSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBhZ2dyZWdhdGU7XG5cdFx0fVxuXG5cdFx0c3RhdGljIHNhdmUoYWdncmVnYXRlOiBJQWdncmVnYXRlLCBjb21taXRJZDogc3RyaW5nLCBwcmVwYXJlSGVhZGVycz86IChoOiBDb2xsZWN0aW9ucy5JRGljdGlvbmFyeTxzdHJpbmc+KSA9PiB2b2lkKSB7XG5cdFx0XHR2YXIgaWQgPSBhZ2dyZWdhdGUuZ2V0QWdncmVnYXRlSWQoKTtcblx0XHRcdHZhciB0eXBlID0gYWdncmVnYXRlLmdldEFnZ3JlZ2F0ZVR5cGUoKTtcblx0XHRcdGNvbnNvbGUubG9nKCdzYXZpbmcgJyArIHR5cGUgKyBcIltcIiArIGlkICsgXCJdXCIpO1xuXHRcdFx0XG5cdFx0XHQvLyBpdCdzIG9rIHRvIHNhdmU/IFxuXHRcdFx0YWdncmVnYXRlLmNoZWNrSW52YXJpYW50cygpO1xuXHRcdFx0XG5cdFx0XHQvLyBzYXZlIG9uIHN0cmVhbVxuXHRcdFx0dmFyIHN0cmVhbSA9IFBlcnNpc3RlbmNlLm9wZW5TdHJlYW0oaWQpO1xuXHRcdFx0c3RyZWFtLmNvbW1pdChhZ2dyZWdhdGUuZ2V0VW5jb21taXRlZEV2ZW50cygpLCBjb21taXRJZCwgaD0+e1xuXHRcdFx0XHRoLmFkZCgndHlwZScsIHR5cGUpO1xuXHRcdFx0XHRpZihwcmVwYXJlSGVhZGVycyl7XG5cdFx0XHRcdFx0cHJlcGFyZUhlYWRlcnMoaCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHQvLyBkaXNwYXRjaCBldmVudHMgdG8gc3Vic2NyaWJlcnNcblx0XHRcdGFnZ3JlZ2F0ZS5nZXRVbmNvbW1pdGVkRXZlbnRzKCkuZm9yRWFjaChlPT4ge1xuXHRcdFx0XHRCdXMuRGVmYXVsdC5wdWJsaXNoKGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblxuXHRleHBvcnQgY2xhc3MgQnVzIGltcGxlbWVudHMgSUJ1cyB7XG5cdFx0c3RhdGljIERlZmF1bHQgPSBuZXcgQnVzKCk7XG5cdFx0cHJpdmF0ZSBDb25zdW1lcnMgPSBuZXcgQXJyYXk8UHJvamVjdGlvbj4oKTtcblx0XHRwcml2YXRlIEhhbmRsZXJzID0gbmV3IENvbGxlY3Rpb25zLkRpY3Rpb25hcnk8SUNvbW1hbmRIYW5kbGVyPElDb21tYW5kPj4oKTtcblxuXHRcdHNlbmQoY29tbWFuZDogSUNvbW1hbmQpOiB2b2lkIHtcblx0XHRcdHZhciBuYW1lID0gZ2V0VHlwZShjb21tYW5kKTtcblx0XHRcdHZhciBoYW5kbGVyID0gdGhpcy5IYW5kbGVycy5nZXRWYWx1ZShuYW1lKTtcblx0XHRcdGlmICghaGFuZGxlcikge1xuXHRcdFx0XHR0aHJvdyBcIm1pc3NpbmcgaGFuZGxlciBmb3IgXCIgKyBuYW1lO1xuXHRcdFx0fVxuXG5cdFx0XHRoYW5kbGVyLkhhbmRsZShjb21tYW5kKTtcblx0XHR9XG5cblx0XHRwdWJsaXNoKGV2ZW50OiBJRXZlbnQpOiB2b2lkIHtcblx0XHRcdHRoaXMuQ29uc3VtZXJzLmZvckVhY2goY29uc3VtZXI9PiBjb25zdW1lci5IYW5kbGUoZXZlbnQpKTtcblx0XHR9XG5cblx0XHRzdWJzY3JpYmUoY29uc3VtZXI6IFByb2plY3Rpb24pOiB2b2lkIHtcblx0XHRcdHRoaXMuQ29uc3VtZXJzLnB1c2goY29uc3VtZXIpO1xuXHRcdH1cblxuXHRcdE9uPFQgZXh0ZW5kcyBJQ29tbWFuZD4oY29tbWFuZDogVCwgaGFuZGxlcjogSUNvbW1hbmRIYW5kbGVyPFQ+KSB7XG5cdFx0XHR2YXIgbmFtZSA9IGdldFR5cGUoY29tbWFuZCk7XG5cdFx0XHR0aGlzLkhhbmRsZXJzLmFkZChuYW1lLCBoYW5kbGVyKTtcblx0XHR9XG5cdH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vRXZlbnRTdG9yZS9FdmVudFN0b3JlLnRzXCIvPlxubW9kdWxlIEludmVudG9yeSB7XG5cdC8qIHN0YXRlICYgYWdncmVnYXRlICovXG5cblx0ZXhwb3J0IGNsYXNzIEl0ZW1TdGF0ZSBleHRlbmRzIEV2ZW50U3RvcmUuQWdncmVnYXRlU3RhdGUgIHtcblx0XHRwcml2YXRlIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cdFx0cHJpdmF0ZSBpblN0b2NrOiBudW1iZXIgPSAwO1xuXHRcdHByaXZhdGUgc2t1OnN0cmluZyA9IG51bGw7XG5cdFx0XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdFx0dGhpcy5PbihJdGVtRGlzYWJsZWQuVHlwZSwgZT0+IHRoaXMuZGlzYWJsZWQgPSB0cnVlKTtcblx0XHRcdHRoaXMuT24oSXRlbUxvYWRlZC5UeXBlLCBlPT4gdGhpcy5pblN0b2NrICs9IGUucXVhbnRpdHkpO1xuXHRcdFx0dGhpcy5PbihJdGVtUGlja2VkLlR5cGUsIGU9PiB0aGlzLmluU3RvY2sgLT0gZS5xdWFudGl0eSk7XG5cdFx0XHR0aGlzLk9uKEl0ZW1DcmVhdGVkLlR5cGUsIGUgPT4gdGhpcy5za3UgPSBlLnNrdSk7XG5cdFx0XHRcblx0XHRcdHRoaXMuYWRkQ2hlY2soe25hbWU6XCJJdGVtIG11c3QgaGF2ZSBhIFNLVVwiLCBydWxlIDogKCk9PlxuXHRcdFx0XHR0aGlzLnNrdSAhPSBudWxsXG5cdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0dGhpcy5hZGRDaGVjayh7bmFtZTpcIkl0ZW0gaW4gc3RvY2sgbXVzdCBub3QgYmUgZGlzYWJsZWRcIiwgcnVsZSA6ICgpPT5cblx0XHRcdFx0dGhpcy5zdG9ja0xldmVsKCkgPT0gMCB8fCAodGhpcy5zdG9ja0xldmVsKCkgPiAwICYmICF0aGlzLmhhc0JlZW5EaXNhYmxlZCgpKVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aGFzQmVlbkRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5kaXNhYmxlZCB9O1xuXHRcdHN0b2NrTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuaW5TdG9jazsgfVxuXHR9XG5cblx0LyogQ29tbWFuZHMgKi9cblx0ZXhwb3J0IGNsYXNzIFJlZ2lzdGVySXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogUmVnaXN0ZXJJdGVtID0gbmV3IFJlZ2lzdGVySXRlbShudWxsLG51bGwsbnVsbCk7XG5cdFx0X19yZWdpc3Rlckl0ZW0gPSBudWxsO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBpdGVtSWQ6c3RyaW5nLCBwdWJsaWMgc2t1OnN0cmluZywgcHVibGljIGRlc2NyaXB0aW9uOnN0cmluZyl7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIERpc2FibGVJdGVtIGV4dGVuZHMgRXZlbnRTdG9yZS5Db21tYW5ke1xuXHRcdHN0YXRpYyBUeXBlOiBEaXNhYmxlSXRlbSA9IG5ldyBEaXNhYmxlSXRlbShudWxsKTtcblx0XHRfX2Rpc2FibGVJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZyl7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIExvYWRJdGVtIGV4dGVuZHMgRXZlbnRTdG9yZS5Db21tYW5ke1xuXHRcdHN0YXRpYyBUeXBlOiBMb2FkSXRlbSA9IG5ldyBMb2FkSXRlbShudWxsLDApO1xuXHRcdF9fbG9hZEl0ZW0gPSBudWxsO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBpdGVtSWQ6c3RyaW5nLCBwdWJsaWMgcXVhbnRpdHk6IG51bWJlcil7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIFBpY2tJdGVtIGV4dGVuZHMgRXZlbnRTdG9yZS5Db21tYW5ke1xuXHRcdHN0YXRpYyBUeXBlOiBQaWNrSXRlbSA9IG5ldyBQaWNrSXRlbShudWxsLDApO1xuXHRcdF9fbG9hZEl0ZW0gPSBudWxsO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBpdGVtSWQ6c3RyaW5nLCBwdWJsaWMgcXVhbnRpdHk6IG51bWJlcil7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRcblx0LyogaGFuZGxlcnMgKi9cblx0ZXhwb3J0IGNsYXNzIFJlZ2lzdGVySXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxSZWdpc3Rlckl0ZW0+e1xuXHRcdGNvbnN0cnVjdG9yKGJ1czogRXZlbnRTdG9yZS5CdXMpe1xuXHRcdFx0YnVzLk9uKEludmVudG9yeS5SZWdpc3Rlckl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogUmVnaXN0ZXJJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLnJlZ2lzdGVyKGNvbW1hbmQuc2t1LCBjb21tYW5kLmRlc2NyaXB0aW9uKTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkLCBoID0+e1xuXHRcdFx0XHRoLmFkZCgndHMnLCBEYXRlKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBEaXNhYmxlSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxEaXNhYmxlSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oSW52ZW50b3J5LkRpc2FibGVJdGVtLlR5cGUsIHRoaXMpO1xuXHRcdH1cblx0XHRcblx0XHRIYW5kbGUoY29tbWFuZCA6IERpc2FibGVJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLmRpc2FibGUoKTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkLCBoID0+e1xuXHRcdFx0XHRoLmFkZCgndHMnLCBEYXRlKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBMb2FkSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxMb2FkSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oSW52ZW50b3J5LkxvYWRJdGVtLlR5cGUsIHRoaXMpO1xuXHRcdH1cblx0XHRcblx0XHRIYW5kbGUoY29tbWFuZCA6IExvYWRJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLmxvYWQoY29tbWFuZC5xdWFudGl0eSk7XG5cdFx0XHRFdmVudFN0b3JlLlJlcG9zaXRvcnkuc2F2ZShpdGVtLCBjb21tYW5kLmNvbW1hbmRJZCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRleHBvcnQgY2xhc3MgUGlja0l0ZW1IYW5kbGVyIGltcGxlbWVudHMgRXZlbnRTdG9yZS5JQ29tbWFuZEhhbmRsZXI8UGlja0l0ZW0+e1xuXHRcdGNvbnN0cnVjdG9yKGJ1czogRXZlbnRTdG9yZS5CdXMpe1xuXHRcdFx0YnVzLk9uKEludmVudG9yeS5QaWNrSXRlbS5UeXBlLCB0aGlzKTtcblx0XHR9XG5cdFx0XG5cdFx0SGFuZGxlKGNvbW1hbmQgOiBQaWNrSXRlbSl7XG5cdFx0XHR2YXIgaXRlbSA9IEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5nZXRCeUlkKEl0ZW0uVHlwZSwgY29tbWFuZC5pdGVtSWQpO1xuXHRcdFx0aXRlbS51bkxvYWQoY29tbWFuZC5xdWFudGl0eSk7XG5cdFx0XHRFdmVudFN0b3JlLlJlcG9zaXRvcnkuc2F2ZShpdGVtLCBjb21tYW5kLmNvbW1hbmRJZCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRleHBvcnQgY2xhc3MgSGFuZGxlcnNcblx0e1xuXHRcdHN0YXRpYyBSZWdpc3RlcihidXMgOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRuZXcgSW52ZW50b3J5LlJlZ2lzdGVySXRlbUhhbmRsZXIoYnVzKTtcblx0XHRcdG5ldyBJbnZlbnRvcnkuRGlzYWJsZUl0ZW1IYW5kbGVyKGJ1cyk7XG5cdFx0XHRuZXcgSW52ZW50b3J5LkxvYWRJdGVtSGFuZGxlcihidXMpO1xuXHRcdFx0bmV3IEludmVudG9yeS5QaWNrSXRlbUhhbmRsZXIoYnVzKTtcblx0XHR9XG5cdH1cblx0XG5cdC8qIGV2ZW50cyAqL1xuXHRleHBvcnQgY2xhc3MgSXRlbUNyZWF0ZWQgZXh0ZW5kcyBFdmVudFN0b3JlLkV2ZW50IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbUNyZWF0ZWQgPSBuZXcgSXRlbUNyZWF0ZWQobnVsbCwgbnVsbCk7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIHNrdTogc3RyaW5nLCBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZykge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgSXRlbURpc2FibGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1EaXNhYmxlZCA9IG5ldyBJdGVtRGlzYWJsZWQoKTtcblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIEl0ZW1Mb2FkZWQgZXh0ZW5kcyBFdmVudFN0b3JlLkV2ZW50IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbUxvYWRlZCA9IG5ldyBJdGVtTG9hZGVkKDApO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBxdWFudGl0eTogbnVtYmVyKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXG5cblx0ZXhwb3J0IGNsYXNzIEl0ZW1QaWNrZWQgZXh0ZW5kcyBFdmVudFN0b3JlLkV2ZW50IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbVBpY2tlZCA9IG5ldyBJdGVtUGlja2VkKDApO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBxdWFudGl0eTogbnVtYmVyKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRleHBvcnQgY2xhc3MgSXRlbVBpY2tpbmdGYWlsZWQgZXh0ZW5kcyBFdmVudFN0b3JlLkV2ZW50IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbVBpY2tpbmdGYWlsZWQgPSBuZXcgSXRlbVBpY2tpbmdGYWlsZWQoMCwgMCk7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIHJlcXVlc3RlZDogbnVtYmVyLCBwdWJsaWMgaW5TdG9jazogbnVtYmVyKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdC8qIEFHR1JFR0FURSAqL1xuXHRcblx0ZXhwb3J0IGNsYXNzIEl0ZW0gZXh0ZW5kcyBFdmVudFN0b3JlLkFnZ3JlZ2F0ZTxJdGVtU3RhdGU+IGltcGxlbWVudHMgRXZlbnRTdG9yZS5JQWdncmVnYXRlRmFjdG9yeSB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW0gPSBuZXcgSXRlbShudWxsKTtcblx0XHRjb25zdHJ1Y3RvcihpZDogc3RyaW5nKSB7XG5cdFx0XHRzdXBlcihpZCwgbmV3IEl0ZW1TdGF0ZSgpKVxuXHRcdH1cblxuXHRcdHJlZ2lzdGVyKGlkOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcblx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgSXRlbUNyZWF0ZWQoaWQsIGRlc2NyaXB0aW9uKSk7XG5cdFx0fVxuXG5cdFx0ZGlzYWJsZSgpIHtcblx0XHRcdGlmICghdGhpcy5TdGF0ZS5oYXNCZWVuRGlzYWJsZWQoKSkge1xuXHRcdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEl0ZW1EaXNhYmxlZCgpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsb2FkKHF1YW50aXR5OiBudW1iZXIpOiB2b2lkIHtcblx0XHRcdEVycm9yKClcblx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgSXRlbUxvYWRlZChxdWFudGl0eSkpXG5cdFx0fVxuXG5cdFx0dW5Mb2FkKHF1YW50aXR5OiBudW1iZXIpOiB2b2lkIHtcblx0XHRcdHZhciBjdXJyZW50U3RvY2sgPSB0aGlzLlN0YXRlLnN0b2NrTGV2ZWwoKTtcblx0XHRcdGlmIChjdXJyZW50U3RvY2sgPj0gcXVhbnRpdHkpIHtcblx0XHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBJdGVtUGlja2VkKHF1YW50aXR5KSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgSXRlbVBpY2tpbmdGYWlsZWQocXVhbnRpdHksIGN1cnJlbnRTdG9jaykpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRGYWN0b3J5KGlkOnN0cmluZyl7XG5cdFx0XHRyZXR1cm4gbmV3IEl0ZW0oaWQpO1xuXHRcdH1cblx0fVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0V2ZW50U3RvcmUvQ29sbGVjdGlvbnMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9JbnZlbnRvcnkvSXRlbS50c1wiLz5cblxubW9kdWxlIFByb2dyYW0ge1xuXHRmdW5jdGlvbiBwYWRTdHJpbmdSaWdodChzdHI6IHN0cmluZywgbGVuOiBudW1iZXIpIHtcblx0XHRjb25zdCBwYWRkaW5nID0gXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiO1xuXHRcdHJldHVybiAoc3RyICsgcGFkZGluZykuc2xpY2UoMCwgbGVuKTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcGFkTnVtYmVyTGVmdCh2Om51bWJlciwgbGVuOm51bWJlcil7XG5cdFx0cmV0dXJuIHBhZFN0cmluZ0xlZnQoJycrdixsZW4pO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwYWRTdHJpbmdMZWZ0KHN0cjogc3RyaW5nLCBsZW46IG51bWJlcikge1xuXHRcdGNvbnN0IHBhZGRpbmcgPSBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI7XG5cdFx0cmV0dXJuIHBhZGRpbmcuc2xpY2UoMCwgbGVuLXN0ci5sZW5ndGgpICsgc3RyO1xuXHR9XG5cblx0aW50ZXJmYWNlIEl0ZW1SZWFkTW9kZWwge1xuXHRcdGlkOiBzdHJpbmc7XG5cdFx0ZGVzY3JpcHRpb246IHN0cmluZztcblx0XHRhY3RpdmU6IGJvb2xlYW47XG5cdFx0aW5TdG9jazogbnVtYmVyO1xuXHR9XG5cblx0Y2xhc3MgSXRlbXNMaXN0IGV4dGVuZHMgRXZlbnRTdG9yZS5Qcm9qZWN0aW9uIHtcblx0XHRhbGxJdGVtczogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8SXRlbVJlYWRNb2RlbD4gPSBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxJdGVtUmVhZE1vZGVsPigpO1xuXG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtQ3JlYXRlZC5UeXBlLCBlID0+IHtcblx0XHRcdFx0dGhpcy5hbGxJdGVtcy5hZGQoZS5zdHJlYW1JZCwge1xuXHRcdFx0XHRcdGlkOiBlLnNrdSxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZS5kZXNjcmlwdGlvbixcblx0XHRcdFx0XHRhY3RpdmU6IHRydWUsXG5cdFx0XHRcdFx0aW5TdG9jazogMFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtRGlzYWJsZWQuVHlwZSwgZSA9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHRcdCk7XG5cblx0XHRcdHRoaXMuT24oRXZlbnRTdG9yZS5FdmVudC5UeXBlLCBlID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2dlbmVyaWMgaGFuZGxlciBmb3IgJywgZSk7XG5cdFx0XHR9KVxuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtTG9hZGVkLlR5cGUsIGU9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgKz0gZS5xdWFudGl0eVxuXHRcdFx0XHQpO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtUGlja2VkLlR5cGUsIGU9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgLT0gZS5xdWFudGl0eVxuXHRcdFx0XHQpO1xuXHRcdH1cblxuXHRcdHByaW50KCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpXG5cdFx0XHRjb25zb2xlLmxvZyhcIkl0ZW0gbGlzdFwiKTtcblx0XHRcdGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKVxuXHRcdFx0dmFyIHRleHQgPSBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG5cIjsgXG5cdFx0XHR0ZXh0ICs9IGAke3BhZFN0cmluZ1JpZ2h0KFwiSWRcIiwxMCl9IHwgJHtwYWRTdHJpbmdSaWdodChcIkRlc2NyaXB0aW9uXCIsMzIpfSB8ICR7cGFkU3RyaW5nTGVmdChcIkluIFN0b2NrXCIsIDEwKX1cXG5gO1xuXHRcdFx0dGV4dCArPSBcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cXG5cIjsgXG5cdFx0XHR0aGlzLmFsbEl0ZW1zLnZhbHVlcygpLmZvckVhY2goZSA9PiB7XG5cdFx0XHRcdHRleHQgKz0gYCR7cGFkU3RyaW5nUmlnaHQoZS5pZCwxMCl9IHwgJHtwYWRTdHJpbmdSaWdodChlLmRlc2NyaXB0aW9uLDMyKX0gfCAke3BhZE51bWJlckxlZnQoZS5pblN0b2NrLCAxMCl9XFxuYDtcblx0XHRcdH0pO1xuXHRcdFx0dGV4dCArPSBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG5cIjsgXG5cblx0XHRcdHZhciBwcmUgPSA8SFRNTFByZUVsZW1lbnQ+IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXG5cdFx0XHRwcmUuaW5uZXJUZXh0ID0gdGV4dDtcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHJlKTtcblx0XHR9XG5cdH1cblxuXHR2YXIgYnVzID0gRXZlbnRTdG9yZS5CdXMuRGVmYXVsdDtcblx0dmFyIGl0ZW1zTGlzdCA9IG5ldyBJdGVtc0xpc3QoKTtcblxuXHRmdW5jdGlvbiBjb25maWd1cmUoKSB7XG5cdFx0LyogSGFuZGxlcnMgc2V0dXAgKi9cblx0XHRJbnZlbnRvcnkuSGFuZGxlcnMuUmVnaXN0ZXIoYnVzKTtcblx0XHRidXMuc3Vic2NyaWJlKGl0ZW1zTGlzdCk7XG5cdH1cblxuXHRmdW5jdGlvbiBydW4oKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtKFwiaXRlbV8xXCIsIFwiVFNcIiwgXCJJbnRybyB0byB0eXBlc2NyaXB0XCIpKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtKFwiaXRlbV8yXCIsIFwiTkdcIiwgXCJJbnRybyB0byBhbmd1bGFyanNcIikpO1xuXHRcdFx0YnVzLnNlbmQobmV3IEludmVudG9yeS5Mb2FkSXRlbShcIml0ZW1fMVwiLCAxMDApKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUGlja0l0ZW0oXCJpdGVtXzFcIiwgNjkpKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuRGlzYWJsZUl0ZW0oXCJpdGVtXzFcIikpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yLm1lc3NhZ2UpO1xuXHRcdH1cblx0XHRpdGVtc0xpc3QucHJpbnQoKTtcblx0fVxuXG5cdGNvbmZpZ3VyZSgpO1xuXHRydW4oKTtcblxuXHRFdmVudFN0b3JlLlBlcnNpc3RlbmNlLmR1bXAoKTtcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
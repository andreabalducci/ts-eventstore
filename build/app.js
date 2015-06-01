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

/// <reference path="../EventStore/EventStore.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Inventory;
(function (Inventory) {
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
})(Inventory || (Inventory = {}));

/// <reference path="../EventStore/EventStore.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Inventory;
(function (Inventory) {
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
})(Inventory || (Inventory = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../EventStore/EventStore.ts"/>
/// <reference path="events.ts"/>
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
            this.On(Inventory.ItemDisabled.Type, function (e) { return _this.disabled = true; });
            this.On(Inventory.ItemLoaded.Type, function (e) { return _this.inStock += e.quantity; });
            this.On(Inventory.ItemPicked.Type, function (e) { return _this.inStock -= e.quantity; });
            this.On(Inventory.ItemCreated.Type, function (e) { return _this.sku = e.sku; });
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
    /* AGGREGATE */
    var Item = (function (_super) {
        __extends(Item, _super);
        function Item(id) {
            _super.call(this, id, new ItemState());
        }
        Item.prototype.register = function (id, description) {
            this.RaiseEvent(new Inventory.ItemCreated(id, description));
        };
        Item.prototype.disable = function () {
            if (!this.State.hasBeenDisabled()) {
                this.RaiseEvent(new Inventory.ItemDisabled());
            }
        };
        Item.prototype.load = function (quantity) {
            Error();
            this.RaiseEvent(new Inventory.ItemLoaded(quantity));
        };
        Item.prototype.unLoad = function (quantity) {
            var currentStock = this.State.stockLevel();
            if (currentStock >= quantity) {
                this.RaiseEvent(new Inventory.ItemPicked(quantity));
            }
            else {
                this.RaiseEvent(new Inventory.ItemPickingFailed(quantity, currentStock));
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

/// <reference path="../EventStore/EventStore.ts"/>
/// <reference path="commands.ts"/>
/// <reference path="item.ts"/>
var Inventory;
(function (Inventory) {
    /* handlers */
    var RegisterItemHandler = (function () {
        function RegisterItemHandler(bus) {
            bus.On(Inventory.RegisterItem.Type, this);
        }
        RegisterItemHandler.prototype.Handle = function (command) {
            var item = EventStore.Repository.getById(Inventory.Item.Type, command.itemId);
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
            var item = EventStore.Repository.getById(Inventory.Item.Type, command.itemId);
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
            var item = EventStore.Repository.getById(Inventory.Item.Type, command.itemId);
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
            var item = EventStore.Repository.getById(Inventory.Item.Type, command.itemId);
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
})(Inventory || (Inventory = {}));

/// <reference path="./EventStore/Collections.ts"/>
/// <reference path="./Inventory/handlers.ts"/>
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50c3RvcmUvQ29sbGVjdGlvbnMudHMiLCJldmVudHN0b3JlL0V2ZW50U3RvcmUudHMiLCJpbnZlbnRvcnkvY29tbWFuZHMudHMiLCJpbnZlbnRvcnkvZXZlbnRzLnRzIiwiaW52ZW50b3J5L0l0ZW0udHMiLCJpbnZlbnRvcnkvaGFuZGxlcnMudHMiLCJNYWluLnRzIl0sIm5hbWVzIjpbIkNvbGxlY3Rpb25zIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeSIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkuY29uc3RydWN0b3IiLCJDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5LmFkZCIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkucmVtb3ZlIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS5nZXRWYWx1ZSIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkua2V5cyIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkudmFsdWVzIiwiQ29sbGVjdGlvbnMuRGljdGlvbmFyeS5jb250YWluc0tleSIsIkNvbGxlY3Rpb25zLkRpY3Rpb25hcnkudG9Mb29rdXAiLCJFdmVudFN0b3JlIiwiRXZlbnRTdG9yZS5nZXRUeXBlIiwiRXZlbnRTdG9yZS5nZXRDbGFzc05hbWUiLCJFdmVudFN0b3JlLkRvbWFpbkVycm9yIiwiRXZlbnRTdG9yZS5Eb21haW5FcnJvci5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuSW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24iLCJFdmVudFN0b3JlLkludmFyaWFudFZpb2xhdGVkRXhjZXB0aW9uLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5Db21tYW5kIiwiRXZlbnRTdG9yZS5Db21tYW5kLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5Db21tYW5kLkdldFR5cGUiLCJFdmVudFN0b3JlLkV2ZW50IiwiRXZlbnRTdG9yZS5FdmVudC5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuRXZlbnQuR2V0VHlwZSIsIkV2ZW50U3RvcmUuUHJvamVjdGlvbiIsIkV2ZW50U3RvcmUuUHJvamVjdGlvbi5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuUHJvamVjdGlvbi5PbiIsIkV2ZW50U3RvcmUuUHJvamVjdGlvbi5IYW5kbGUiLCJFdmVudFN0b3JlLlByb2plY3Rpb24uSGFuZGxlRXZlbnQiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZVN0YXRlIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGVTdGF0ZS5jb25zdHJ1Y3RvciIsIkV2ZW50U3RvcmUuQWdncmVnYXRlU3RhdGUuYXBwbHkiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZVN0YXRlLmFkZENoZWNrIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGVTdGF0ZS5jaGVja0ludmFyaWFudHMiLCJFdmVudFN0b3JlLkFnZ3JlZ2F0ZSIsIkV2ZW50U3RvcmUuQWdncmVnYXRlLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuUmFpc2VFdmVudCIsIkV2ZW50U3RvcmUuQWdncmVnYXRlLmxvYWRGcm9tRXZlbnRzIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuZ2V0QWdncmVnYXRlVHlwZSIsIkV2ZW50U3RvcmUuQWdncmVnYXRlLmdldEFnZ3JlZ2F0ZUlkIiwiRXZlbnRTdG9yZS5BZ2dyZWdhdGUuZ2V0VW5jb21taXRlZEV2ZW50cyIsIkV2ZW50U3RvcmUuQWdncmVnYXRlLmNoZWNrSW52YXJpYW50cyIsIkV2ZW50U3RvcmUuU3RyZWFtIiwiRXZlbnRTdG9yZS5TdHJlYW0uY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLlN0cmVhbS5nZXRTdHJlYW1JZCIsIkV2ZW50U3RvcmUuU3RyZWFtLmdldEV2ZW50cyIsIkV2ZW50U3RvcmUuU3RyZWFtLmNvbW1pdCIsIkV2ZW50U3RvcmUuUGVyc2lzdGVuY2UiLCJFdmVudFN0b3JlLlBlcnNpc3RlbmNlLmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5QZXJzaXN0ZW5jZS5vcGVuU3RyZWFtIiwiRXZlbnRTdG9yZS5QZXJzaXN0ZW5jZS5kdW1wIiwiRXZlbnRTdG9yZS5SZXBvc2l0b3J5IiwiRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmNvbnN0cnVjdG9yIiwiRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQiLCJFdmVudFN0b3JlLlJlcG9zaXRvcnkuc2F2ZSIsIkV2ZW50U3RvcmUuQnVzIiwiRXZlbnRTdG9yZS5CdXMuY29uc3RydWN0b3IiLCJFdmVudFN0b3JlLkJ1cy5zZW5kIiwiRXZlbnRTdG9yZS5CdXMucHVibGlzaCIsIkV2ZW50U3RvcmUuQnVzLnN1YnNjcmliZSIsIkV2ZW50U3RvcmUuQnVzLk9uIiwiSW52ZW50b3J5IiwiSW52ZW50b3J5LlJlZ2lzdGVySXRlbSIsIkludmVudG9yeS5SZWdpc3Rlckl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW0iLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuTG9hZEl0ZW0iLCJJbnZlbnRvcnkuTG9hZEl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuUGlja0l0ZW0iLCJJbnZlbnRvcnkuUGlja0l0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbUNyZWF0ZWQiLCJJbnZlbnRvcnkuSXRlbUNyZWF0ZWQuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbURpc2FibGVkIiwiSW52ZW50b3J5Lkl0ZW1EaXNhYmxlZC5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5JdGVtTG9hZGVkIiwiSW52ZW50b3J5Lkl0ZW1Mb2FkZWQuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbVBpY2tlZCIsIkludmVudG9yeS5JdGVtUGlja2VkLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5Lkl0ZW1QaWNraW5nRmFpbGVkIiwiSW52ZW50b3J5Lkl0ZW1QaWNraW5nRmFpbGVkLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5Lkl0ZW1TdGF0ZSIsIkludmVudG9yeS5JdGVtU3RhdGUuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbVN0YXRlLmhhc0JlZW5EaXNhYmxlZCIsIkludmVudG9yeS5JdGVtU3RhdGUuc3RvY2tMZXZlbCIsIkludmVudG9yeS5JdGVtIiwiSW52ZW50b3J5Lkl0ZW0uY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSXRlbS5yZWdpc3RlciIsIkludmVudG9yeS5JdGVtLmRpc2FibGUiLCJJbnZlbnRvcnkuSXRlbS5sb2FkIiwiSW52ZW50b3J5Lkl0ZW0udW5Mb2FkIiwiSW52ZW50b3J5Lkl0ZW0uRmFjdG9yeSIsIkludmVudG9yeS5SZWdpc3Rlckl0ZW1IYW5kbGVyIiwiSW52ZW50b3J5LlJlZ2lzdGVySXRlbUhhbmRsZXIuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtSGFuZGxlci5IYW5kbGUiLCJJbnZlbnRvcnkuRGlzYWJsZUl0ZW1IYW5kbGVyIiwiSW52ZW50b3J5LkRpc2FibGVJdGVtSGFuZGxlci5jb25zdHJ1Y3RvciIsIkludmVudG9yeS5EaXNhYmxlSXRlbUhhbmRsZXIuSGFuZGxlIiwiSW52ZW50b3J5LkxvYWRJdGVtSGFuZGxlciIsIkludmVudG9yeS5Mb2FkSXRlbUhhbmRsZXIuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuTG9hZEl0ZW1IYW5kbGVyLkhhbmRsZSIsIkludmVudG9yeS5QaWNrSXRlbUhhbmRsZXIiLCJJbnZlbnRvcnkuUGlja0l0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiSW52ZW50b3J5LlBpY2tJdGVtSGFuZGxlci5IYW5kbGUiLCJJbnZlbnRvcnkuSGFuZGxlcnMiLCJJbnZlbnRvcnkuSGFuZGxlcnMuY29uc3RydWN0b3IiLCJJbnZlbnRvcnkuSGFuZGxlcnMuUmVnaXN0ZXIiLCJQcm9ncmFtIiwiUHJvZ3JhbS5wYWRTdHJpbmdSaWdodCIsIlByb2dyYW0ucGFkTnVtYmVyTGVmdCIsIlByb2dyYW0ucGFkU3RyaW5nTGVmdCIsIlByb2dyYW0uSXRlbXNMaXN0IiwiUHJvZ3JhbS5JdGVtc0xpc3QuY29uc3RydWN0b3IiLCJQcm9ncmFtLkl0ZW1zTGlzdC5wcmludCIsIlByb2dyYW0uY29uZmlndXJlIiwiUHJvZ3JhbS5ydW4iXSwibWFwcGluZ3MiOiJBQUFB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RUE7UUFBQUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaEJBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQzlCQSxDQUFDQTtRQUNEQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtJQUNuQkEsQ0FBQ0E7SUFFRFIsU0FBU0EsRUFBRUEsQ0FBQ0E7SUFDWkEsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFFTkEsVUFBVUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7QUFDL0JBLENBQUNBLEVBbkdNLE9BQU8sS0FBUCxPQUFPLFFBbUdiIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBDb2xsZWN0aW9ucyB7XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJRGljdGlvbmFyeTxUPiB7XG5cdFx0YWRkKGtleTogc3RyaW5nLCB2YWx1ZTogVCk6IHZvaWQ7XG5cdFx0cmVtb3ZlKGtleTogc3RyaW5nKTogdm9pZDtcblx0XHRjb250YWluc0tleShrZXk6IHN0cmluZyk6IGJvb2xlYW47XG5cdFx0a2V5cygpOiBzdHJpbmdbXTtcblx0XHR2YWx1ZXMoKTogVFtdO1xuXHRcdGdldFZhbHVlKGtleTpzdHJpbmcpOlQ7XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgRGljdGlvbmFyeTxUPiB7XG5cblx0XHRfa2V5czogc3RyaW5nW10gPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuXHRcdF92YWx1ZXM6IFRbXSA9IG5ldyBBcnJheTxUPigpO1xuXG5cdFx0Y29uc3RydWN0b3IoaW5pdDogeyBrZXk6IHN0cmluZzsgdmFsdWU6IFQ7IH1bXSA9IG5ldyBBcnJheTx7a2V5OnN0cmluZywgdmFsdWU6VH0+KCkpIHtcblxuXHRcdFx0aWYgKGluaXQpIHtcblx0XHRcdFx0Zm9yICh2YXIgeCA9IDA7IHggPCBpbml0Lmxlbmd0aDsgeCsrKSB7XG5cdFx0XHRcdFx0dGhpcy5hZGQoaW5pdFt4XS5rZXksIGluaXRbeF0udmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0YWRkKGtleTogc3RyaW5nLCB2YWx1ZTogVCkge1xuXHRcdFx0dGhpc1trZXldID0gdmFsdWU7XG5cdFx0XHR0aGlzLl9rZXlzLnB1c2goa2V5KTtcblx0XHRcdHRoaXMuX3ZhbHVlcy5wdXNoKHZhbHVlKTtcblx0XHR9XG5cblx0XHRyZW1vdmUoa2V5OiBzdHJpbmcpIHtcblx0XHRcdHZhciBpbmRleCA9IHRoaXMuX2tleXMuaW5kZXhPZihrZXksIDApO1xuXHRcdFx0dGhpcy5fa2V5cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dGhpcy5fdmFsdWVzLnNwbGljZShpbmRleCwgMSk7XG5cblx0XHRcdGRlbGV0ZSB0aGlzW2tleV07XG5cdFx0fVxuXG5cdFx0Z2V0VmFsdWUoa2V5OnN0cmluZyk6VHtcblx0XHRcdHJldHVybiB0aGlzW2tleV07XG5cdFx0fVxuXG5cdFx0a2V5cygpOiBzdHJpbmdbXSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fa2V5cztcblx0XHR9XG5cblx0XHR2YWx1ZXMoKTogVFtdIHtcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZXM7XG5cdFx0fVxuXG5cdFx0Y29udGFpbnNLZXkoa2V5OiBzdHJpbmcpIHtcblx0XHRcdGlmICh0eXBlb2YgdGhpc1trZXldID09PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0dG9Mb29rdXAoKTogSURpY3Rpb25hcnk8VD4ge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHR9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIkNvbGxlY3Rpb25zLnRzXCIvPlxubW9kdWxlIEV2ZW50U3RvcmUge1xuXHQvKiBJbnRlcmZhY2VzICovXG5cdGV4cG9ydCBpbnRlcmZhY2UgSUNvbW1hbmQge1xuXHRcdGNvbW1hbmRJZDogc3RyaW5nO1xuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJQ29tbWFuZEhhbmRsZXI8VCBleHRlbmRzIElDb21tYW5kPiB7XG5cdFx0SGFuZGxlKGNvbW1hbmQ6IFQpOiB2b2lkO1xuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJRXZlbnQge1xuXHRcdHN0cmVhbUlkOiBzdHJpbmc7XG5cdFx0ZXZlbnRJZDogc3RyaW5nO1xuXHRcdEdldFR5cGUoKTogc3RyaW5nO1xuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJRXZlbnRIYW5kbGVyPFQgZXh0ZW5kcyBJRXZlbnQ+IHtcblx0XHQoZXZlbnQ6IFQpOiB2b2lkO1xuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJQnVzIHtcblx0XHRzZW5kKGNvbW1hbmQ6IElDb21tYW5kKTogdm9pZDtcblx0XHRwdWJsaXNoKGV2ZW50OiBJRXZlbnQpOiB2b2lkO1xuXHR9XG5cdFxuXHQvKiBJbXBsZW1lbnRhdGlvbnMgKi9cblx0LyoqXG5cdCAqIGdldFR5cGUgZnJvbSBvYmplY3QgaW5zdGFuY2Vcblx0ICovXG5cdGZ1bmN0aW9uIGdldFR5cGUobyk6IHN0cmluZyB7XG5cdFx0dmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb24gKC57MSx9KVxcKC87XG4gICAgICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKDxhbnk+IG8pLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0gOiBcIlwiO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBjbGFzcyBuYW1lIGZyb20gdHlwZVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKG8pOiBzdHJpbmcge1xuXHRcdHZhciBmdW5jTmFtZVJlZ2V4ID0gL2Z1bmN0aW9uICguezEsfSlcXCgvO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKCg8YW55PiBvKS50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdIDogXCJcIjtcblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBEb21haW5FcnJvciBpbXBsZW1lbnRzIEVycm9yIHtcblx0XHRuYW1lOiBzdHJpbmc7XG5cblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgbWVzc2FnZT86IHN0cmluZykge1xuXHRcdFx0dGhpcy5uYW1lID0gZ2V0VHlwZSh0aGlzKTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgSW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24gZXh0ZW5kcyBEb21haW5FcnJvciB7XG5cdFx0SW52YXJpYW50VmlvbGF0ZWRFeGNlcHRpb24gPSBcIlwiO1xuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIENvbW1hbmQgaW1wbGVtZW50cyBJQ29tbWFuZCB7XG5cdFx0c3RhdGljIENvbW1hbmRDb3VudGVyOiBudW1iZXIgPSAwO1xuXHRcdGNvbW1hbmRJZDogc3RyaW5nO1xuXG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHR0aGlzLmNvbW1hbmRJZCA9IFwiY21kX1wiICsgQ29tbWFuZC5Db21tYW5kQ291bnRlcisrO1xuXHRcdH1cblxuXHRcdEdldFR5cGUoKTogc3RyaW5nIHtcblx0XHRcdHJldHVybiBnZXRUeXBlKHRoaXMpO1xuXHRcdH1cblx0fVxuXG5cblx0ZXhwb3J0IGNsYXNzIEV2ZW50IGltcGxlbWVudHMgSUV2ZW50IHtcblx0XHRzdGF0aWMgRXZlbnRDb3VudGVyOiBudW1iZXIgPSAwO1xuXHRcdHN0YXRpYyBUeXBlOiBFdmVudCA9IG5ldyBFdmVudCgpO1xuXHRcdHN0cmVhbUlkOiBzdHJpbmc7XG5cdFx0ZXZlbnRJZDogc3RyaW5nO1xuXHRcdGNvbnN0cnVjdG9yKCkge1xuXHRcdFx0dGhpcy5ldmVudElkID0gXCJldnRfXCIgKyBFdmVudC5FdmVudENvdW50ZXIrKztcblx0XHR9XG5cblx0XHRHZXRUeXBlKCk6IHN0cmluZyB7XG5cdFx0XHRyZXR1cm4gZ2V0VHlwZSh0aGlzKTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgUHJvamVjdGlvbiB7XG5cdFx0cHJpdmF0ZSBoYW5kbGVyczogQXJyYXk8SUV2ZW50SGFuZGxlcjxJRXZlbnQ+PiA9IG5ldyBBcnJheTxJRXZlbnRIYW5kbGVyPElFdmVudD4+KCk7XG5cdFx0cHJvdGVjdGVkIE9uPFQgZXh0ZW5kcyBJRXZlbnQ+KGV2ZW50OiBULCBoYW5kbGVyOiBJRXZlbnRIYW5kbGVyPFQ+KSB7XG5cdFx0XHR2YXIgbmFtZSA9IGdldFR5cGUoZXZlbnQpO1xuXHRcdFx0dGhpcy5oYW5kbGVyc1tuYW1lXSA9IGhhbmRsZXI7XG5cdFx0fVxuXG5cdFx0cHVibGljIEhhbmRsZShldmVudDogSUV2ZW50KSB7XG5cdFx0XHR0aGlzLkhhbmRsZUV2ZW50KGV2ZW50LkdldFR5cGUoKSwgZXZlbnQpO1xuXHRcdFx0dGhpcy5IYW5kbGVFdmVudChnZXRUeXBlKEV2ZW50LlR5cGUpLCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cHJpdmF0ZSBIYW5kbGVFdmVudCh0eXBlTmFtZTogc3RyaW5nLCBldmVudDogSUV2ZW50KSB7XG5cdFx0XHR2YXIgaGFuZGxlciA9IHRoaXMuaGFuZGxlcnNbdHlwZU5hbWVdO1xuXHRcdFx0aWYgKGhhbmRsZXIpXG5cdFx0XHRcdGhhbmRsZXIoZXZlbnQpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSUFnZ3JlZ2F0ZSB7XG5cdFx0Z2V0QWdncmVnYXRlVHlwZSgpOiBzdHJpbmc7XG5cdFx0Z2V0QWdncmVnYXRlSWQoKTogc3RyaW5nO1xuXHRcdGdldFVuY29tbWl0ZWRFdmVudHMoKTogSUV2ZW50W107XG5cdFx0Y2hlY2tJbnZhcmlhbnRzKCk7XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIEludmFyaWFudENoZWNrIHtcblx0XHRuYW1lOiBzdHJpbmc7XG5cdFx0cnVsZTxUIGV4dGVuZHMgQWdncmVnYXRlU3RhdGU+KCk6IEJvb2xlYW47XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgQWdncmVnYXRlU3RhdGUgZXh0ZW5kcyBQcm9qZWN0aW9uIHtcblx0XHRwcml2YXRlIF9jaGVja3MgPSBuZXcgQXJyYXk8SW52YXJpYW50Q2hlY2s+KCk7XG5cdFx0YXBwbHkoZXZlbnQ6IElFdmVudCk6IHZvaWQge1xuXHRcdFx0dGhpcy5IYW5kbGUoZXZlbnQpO1xuXHRcdH1cblxuXHRcdHByb3RlY3RlZCBhZGRDaGVjayhjaGVjazogSW52YXJpYW50Q2hlY2spIHtcblx0XHRcdHRoaXMuX2NoZWNrcy5wdXNoKGNoZWNrKTtcblx0XHR9XG5cblx0XHRjaGVja0ludmFyaWFudHMoKSB7XG5cdFx0XHR0aGlzLl9jaGVja3MuZm9yRWFjaChjID0+IHtcblx0XHRcdFx0aWYgKCFjLnJ1bGUoKSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwicnVsZSBcXCdcIiArIGMubmFtZSArIFwiXFwnIGhhcyBiZWVuIHZpb2xhdGVkXCIpO1xuXHRcdFx0XHRcdHRocm93IG5ldyBJbnZhcmlhbnRWaW9sYXRlZEV4Y2VwdGlvbihjLm5hbWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElBZ2dyZWdhdGVGYWN0b3J5IHtcblx0XHRGYWN0b3J5KGlkOiBzdHJpbmcpOiBJQWdncmVnYXRlRmFjdG9yeTtcblx0XHRsb2FkRnJvbUV2ZW50cyhldmVudHM6IElFdmVudFtdKSA6IHZvaWQ7XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgQWdncmVnYXRlPFRTdGF0ZSBleHRlbmRzIEFnZ3JlZ2F0ZVN0YXRlPiBpbXBsZW1lbnRzIElBZ2dyZWdhdGUge1xuXHRcdHByaXZhdGUgRXZlbnRzOiBBcnJheTxJRXZlbnQ+ID0gbmV3IEFycmF5PElFdmVudD4oKTtcblxuXHRcdGNvbnN0cnVjdG9yKHByb3RlY3RlZCBhZ2dyZWdhdGVJZDogc3RyaW5nLCBwcm90ZWN0ZWQgU3RhdGU6IFRTdGF0ZSkge1xuXG5cdFx0fVxuXG5cdFx0cHJvdGVjdGVkIFJhaXNlRXZlbnQoZXZlbnQ6IElFdmVudCk6IHZvaWQge1xuXHRcdFx0ZXZlbnQuc3RyZWFtSWQgPSB0aGlzLmFnZ3JlZ2F0ZUlkO1xuXHRcdFx0dGhpcy5FdmVudHMucHVzaChldmVudCk7XG5cdFx0XHR0aGlzLlN0YXRlLmFwcGx5KGV2ZW50KTtcblx0XHR9XG5cblx0XHRsb2FkRnJvbUV2ZW50cyhldmVudHM6IElFdmVudFtdKSA6IHZvaWR7XG5cdFx0XHRldmVudHMuZm9yRWFjaChlPT50aGlzLlN0YXRlLmFwcGx5KGUpKTtcblx0XHR9XG5cblx0XHRnZXRBZ2dyZWdhdGVUeXBlKCkge1xuXHRcdFx0cmV0dXJuIGdldFR5cGUodGhpcyk7XG5cdFx0fVxuXHRcdGdldEFnZ3JlZ2F0ZUlkKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuYWdncmVnYXRlSWQ7XG5cdFx0fVxuXHRcdGdldFVuY29tbWl0ZWRFdmVudHMoKTogSUV2ZW50W10ge1xuXHRcdFx0cmV0dXJuIHRoaXMuRXZlbnRzO1xuXHRcdH1cblx0XHRjaGVja0ludmFyaWFudHMoKSB7XG5cdFx0XHR0aGlzLlN0YXRlLmNoZWNrSW52YXJpYW50cygpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSUNvbW1pdCB7XG5cdFx0Y29tbWl0SWQ6IHN0cmluZztcblx0XHRldmVudHM6IElFdmVudFtdO1xuXHRcdGhlYWRlcnM6IENvbGxlY3Rpb25zLklEaWN0aW9uYXJ5PHN0cmluZz5cblx0fTtcblxuXHRleHBvcnQgY2xhc3MgU3RyZWFtIHtcblx0XHRwcml2YXRlIGNvbW1pdHMgPSBuZXcgQXJyYXk8SUNvbW1pdD4oKTtcblx0XHRwcml2YXRlIGV2ZW50cyA9IG5ldyBBcnJheTxJRXZlbnQ+KCk7XG5cdFx0XG5cdFx0Y29uc3RydWN0b3IocHJvdGVjdGVkIHN0cmVhbUlkOiBzdHJpbmcpIHtcblxuXHRcdH1cblxuXHRcdGdldFN0cmVhbUlkKCkge3JldHVybiB0aGlzLnN0cmVhbUlkO31cblx0XHRcblx0XHRnZXRFdmVudHMoKTpJRXZlbnRbXXtcblx0XHRcdHJldHVybiB0aGlzLmV2ZW50cztcblx0XHR9XG5cblx0XHRjb21taXQoXG5cdFx0XHRldmVudHM6IEFycmF5PElFdmVudD4sXG5cdFx0XHRjb21taXRJZDogc3RyaW5nLFxuXHRcdFx0cHJlcGFyZUhlYWRlcnM/OiAoaDogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8c3RyaW5nPikgPT4gdm9pZCk6IElDb21taXQge1xuXG5cdFx0XHR2YXIgY29tbWl0OiBJQ29tbWl0ID0ge1xuXHRcdFx0XHRjb21taXRJZDogY29tbWl0SWQsXG5cdFx0XHRcdGV2ZW50czogZXZlbnRzLFxuXHRcdFx0XHRoZWFkZXJzOiBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxzdHJpbmc+KClcblx0XHRcdH07XG5cblx0XHRcdGlmIChwcmVwYXJlSGVhZGVycykge1xuXHRcdFx0XHRwcmVwYXJlSGVhZGVycyhjb21taXQuaGVhZGVycyk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmNvbW1pdHMucHVzaChjb21taXQpO1xuXHRcdFx0dGhpcy5ldmVudHMgPSB0aGlzLmV2ZW50cy5jb25jYXQoZXZlbnRzKTtcblx0XHRcdGNvbnNvbGUubG9nKCdzYXZlZCBjb21taXQnLCBjb21taXQpO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gY29tbWl0O1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBQZXJzaXN0ZW5jZSB7XG5cdFx0cHJpdmF0ZSBzdGF0aWMgc3RyZWFtcyA9IG5ldyBDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5PFN0cmVhbT4oKTtcblx0XHRzdGF0aWMgb3BlblN0cmVhbShpZDogc3RyaW5nKTogU3RyZWFtIHtcblx0XHRcdGlmICghdGhpcy5zdHJlYW1zLmNvbnRhaW5zS2V5KGlkKSkge1xuXHRcdFx0XHR0aGlzLnN0cmVhbXMuYWRkKGlkLCBuZXcgU3RyZWFtKGlkKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLnN0cmVhbXMuZ2V0VmFsdWUoaWQpO1xuXHRcdH1cblx0XHRcblx0XHRzdGF0aWMgZHVtcCgpe1xuXHRcdFx0dGhpcy5zdHJlYW1zLnZhbHVlcygpLmZvckVhY2gocyA9PiB7Y29uc29sZS5sb2coJ3N0cmVhbSAnK3MuZ2V0U3RyZWFtSWQoKSwgcyl9KTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgUmVwb3NpdG9yeSB7XG5cdFx0c3RhdGljIGdldEJ5SWQ8VCBleHRlbmRzIElBZ2dyZWdhdGVGYWN0b3J5Pih0eXBlOiBULCBpZDogc3RyaW5nKTogVCB7XG5cdFx0XHR2YXIgc3RyZWFtID0gUGVyc2lzdGVuY2Uub3BlblN0cmVhbShpZCk7XG5cdFx0XHR2YXIgYWdncmVnYXRlID0gPFQ+dHlwZS5GYWN0b3J5KGlkKTtcblx0XHRcblx0XHRcdGFnZ3JlZ2F0ZS5sb2FkRnJvbUV2ZW50cyhzdHJlYW0uZ2V0RXZlbnRzKCkpO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gYWdncmVnYXRlO1xuXHRcdH1cblxuXHRcdHN0YXRpYyBzYXZlKGFnZ3JlZ2F0ZTogSUFnZ3JlZ2F0ZSwgY29tbWl0SWQ6IHN0cmluZywgcHJlcGFyZUhlYWRlcnM/OiAoaDogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8c3RyaW5nPikgPT4gdm9pZCkge1xuXHRcdFx0dmFyIGlkID0gYWdncmVnYXRlLmdldEFnZ3JlZ2F0ZUlkKCk7XG5cdFx0XHR2YXIgdHlwZSA9IGFnZ3JlZ2F0ZS5nZXRBZ2dyZWdhdGVUeXBlKCk7XG5cdFx0XHRjb25zb2xlLmxvZygnc2F2aW5nICcgKyB0eXBlICsgXCJbXCIgKyBpZCArIFwiXVwiKTtcblx0XHRcdFxuXHRcdFx0Ly8gaXQncyBvayB0byBzYXZlPyBcblx0XHRcdGFnZ3JlZ2F0ZS5jaGVja0ludmFyaWFudHMoKTtcblx0XHRcdFxuXHRcdFx0Ly8gc2F2ZSBvbiBzdHJlYW1cblx0XHRcdHZhciBzdHJlYW0gPSBQZXJzaXN0ZW5jZS5vcGVuU3RyZWFtKGlkKTtcblx0XHRcdHN0cmVhbS5jb21taXQoYWdncmVnYXRlLmdldFVuY29tbWl0ZWRFdmVudHMoKSwgY29tbWl0SWQsIGg9Pntcblx0XHRcdFx0aC5hZGQoJ3R5cGUnLCB0eXBlKTtcblx0XHRcdFx0aWYocHJlcGFyZUhlYWRlcnMpe1xuXHRcdFx0XHRcdHByZXBhcmVIZWFkZXJzKGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0Ly8gZGlzcGF0Y2ggZXZlbnRzIHRvIHN1YnNjcmliZXJzXG5cdFx0XHRhZ2dyZWdhdGUuZ2V0VW5jb21taXRlZEV2ZW50cygpLmZvckVhY2goZT0+IHtcblx0XHRcdFx0QnVzLkRlZmF1bHQucHVibGlzaChlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cblx0ZXhwb3J0IGNsYXNzIEJ1cyBpbXBsZW1lbnRzIElCdXMge1xuXHRcdHN0YXRpYyBEZWZhdWx0ID0gbmV3IEJ1cygpO1xuXHRcdHByaXZhdGUgQ29uc3VtZXJzID0gbmV3IEFycmF5PFByb2plY3Rpb24+KCk7XG5cdFx0cHJpdmF0ZSBIYW5kbGVycyA9IG5ldyBDb2xsZWN0aW9ucy5EaWN0aW9uYXJ5PElDb21tYW5kSGFuZGxlcjxJQ29tbWFuZD4+KCk7XG5cblx0XHRzZW5kKGNvbW1hbmQ6IElDb21tYW5kKTogdm9pZCB7XG5cdFx0XHR2YXIgbmFtZSA9IGdldFR5cGUoY29tbWFuZCk7XG5cdFx0XHR2YXIgaGFuZGxlciA9IHRoaXMuSGFuZGxlcnMuZ2V0VmFsdWUobmFtZSk7XG5cdFx0XHRpZiAoIWhhbmRsZXIpIHtcblx0XHRcdFx0dGhyb3cgXCJtaXNzaW5nIGhhbmRsZXIgZm9yIFwiICsgbmFtZTtcblx0XHRcdH1cblxuXHRcdFx0aGFuZGxlci5IYW5kbGUoY29tbWFuZCk7XG5cdFx0fVxuXG5cdFx0cHVibGlzaChldmVudDogSUV2ZW50KTogdm9pZCB7XG5cdFx0XHR0aGlzLkNvbnN1bWVycy5mb3JFYWNoKGNvbnN1bWVyPT4gY29uc3VtZXIuSGFuZGxlKGV2ZW50KSk7XG5cdFx0fVxuXG5cdFx0c3Vic2NyaWJlKGNvbnN1bWVyOiBQcm9qZWN0aW9uKTogdm9pZCB7XG5cdFx0XHR0aGlzLkNvbnN1bWVycy5wdXNoKGNvbnN1bWVyKTtcblx0XHR9XG5cblx0XHRPbjxUIGV4dGVuZHMgSUNvbW1hbmQ+KGNvbW1hbmQ6IFQsIGhhbmRsZXI6IElDb21tYW5kSGFuZGxlcjxUPikge1xuXHRcdFx0dmFyIG5hbWUgPSBnZXRUeXBlKGNvbW1hbmQpO1xuXHRcdFx0dGhpcy5IYW5kbGVycy5hZGQobmFtZSwgaGFuZGxlcik7XG5cdFx0fVxuXHR9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZS50c1wiLz5cblxubW9kdWxlIEludmVudG9yeSB7XG5cdC8qIENvbW1hbmRzICovXG5cdGV4cG9ydCBjbGFzcyBSZWdpc3Rlckl0ZW0gZXh0ZW5kcyBFdmVudFN0b3JlLkNvbW1hbmR7XG5cdFx0c3RhdGljIFR5cGU6IFJlZ2lzdGVySXRlbSA9IG5ldyBSZWdpc3Rlckl0ZW0obnVsbCxudWxsLG51bGwpO1xuXHRcdF9fcmVnaXN0ZXJJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHNrdTpzdHJpbmcsIHB1YmxpYyBkZXNjcmlwdGlvbjpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBEaXNhYmxlSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogRGlzYWJsZUl0ZW0gPSBuZXcgRGlzYWJsZUl0ZW0obnVsbCk7XG5cdFx0X19kaXNhYmxlSXRlbSA9IG51bGw7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIGl0ZW1JZDpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBMb2FkSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogTG9hZEl0ZW0gPSBuZXcgTG9hZEl0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBQaWNrSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogUGlja0l0ZW0gPSBuZXcgUGlja0l0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vRXZlbnRTdG9yZS9FdmVudFN0b3JlLnRzXCIvPlxuXG5tb2R1bGUgSW52ZW50b3J5IHtcblx0LyogZXZlbnRzICovXG5cdGV4cG9ydCBjbGFzcyBJdGVtQ3JlYXRlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtQ3JlYXRlZCA9IG5ldyBJdGVtQ3JlYXRlZChudWxsLCBudWxsKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgc2t1OiBzdHJpbmcsIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBJdGVtRGlzYWJsZWQgZXh0ZW5kcyBFdmVudFN0b3JlLkV2ZW50IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbURpc2FibGVkID0gbmV3IEl0ZW1EaXNhYmxlZCgpO1xuXHRcdGNvbnN0cnVjdG9yKCkge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgY2xhc3MgSXRlbUxvYWRlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtTG9hZGVkID0gbmV3IEl0ZW1Mb2FkZWQoMCk7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIHF1YW50aXR5OiBudW1iZXIpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG5cblxuXHRleHBvcnQgY2xhc3MgSXRlbVBpY2tlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtUGlja2VkID0gbmV3IEl0ZW1QaWNrZWQoMCk7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIHF1YW50aXR5OiBudW1iZXIpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG5cdGV4cG9ydCBjbGFzcyBJdGVtUGlja2luZ0ZhaWxlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtUGlja2luZ0ZhaWxlZCA9IG5ldyBJdGVtUGlja2luZ0ZhaWxlZCgwLCAwKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgcmVxdWVzdGVkOiBudW1iZXIsIHB1YmxpYyBpblN0b2NrOiBudW1iZXIpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJldmVudHMudHNcIi8+XG5tb2R1bGUgSW52ZW50b3J5IHtcblx0Lyogc3RhdGUgJiBhZ2dyZWdhdGUgKi9cblxuXHRleHBvcnQgY2xhc3MgSXRlbVN0YXRlIGV4dGVuZHMgRXZlbnRTdG9yZS5BZ2dyZWdhdGVTdGF0ZSAge1xuXHRcdHByaXZhdGUgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRwcml2YXRlIGluU3RvY2s6IG51bWJlciA9IDA7XG5cdFx0cHJpdmF0ZSBza3U6c3RyaW5nID0gbnVsbDtcblx0XHRcblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0XHR0aGlzLk9uKEl0ZW1EaXNhYmxlZC5UeXBlLCBlPT4gdGhpcy5kaXNhYmxlZCA9IHRydWUpO1xuXHRcdFx0dGhpcy5PbihJdGVtTG9hZGVkLlR5cGUsIGU9PiB0aGlzLmluU3RvY2sgKz0gZS5xdWFudGl0eSk7XG5cdFx0XHR0aGlzLk9uKEl0ZW1QaWNrZWQuVHlwZSwgZT0+IHRoaXMuaW5TdG9jayAtPSBlLnF1YW50aXR5KTtcblx0XHRcdHRoaXMuT24oSXRlbUNyZWF0ZWQuVHlwZSwgZSA9PiB0aGlzLnNrdSA9IGUuc2t1KTtcblx0XHRcdFxuXHRcdFx0dGhpcy5hZGRDaGVjayh7bmFtZTpcIkl0ZW0gbXVzdCBoYXZlIGEgU0tVXCIsIHJ1bGUgOiAoKT0+XG5cdFx0XHRcdHRoaXMuc2t1ICE9IG51bGxcblx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHR0aGlzLmFkZENoZWNrKHtuYW1lOlwiSXRlbSBpbiBzdG9jayBtdXN0IG5vdCBiZSBkaXNhYmxlZFwiLCBydWxlIDogKCk9PlxuXHRcdFx0XHR0aGlzLnN0b2NrTGV2ZWwoKSA9PSAwIHx8ICh0aGlzLnN0b2NrTGV2ZWwoKSA+IDAgJiYgIXRoaXMuaGFzQmVlbkRpc2FibGVkKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRoYXNCZWVuRGlzYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmRpc2FibGVkIH07XG5cdFx0c3RvY2tMZXZlbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pblN0b2NrOyB9XG5cdH1cblxuXHRcblx0LyogQUdHUkVHQVRFICovXG5cdFxuXHRleHBvcnQgY2xhc3MgSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQWdncmVnYXRlPEl0ZW1TdGF0ZT4gaW1wbGVtZW50cyBFdmVudFN0b3JlLklBZ2dyZWdhdGVGYWN0b3J5IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbSA9IG5ldyBJdGVtKG51bGwpO1xuXHRcdGNvbnN0cnVjdG9yKGlkOiBzdHJpbmcpIHtcblx0XHRcdHN1cGVyKGlkLCBuZXcgSXRlbVN0YXRlKCkpXG5cdFx0fVxuXG5cdFx0cmVnaXN0ZXIoaWQ6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xuXHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBJdGVtQ3JlYXRlZChpZCwgZGVzY3JpcHRpb24pKTtcblx0XHR9XG5cblx0XHRkaXNhYmxlKCkge1xuXHRcdFx0aWYgKCF0aGlzLlN0YXRlLmhhc0JlZW5EaXNhYmxlZCgpKSB7XG5cdFx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgSXRlbURpc2FibGVkKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxvYWQocXVhbnRpdHk6IG51bWJlcik6IHZvaWQge1xuXHRcdFx0RXJyb3IoKVxuXHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBJdGVtTG9hZGVkKHF1YW50aXR5KSlcblx0XHR9XG5cblx0XHR1bkxvYWQocXVhbnRpdHk6IG51bWJlcik6IHZvaWQge1xuXHRcdFx0dmFyIGN1cnJlbnRTdG9jayA9IHRoaXMuU3RhdGUuc3RvY2tMZXZlbCgpO1xuXHRcdFx0aWYgKGN1cnJlbnRTdG9jayA+PSBxdWFudGl0eSkge1xuXHRcdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEl0ZW1QaWNrZWQocXVhbnRpdHkpKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBJdGVtUGlja2luZ0ZhaWxlZChxdWFudGl0eSwgY3VycmVudFN0b2NrKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdEZhY3RvcnkoaWQ6c3RyaW5nKXtcblx0XHRcdHJldHVybiBuZXcgSXRlbShpZCk7XG5cdFx0fVxuXHR9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL0V2ZW50U3RvcmUvRXZlbnRTdG9yZS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb21tYW5kcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJpdGVtLnRzXCIvPlxuXG5tb2R1bGUgSW52ZW50b3J5IHtcblx0XG4vKiBoYW5kbGVycyAqL1xuXHRleHBvcnQgY2xhc3MgUmVnaXN0ZXJJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPFJlZ2lzdGVySXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oSW52ZW50b3J5LlJlZ2lzdGVySXRlbS5UeXBlLCB0aGlzKTtcblx0XHR9XG5cdFx0XG5cdFx0SGFuZGxlKGNvbW1hbmQgOiBSZWdpc3Rlckl0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0ucmVnaXN0ZXIoY29tbWFuZC5za3UsIGNvbW1hbmQuZGVzY3JpcHRpb24pO1xuXHRcdFx0RXZlbnRTdG9yZS5SZXBvc2l0b3J5LnNhdmUoaXRlbSwgY29tbWFuZC5jb21tYW5kSWQsIGggPT57XG5cdFx0XHRcdGguYWRkKCd0cycsIERhdGUoKSlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIERpc2FibGVJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPERpc2FibGVJdGVtPntcblx0XHRjb25zdHJ1Y3RvcihidXM6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdGJ1cy5PbihJbnZlbnRvcnkuRGlzYWJsZUl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogRGlzYWJsZUl0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0uZGlzYWJsZSgpO1xuXHRcdFx0RXZlbnRTdG9yZS5SZXBvc2l0b3J5LnNhdmUoaXRlbSwgY29tbWFuZC5jb21tYW5kSWQsIGggPT57XG5cdFx0XHRcdGguYWRkKCd0cycsIERhdGUoKSlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIExvYWRJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPExvYWRJdGVtPntcblx0XHRjb25zdHJ1Y3RvcihidXM6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdGJ1cy5PbihJbnZlbnRvcnkuTG9hZEl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogTG9hZEl0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0ubG9hZChjb21tYW5kLnF1YW50aXR5KTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBQaWNrSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxQaWNrSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oSW52ZW50b3J5LlBpY2tJdGVtLlR5cGUsIHRoaXMpO1xuXHRcdH1cblx0XHRcblx0XHRIYW5kbGUoY29tbWFuZCA6IFBpY2tJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLnVuTG9hZChjb21tYW5kLnF1YW50aXR5KTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBIYW5kbGVyc1xuXHR7XG5cdFx0c3RhdGljIFJlZ2lzdGVyKGJ1cyA6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdG5ldyBJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtSGFuZGxlcihidXMpO1xuXHRcdFx0bmV3IEludmVudG9yeS5EaXNhYmxlSXRlbUhhbmRsZXIoYnVzKTtcblx0XHRcdG5ldyBJbnZlbnRvcnkuTG9hZEl0ZW1IYW5kbGVyKGJ1cyk7XG5cdFx0XHRuZXcgSW52ZW50b3J5LlBpY2tJdGVtSGFuZGxlcihidXMpO1xuXHRcdH1cblx0fVx0XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRXZlbnRTdG9yZS9Db2xsZWN0aW9ucy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ludmVudG9yeS9oYW5kbGVycy50c1wiLz5cblxubW9kdWxlIFByb2dyYW0ge1xuXHRmdW5jdGlvbiBwYWRTdHJpbmdSaWdodChzdHI6IHN0cmluZywgbGVuOiBudW1iZXIpIHtcblx0XHRjb25zdCBwYWRkaW5nID0gXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiO1xuXHRcdHJldHVybiAoc3RyICsgcGFkZGluZykuc2xpY2UoMCwgbGVuKTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcGFkTnVtYmVyTGVmdCh2Om51bWJlciwgbGVuOm51bWJlcil7XG5cdFx0cmV0dXJuIHBhZFN0cmluZ0xlZnQoJycrdixsZW4pO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwYWRTdHJpbmdMZWZ0KHN0cjogc3RyaW5nLCBsZW46IG51bWJlcikge1xuXHRcdGNvbnN0IHBhZGRpbmcgPSBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI7XG5cdFx0cmV0dXJuIHBhZGRpbmcuc2xpY2UoMCwgbGVuLXN0ci5sZW5ndGgpICsgc3RyO1xuXHR9XG5cblx0aW50ZXJmYWNlIEl0ZW1SZWFkTW9kZWwge1xuXHRcdGlkOiBzdHJpbmc7XG5cdFx0ZGVzY3JpcHRpb246IHN0cmluZztcblx0XHRhY3RpdmU6IGJvb2xlYW47XG5cdFx0aW5TdG9jazogbnVtYmVyO1xuXHR9XG5cblx0Y2xhc3MgSXRlbXNMaXN0IGV4dGVuZHMgRXZlbnRTdG9yZS5Qcm9qZWN0aW9uIHtcblx0XHRhbGxJdGVtczogQ29sbGVjdGlvbnMuSURpY3Rpb25hcnk8SXRlbVJlYWRNb2RlbD4gPSBuZXcgQ29sbGVjdGlvbnMuRGljdGlvbmFyeTxJdGVtUmVhZE1vZGVsPigpO1xuXG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtQ3JlYXRlZC5UeXBlLCBlID0+IHtcblx0XHRcdFx0dGhpcy5hbGxJdGVtcy5hZGQoZS5zdHJlYW1JZCwge1xuXHRcdFx0XHRcdGlkOiBlLnNrdSxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZS5kZXNjcmlwdGlvbixcblx0XHRcdFx0XHRhY3RpdmU6IHRydWUsXG5cdFx0XHRcdFx0aW5TdG9jazogMFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtRGlzYWJsZWQuVHlwZSwgZSA9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHRcdCk7XG5cblx0XHRcdHRoaXMuT24oRXZlbnRTdG9yZS5FdmVudC5UeXBlLCBlID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2dlbmVyaWMgaGFuZGxlciBmb3IgJywgZSk7XG5cdFx0XHR9KVxuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtTG9hZGVkLlR5cGUsIGU9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgKz0gZS5xdWFudGl0eVxuXHRcdFx0XHQpO1xuXG5cdFx0XHR0aGlzLk9uKEludmVudG9yeS5JdGVtUGlja2VkLlR5cGUsIGU9PlxuXHRcdFx0XHR0aGlzLmFsbEl0ZW1zLmdldFZhbHVlKGUuc3RyZWFtSWQpLmluU3RvY2sgLT0gZS5xdWFudGl0eVxuXHRcdFx0XHQpO1xuXHRcdH1cblxuXHRcdHByaW50KCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpXG5cdFx0XHRjb25zb2xlLmxvZyhcIkl0ZW0gbGlzdFwiKTtcblx0XHRcdGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKVxuXHRcdFx0dmFyIHRleHQgPSBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG5cIjsgXG5cdFx0XHR0ZXh0ICs9IGAke3BhZFN0cmluZ1JpZ2h0KFwiSWRcIiwxMCl9IHwgJHtwYWRTdHJpbmdSaWdodChcIkRlc2NyaXB0aW9uXCIsMzIpfSB8ICR7cGFkU3RyaW5nTGVmdChcIkluIFN0b2NrXCIsIDEwKX1cXG5gO1xuXHRcdFx0dGV4dCArPSBcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cXG5cIjsgXG5cdFx0XHR0aGlzLmFsbEl0ZW1zLnZhbHVlcygpLmZvckVhY2goZSA9PiB7XG5cdFx0XHRcdHRleHQgKz0gYCR7cGFkU3RyaW5nUmlnaHQoZS5pZCwxMCl9IHwgJHtwYWRTdHJpbmdSaWdodChlLmRlc2NyaXB0aW9uLDMyKX0gfCAke3BhZE51bWJlckxlZnQoZS5pblN0b2NrLCAxMCl9XFxuYDtcblx0XHRcdH0pO1xuXHRcdFx0dGV4dCArPSBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG5cIjsgXG5cblx0XHRcdHZhciBwcmUgPSA8SFRNTFByZUVsZW1lbnQ+IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXG5cdFx0XHRwcmUuaW5uZXJUZXh0ID0gdGV4dDtcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHJlKTtcblx0XHR9XG5cdH1cblxuXHR2YXIgYnVzID0gRXZlbnRTdG9yZS5CdXMuRGVmYXVsdDtcblx0dmFyIGl0ZW1zTGlzdCA9IG5ldyBJdGVtc0xpc3QoKTtcblxuXHRmdW5jdGlvbiBjb25maWd1cmUoKSB7XG5cdFx0LyogSGFuZGxlcnMgc2V0dXAgKi9cblx0XHRJbnZlbnRvcnkuSGFuZGxlcnMuUmVnaXN0ZXIoYnVzKTtcblx0XHRidXMuc3Vic2NyaWJlKGl0ZW1zTGlzdCk7XG5cdH1cblxuXHRmdW5jdGlvbiBydW4oKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtKFwiaXRlbV8xXCIsIFwiVFNcIiwgXCJJbnRybyB0byB0eXBlc2NyaXB0XCIpKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUmVnaXN0ZXJJdGVtKFwiaXRlbV8yXCIsIFwiTkdcIiwgXCJJbnRybyB0byBhbmd1bGFyanNcIikpO1xuXHRcdFx0YnVzLnNlbmQobmV3IEludmVudG9yeS5Mb2FkSXRlbShcIml0ZW1fMVwiLCAxMDApKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuUGlja0l0ZW0oXCJpdGVtXzFcIiwgNjkpKTtcblx0XHRcdGJ1cy5zZW5kKG5ldyBJbnZlbnRvcnkuRGlzYWJsZUl0ZW0oXCJpdGVtXzFcIikpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yLm1lc3NhZ2UpO1xuXHRcdH1cblx0XHRpdGVtc0xpc3QucHJpbnQoKTtcblx0fVxuXG5cdGNvbmZpZ3VyZSgpO1xuXHRydW4oKTtcblxuXHRFdmVudFN0b3JlLlBlcnNpc3RlbmNlLmR1bXAoKTtcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
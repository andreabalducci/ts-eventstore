define(["require", "exports", "../EventStore/EventStore", "./commands", "./item"], function (require, exports, EventStore, Commands, item_1) {
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
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludmVudG9yeS9oYW5kbGVycy50cyJdLCJuYW1lcyI6WyJSZWdpc3Rlckl0ZW1IYW5kbGVyIiwiUmVnaXN0ZXJJdGVtSGFuZGxlci5jb25zdHJ1Y3RvciIsIlJlZ2lzdGVySXRlbUhhbmRsZXIuSGFuZGxlIiwiRGlzYWJsZUl0ZW1IYW5kbGVyIiwiRGlzYWJsZUl0ZW1IYW5kbGVyLmNvbnN0cnVjdG9yIiwiRGlzYWJsZUl0ZW1IYW5kbGVyLkhhbmRsZSIsIkxvYWRJdGVtSGFuZGxlciIsIkxvYWRJdGVtSGFuZGxlci5jb25zdHJ1Y3RvciIsIkxvYWRJdGVtSGFuZGxlci5IYW5kbGUiLCJQaWNrSXRlbUhhbmRsZXIiLCJQaWNrSXRlbUhhbmRsZXIuY29uc3RydWN0b3IiLCJQaWNrSXRlbUhhbmRsZXIuSGFuZGxlIiwiSGFuZGxlcnNSZWdpc3RyYXRpb24iLCJIYW5kbGVyc1JlZ2lzdHJhdGlvbi5jb25zdHJ1Y3RvciIsIkhhbmRsZXJzUmVnaXN0cmF0aW9uLlJlZ2lzdGVyIl0sIm1hcHBpbmdzIjoiO0lBSUEsY0FBYztJQUNiO1FBQ0NBLDZCQUFZQSxHQUFtQkE7WUFDOUJDLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLFFBQVFBLENBQUNBLFlBQVlBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzFDQSxDQUFDQTtRQUVERCxvQ0FBTUEsR0FBTkEsVUFBT0EsT0FBK0JBO1lBQ3JDRSxJQUFJQSxJQUFJQSxHQUFHQSxVQUFVQSxDQUFDQSxVQUFVQSxDQUFDQSxPQUFPQSxDQUFDQSxXQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNwRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsRUFBRUEsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDaERBLFVBQVVBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLE9BQU9B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QkFBbUJBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxrQkFBa0JBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzVCQSxJQUFJQSxlQUFlQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN6QkEsSUFBSUEsZUFBZUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLENBQUNBO1FBQ0ZGLDJCQUFDQTtJQUFEQSxDQVJBLEFBUUNBLElBQUE7SUFSWSw0QkFBb0IsdUJBUWhDLENBQUEiLCJmaWxlIjoiaW52ZW50b3J5L2hhbmRsZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgRXZlbnRTdG9yZSBmcm9tIFwiLi4vRXZlbnRTdG9yZS9FdmVudFN0b3JlXCJcbmltcG9ydCAqIGFzIENvbW1hbmRzIGZyb20gXCIuL2NvbW1hbmRzXCJcbmltcG9ydCB7SXRlbX0gZnJvbSBcIi4vaXRlbVwiXG5cbi8qIGhhbmRsZXJzICovXG5cdGV4cG9ydCBjbGFzcyBSZWdpc3Rlckl0ZW1IYW5kbGVyIGltcGxlbWVudHMgRXZlbnRTdG9yZS5JQ29tbWFuZEhhbmRsZXI8Q29tbWFuZHMuUmVnaXN0ZXJJdGVtPntcblx0XHRjb25zdHJ1Y3RvcihidXM6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdGJ1cy5PbihDb21tYW5kcy5SZWdpc3Rlckl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogQ29tbWFuZHMuUmVnaXN0ZXJJdGVtKXtcblx0XHRcdHZhciBpdGVtID0gRXZlbnRTdG9yZS5SZXBvc2l0b3J5LmdldEJ5SWQoSXRlbS5UeXBlLCBjb21tYW5kLml0ZW1JZCk7XG5cdFx0XHRpdGVtLnJlZ2lzdGVyKGNvbW1hbmQuc2t1LCBjb21tYW5kLmRlc2NyaXB0aW9uKTtcblx0XHRcdEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5zYXZlKGl0ZW0sIGNvbW1hbmQuY29tbWFuZElkLCBoID0+e1xuXHRcdFx0XHRoLmFkZCgndHMnLCBEYXRlKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBEaXNhYmxlSXRlbUhhbmRsZXIgaW1wbGVtZW50cyBFdmVudFN0b3JlLklDb21tYW5kSGFuZGxlcjxDb21tYW5kcy5EaXNhYmxlSXRlbT57XG5cdFx0Y29uc3RydWN0b3IoYnVzOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRidXMuT24oQ29tbWFuZHMuRGlzYWJsZUl0ZW0uVHlwZSwgdGhpcyk7XG5cdFx0fVxuXHRcdFxuXHRcdEhhbmRsZShjb21tYW5kIDogQ29tbWFuZHMuRGlzYWJsZUl0ZW0pe1xuXHRcdFx0dmFyIGl0ZW0gPSBFdmVudFN0b3JlLlJlcG9zaXRvcnkuZ2V0QnlJZChJdGVtLlR5cGUsIGNvbW1hbmQuaXRlbUlkKTtcblx0XHRcdGl0ZW0uZGlzYWJsZSgpO1xuXHRcdFx0RXZlbnRTdG9yZS5SZXBvc2l0b3J5LnNhdmUoaXRlbSwgY29tbWFuZC5jb21tYW5kSWQsIGggPT57XG5cdFx0XHRcdGguYWRkKCd0cycsIERhdGUoKSlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIExvYWRJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPENvbW1hbmRzLkxvYWRJdGVtPntcblx0XHRjb25zdHJ1Y3RvcihidXM6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdGJ1cy5PbihDb21tYW5kcy5Mb2FkSXRlbS5UeXBlLCB0aGlzKTtcblx0XHR9XG5cdFx0XG5cdFx0SGFuZGxlKGNvbW1hbmQgOiBDb21tYW5kcy5Mb2FkSXRlbSl7XG5cdFx0XHR2YXIgaXRlbSA9IEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5nZXRCeUlkKEl0ZW0uVHlwZSwgY29tbWFuZC5pdGVtSWQpO1xuXHRcdFx0aXRlbS5sb2FkKGNvbW1hbmQucXVhbnRpdHkpO1xuXHRcdFx0RXZlbnRTdG9yZS5SZXBvc2l0b3J5LnNhdmUoaXRlbSwgY29tbWFuZC5jb21tYW5kSWQpO1xuXHRcdH1cblx0fVxuXHRcblx0ZXhwb3J0IGNsYXNzIFBpY2tJdGVtSGFuZGxlciBpbXBsZW1lbnRzIEV2ZW50U3RvcmUuSUNvbW1hbmRIYW5kbGVyPENvbW1hbmRzLlBpY2tJdGVtPntcblx0XHRjb25zdHJ1Y3RvcihidXM6IEV2ZW50U3RvcmUuQnVzKXtcblx0XHRcdGJ1cy5PbihDb21tYW5kcy5QaWNrSXRlbS5UeXBlLCB0aGlzKTtcblx0XHR9XG5cdFx0XG5cdFx0SGFuZGxlKGNvbW1hbmQgOiBDb21tYW5kcy5QaWNrSXRlbSl7XG5cdFx0XHR2YXIgaXRlbSA9IEV2ZW50U3RvcmUuUmVwb3NpdG9yeS5nZXRCeUlkKEl0ZW0uVHlwZSwgY29tbWFuZC5pdGVtSWQpO1xuXHRcdFx0aXRlbS51bkxvYWQoY29tbWFuZC5xdWFudGl0eSk7XG5cdFx0XHRFdmVudFN0b3JlLlJlcG9zaXRvcnkuc2F2ZShpdGVtLCBjb21tYW5kLmNvbW1hbmRJZCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRleHBvcnQgY2xhc3MgSGFuZGxlcnNSZWdpc3RyYXRpb25cblx0e1xuXHRcdHN0YXRpYyBSZWdpc3RlcihidXMgOiBFdmVudFN0b3JlLkJ1cyl7XG5cdFx0XHRuZXcgUmVnaXN0ZXJJdGVtSGFuZGxlcihidXMpO1xuXHRcdFx0bmV3IERpc2FibGVJdGVtSGFuZGxlcihidXMpO1xuXHRcdFx0bmV3IExvYWRJdGVtSGFuZGxlcihidXMpO1xuXHRcdFx0bmV3IFBpY2tJdGVtSGFuZGxlcihidXMpO1xuXHRcdH1cblx0fVx0XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
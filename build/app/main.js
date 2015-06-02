define(["require", "exports", "./eventstore/EventStore", "./inventory/projections", "./inventory/handlers", "./inventory/commands"], function (require, exports, EventStore, Projections, handlers_1, Commands) {
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
    console.log('started');
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOlsiY29uZmlndXJlIiwicnVuIl0sIm1hcHBpbmdzIjoiO0lBTUMsSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7SUFDakMsSUFBSSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7SUFFNUM7UUFDQ0Esb0JBQW9CQTtRQUNwQkEsK0JBQW9CQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNuQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBRUQ7UUFDQ0MsSUFBSUEsQ0FBQ0E7WUFDSkEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsUUFBUUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEscUJBQXFCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzRUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsUUFBUUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsb0JBQW9CQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxRUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQzlDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBRUE7UUFBQUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaEJBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQzlCQSxDQUFDQTtRQUNEQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtJQUNuQkEsQ0FBQ0E7SUFFRCxTQUFTLEVBQUUsQ0FBQztJQUNaLEdBQUcsRUFBRSxDQUFDO0lBRU4sVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUkvQixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBDb2xsZWN0aW9ucyBmcm9tIFwiLi9ldmVudHN0b3JlL0NvbGxlY3Rpb25zXCJcbmltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4vZXZlbnRzdG9yZS9FdmVudFN0b3JlXCJcbmltcG9ydCAqIGFzIFByb2plY3Rpb25zIGZyb20gXCIuL2ludmVudG9yeS9wcm9qZWN0aW9uc1wiXG5pbXBvcnQge0hhbmRsZXJzUmVnaXN0cmF0aW9ufSBmcm9tIFwiLi9pbnZlbnRvcnkvaGFuZGxlcnNcIlxuaW1wb3J0ICogYXMgQ29tbWFuZHMgZnJvbSBcIi4vaW52ZW50b3J5L2NvbW1hbmRzXCJcblxuXHR2YXIgYnVzID0gRXZlbnRTdG9yZS5CdXMuRGVmYXVsdDtcblx0dmFyIGl0ZW1zTGlzdCA9IG5ldyBQcm9qZWN0aW9ucy5JdGVtc0xpc3QoKTtcblxuXHRmdW5jdGlvbiBjb25maWd1cmUoKSB7XG5cdFx0LyogSGFuZGxlcnMgc2V0dXAgKi9cblx0XHRIYW5kbGVyc1JlZ2lzdHJhdGlvbi5SZWdpc3RlcihidXMpO1xuXHRcdGJ1cy5zdWJzY3JpYmUoaXRlbXNMaXN0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJ1bigpIHtcblx0XHR0cnkge1xuXHRcdFx0YnVzLnNlbmQobmV3IENvbW1hbmRzLlJlZ2lzdGVySXRlbShcIml0ZW1fMVwiLCBcIlRTXCIsIFwiSW50cm8gdG8gdHlwZXNjcmlwdFwiKSk7XG5cdFx0XHRidXMuc2VuZChuZXcgQ29tbWFuZHMuUmVnaXN0ZXJJdGVtKFwiaXRlbV8yXCIsIFwiTkdcIiwgXCJJbnRybyB0byBhbmd1bGFyanNcIikpO1xuXHRcdFx0YnVzLnNlbmQobmV3IENvbW1hbmRzLkxvYWRJdGVtKFwiaXRlbV8xXCIsIDEwMCkpO1xuXHRcdFx0YnVzLnNlbmQobmV3IENvbW1hbmRzLlBpY2tJdGVtKFwiaXRlbV8xXCIsIDY5KSk7XG5cdFx0XHRidXMuc2VuZChuZXcgQ29tbWFuZHMuRGlzYWJsZUl0ZW0oXCJpdGVtXzFcIikpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yLm1lc3NhZ2UpO1xuXHRcdH1cblx0XHRpdGVtc0xpc3QucHJpbnQoKTtcblx0fVxuXG5cdGNvbmZpZ3VyZSgpO1xuXHRydW4oKTtcblxuXHRFdmVudFN0b3JlLlBlcnNpc3RlbmNlLmR1bXAoKTtcblxuXG5cbmNvbnNvbGUubG9nKCdzdGFydGVkJyk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
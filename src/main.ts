import * as Collections from "./eventstore/Collections"
import * as EventStore from "./eventstore/EventStore"
import * as Projections from "./Inventory/projections"
import {HandlersRegistration} from "./Inventory/handlers"
import * as Commands from "./Inventory/commands"

	var bus = EventStore.Bus.Default;
	var itemsList = new Projections.ItemsList();

	function configure() {
		/* Handlers setup */
		HandlersRegistration.Register(bus);
		bus.subscribe(itemsList);
	}

	function run() {
		try {
			bus.send(new Commands.RegisterItem("item_1", "TS", "Intro to typescript"));
			bus.send(new Commands.RegisterItem("item_2", "NG", "Intro to angularjs"));
			bus.send(new Commands.LoadItem("item_1", 100));
			bus.send(new Commands.PickItem("item_1", 69));
			bus.send(new Commands.DisableItem("item_1"));
		} catch (error) {
			console.error(error.message);
		}
		itemsList.print();
	}

	configure();
	run();

	EventStore.Persistence.dump();



console.log('started');

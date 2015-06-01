/// <reference path="./EventStore/Collections.ts"/>
/// <reference path="./Inventory/handlers.ts"/>
/// <reference path="./Inventory/projections.ts"/>

module Program {


	var bus = EventStore.Bus.Default;
	var itemsList = new Inventory.ItemsList();

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
		} catch (error) {
			console.error(error.message);
		}
		itemsList.print();
	}

	configure();
	run();

	EventStore.Persistence.dump();
}
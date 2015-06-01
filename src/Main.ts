/// <reference path="./EventStore/Collections.ts"/>
/// <reference path="./Inventory/handlers.ts"/>

module Program {
	function padStringRight(str: string, len: number) {
		const padding = "                             ";
		return (str + padding).slice(0, len);
	}
	
	function padNumberLeft(v:number, len:number){
		return padStringLeft(''+v,len);
	}
	
	function padStringLeft(str: string, len: number) {
		const padding = "                             ";
		return padding.slice(0, len-str.length) + str;
	}

	interface ItemReadModel {
		id: string;
		description: string;
		active: boolean;
		inStock: number;
	}

	class ItemsList extends EventStore.Projection {
		allItems: Collections.IDictionary<ItemReadModel> = new Collections.Dictionary<ItemReadModel>();

		constructor() {
			super();

			this.On(Inventory.ItemCreated.Type, e => {
				this.allItems.add(e.streamId, {
					id: e.sku,
					description: e.description,
					active: true,
					inStock: 0
				});
			});

			this.On(Inventory.ItemDisabled.Type, e =>
				this.allItems.getValue(e.streamId).active = false
				);

			this.On(EventStore.Event.Type, e => {
				console.log('generic handler for ', e);
			})

			this.On(Inventory.ItemLoaded.Type, e=>
				this.allItems.getValue(e.streamId).inStock += e.quantity
				);

			this.On(Inventory.ItemPicked.Type, e=>
				this.allItems.getValue(e.streamId).inStock -= e.quantity
				);
		}

		print() {
			console.log("----------------------------")
			console.log("Item list");
			console.log("----------------------------")
			var text = "==========================================================\n"; 
			text += `${padStringRight("Id",10)} | ${padStringRight("Description",32)} | ${padStringLeft("In Stock", 10)}\n`;
			text += "----------------------------------------------------------\n"; 
			this.allItems.values().forEach(e => {
				text += `${padStringRight(e.id,10)} | ${padStringRight(e.description,32)} | ${padNumberLeft(e.inStock, 10)}\n`;
			});
			text += "==========================================================\n"; 

			var pre = <HTMLPreElement> document.createElement('pre');

			pre.innerText = text;
			document.body.appendChild(pre);
		}
	}

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
		} catch (error) {
			console.error(error.message);
		}
		itemsList.print();
	}

	configure();
	run();

	EventStore.Persistence.dump();
}
import * as Collections from "../EventStore/Collections"
import * as EventStore from "../EventStore/EventStore"
import * as Events from "events"

function padStringRight(str: string, len: number) {
	const padding = "                             ";
	return (str + padding).slice(0, len);
}

function padNumberLeft(v: number, len: number) {
	return padStringLeft('' + v, len);
}

function padStringLeft(str: string, len: number) {
	const padding = "                             ";
	return padding.slice(0, len - str.length) + str;
}

interface ItemReadModel {
	id: string;
	description: string;
	active: boolean;
	inStock: number;
}

export class ItemsList extends EventStore.Projection {
	private allItems: Collections.IDictionary<ItemReadModel> = new Collections.Dictionary<ItemReadModel>();

	constructor() {
		super();

		this.On(Events.ItemCreated.Type, e => {
			this.allItems.add(e.streamId, {
				id: e.sku,
				description: e.description,
				active: true,
				inStock: 0
			});
		});

		this.On(Events.ItemDisabled.Type, e =>
			this.allItems.getValue(e.streamId).active = false
			);

		this.On(EventStore.Event.Type, e => {
			console.log('generic handler for ', e);
		})

		this.On(Events.ItemLoaded.Type, e=>
			this.allItems.getValue(e.streamId).inStock += e.quantity
			);

		this.On(Events.ItemPicked.Type, e=>
			this.allItems.getValue(e.streamId).inStock -= e.quantity
			);
	}

	print() {
		console.log("----------------------------")
		console.log("Item list");
		console.log("----------------------------")
		var text = "==========================================================\n";
		text += `${padStringRight("Id", 10) } | ${padStringRight("Description", 32) } | ${padStringLeft("In Stock", 10) }\n`;
		text += "----------------------------------------------------------\n";
		this.allItems.values().forEach(e => {
			text += `${padStringRight(e.id, 10) } | ${padStringRight(e.description, 32) } | ${padNumberLeft(e.inStock, 10) }\n`;
		});
		text += "==========================================================\n";

		var pre = <HTMLPreElement> document.createElement('pre');

		pre.innerText = text;
		document.body.appendChild(pre);
	}
}

import * as EventStore from "../EventStore/EventStore"


	/* events */
	export class ItemCreated extends EventStore.Event {
		static Type: ItemCreated = new ItemCreated(null, null);
		constructor(public sku: string, public description: string) {
			super();
		}
	}

	export class ItemDisabled extends EventStore.Event {
		static Type: ItemDisabled = new ItemDisabled();
		constructor() {
			super();
		}
	}

	export class ItemLoaded extends EventStore.Event {
		static Type: ItemLoaded = new ItemLoaded(0);
		constructor(public quantity: number) {
			super();
		}
	}


	export class ItemPicked extends EventStore.Event {
		static Type: ItemPicked = new ItemPicked(0);
		constructor(public quantity: number) {
			super();
		}
	}
	export class ItemPickingFailed extends EventStore.Event {
		static Type: ItemPickingFailed = new ItemPickingFailed(0, 0);
		constructor(public requested: number, public inStock: number) {
			super();
		}
	}

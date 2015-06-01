/// <reference path="../EventStore/EventStore.ts"/>
/// <reference path="events.ts"/>
module Inventory {
	/* state & aggregate */

	export class ItemState extends EventStore.AggregateState  {
		private disabled: boolean = false;
		private inStock: number = 0;
		private sku:string = null;
		
		constructor() {
			super();
			this.On(ItemDisabled.Type, e=> this.disabled = true);
			this.On(ItemLoaded.Type, e=> this.inStock += e.quantity);
			this.On(ItemPicked.Type, e=> this.inStock -= e.quantity);
			this.On(ItemCreated.Type, e => this.sku = e.sku);
			
			this.addCheck({name:"Item must have a SKU", rule : ()=>
				this.sku != null
			});
									
			this.addCheck({name:"Item in stock must not be disabled", rule : ()=>
				this.stockLevel() == 0 || (this.stockLevel() > 0 && !this.hasBeenDisabled())
			});
		}

		hasBeenDisabled(): boolean { return this.disabled };
		stockLevel(): number { return this.inStock; }
	}

	
	/* AGGREGATE */
	
	export class Item extends EventStore.Aggregate<ItemState> implements EventStore.IAggregateFactory {
		static Type: Item = new Item(null);
		constructor(id: string) {
			super(id, new ItemState())
		}

		register(id: string, description: string) {
			this.RaiseEvent(new ItemCreated(id, description));
		}

		disable() {
			if (!this.State.hasBeenDisabled()) {
				this.RaiseEvent(new ItemDisabled());
			}
		}

		load(quantity: number): void {
			Error()
			this.RaiseEvent(new ItemLoaded(quantity))
		}

		unLoad(quantity: number): void {
			var currentStock = this.State.stockLevel();
			if (currentStock >= quantity) {
				this.RaiseEvent(new ItemPicked(quantity))
			} else {
				this.RaiseEvent(new ItemPickingFailed(quantity, currentStock));
			}
		}
		
		Factory(id:string){
			return new Item(id);
		}
	}
}
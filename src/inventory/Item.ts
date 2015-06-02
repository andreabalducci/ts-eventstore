import * as EventStore from "../EventStore/EventStore"
import * as Events from "./events"

	/* state & aggregate */

	export class ItemState extends EventStore.AggregateState  {
		private disabled: boolean = false;
		private inStock: number = 0;
		private sku:string = null;
		
		constructor() {
			super();
			this.On(Events.ItemDisabled.Type, e=> this.disabled = true);
			this.On(Events.ItemLoaded.Type, e=> this.inStock += e.quantity);
			this.On(Events.ItemPicked.Type, e=> this.inStock -= e.quantity);
			this.On(Events.ItemCreated.Type, e => this.sku = e.sku);
			
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
			this.RaiseEvent(new Events.ItemCreated(id, description));
		}

		disable() {
			if (!this.State.hasBeenDisabled()) {
				this.RaiseEvent(new Events.ItemDisabled());
			}
		}

		load(quantity: number): void {
			Error()
			this.RaiseEvent(new Events.ItemLoaded(quantity))
		}

		unLoad(quantity: number): void {
			var currentStock = this.State.stockLevel();
			if (currentStock >= quantity) {
				this.RaiseEvent(new Events.ItemPicked(quantity))
			} else {
				this.RaiseEvent(new Events.ItemPickingFailed(quantity, currentStock));
			}
		}
		
		Factory(id:string){
			return new Item(id);
		}
	}

/// <reference path="../EventStore/EventStore.ts"/>
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

	/* Commands */
	export class RegisterItem extends EventStore.Command{
		static Type: RegisterItem = new RegisterItem(null,null,null);
		__registerItem = null;
		constructor(public itemId:string, public sku:string, public description:string){
			super();
		}
	}
	
	export class DisableItem extends EventStore.Command{
		static Type: DisableItem = new DisableItem(null);
		__disableItem = null;
		constructor(public itemId:string){
			super();
		}
	}
	
	export class LoadItem extends EventStore.Command{
		static Type: LoadItem = new LoadItem(null,0);
		__loadItem = null;
		constructor(public itemId:string, public quantity: number){
			super();
		}
	}
	
	export class PickItem extends EventStore.Command{
		static Type: PickItem = new PickItem(null,0);
		__loadItem = null;
		constructor(public itemId:string, public quantity: number){
			super();
		}
	}
	
	/* handlers */
	export class RegisterItemHandler implements EventStore.ICommandHandler<RegisterItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Inventory.RegisterItem.Type, this);
		}
		
		Handle(command : RegisterItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.register(command.sku, command.description);
			EventStore.Repository.save(item, command.commandId, h =>{
				h.add('ts', Date())
			});
		}
	}
	
	export class DisableItemHandler implements EventStore.ICommandHandler<DisableItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Inventory.DisableItem.Type, this);
		}
		
		Handle(command : DisableItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.disable();
			EventStore.Repository.save(item, command.commandId, h =>{
				h.add('ts', Date())
			});
		}
	}
	
	export class LoadItemHandler implements EventStore.ICommandHandler<LoadItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Inventory.LoadItem.Type, this);
		}
		
		Handle(command : LoadItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.load(command.quantity);
			EventStore.Repository.save(item, command.commandId);
		}
	}
	
	export class PickItemHandler implements EventStore.ICommandHandler<PickItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Inventory.PickItem.Type, this);
		}
		
		Handle(command : PickItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.unLoad(command.quantity);
			EventStore.Repository.save(item, command.commandId);
		}
	}
	
	export class Handlers
	{
		static Register(bus : EventStore.Bus){
			new Inventory.RegisterItemHandler(bus);
			new Inventory.DisableItemHandler(bus);
			new Inventory.LoadItemHandler(bus);
			new Inventory.PickItemHandler(bus);
		}
	}
	
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
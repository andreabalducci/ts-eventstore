/// <reference path="../EventStore/EventStore.ts"/>
/// <reference path="commands.ts"/>
/// <reference path="item.ts"/>

module Inventory {
	
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
}
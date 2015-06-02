import * as EventStore from "../EventStore/EventStore"
import * as Commands from "commands"
import {Item} from "item"

/* handlers */
	export class RegisterItemHandler implements EventStore.ICommandHandler<Commands.RegisterItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Commands.RegisterItem.Type, this);
		}
		
		Handle(command : Commands.RegisterItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.register(command.sku, command.description);
			EventStore.Repository.save(item, command.commandId, h =>{
				h.add('ts', Date())
			});
		}
	}
	
	export class DisableItemHandler implements EventStore.ICommandHandler<Commands.DisableItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Commands.DisableItem.Type, this);
		}
		
		Handle(command : Commands.DisableItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.disable();
			EventStore.Repository.save(item, command.commandId, h =>{
				h.add('ts', Date())
			});
		}
	}
	
	export class LoadItemHandler implements EventStore.ICommandHandler<Commands.LoadItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Commands.LoadItem.Type, this);
		}
		
		Handle(command : Commands.LoadItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.load(command.quantity);
			EventStore.Repository.save(item, command.commandId);
		}
	}
	
	export class PickItemHandler implements EventStore.ICommandHandler<Commands.PickItem>{
		constructor(bus: EventStore.Bus){
			bus.On(Commands.PickItem.Type, this);
		}
		
		Handle(command : Commands.PickItem){
			var item = EventStore.Repository.getById(Item.Type, command.itemId);
			item.unLoad(command.quantity);
			EventStore.Repository.save(item, command.commandId);
		}
	}
	
	export class HandlersRegistration
	{
		static Register(bus : EventStore.Bus){
			new RegisterItemHandler(bus);
			new DisableItemHandler(bus);
			new LoadItemHandler(bus);
			new PickItemHandler(bus);
		}
	}	

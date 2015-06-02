import * as EventStore from "../eventstore/EventStore"

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

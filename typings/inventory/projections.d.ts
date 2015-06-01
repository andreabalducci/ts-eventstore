/// <reference path="events.d.ts" />
declare module Inventory {
    class ItemsList extends EventStore.Projection {
        private allItems;
        constructor();
        print(): void;
    }
}

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../eventstore/EventStore", "./events"], function (require, exports, EventStore, Events) {
    /* state & aggregate */
    var ItemState = (function (_super) {
        __extends(ItemState, _super);
        function ItemState() {
            var _this = this;
            _super.call(this);
            this.disabled = false;
            this.inStock = 0;
            this.sku = null;
            this.On(Events.ItemDisabled.Type, function (e) { return _this.disabled = true; });
            this.On(Events.ItemLoaded.Type, function (e) { return _this.inStock += e.quantity; });
            this.On(Events.ItemPicked.Type, function (e) { return _this.inStock -= e.quantity; });
            this.On(Events.ItemCreated.Type, function (e) { return _this.sku = e.sku; });
            this.addCheck({ name: "Item must have a SKU", rule: function () {
                    return _this.sku != null;
                }
            });
            this.addCheck({ name: "Item in stock must not be disabled", rule: function () {
                    return _this.stockLevel() == 0 || (_this.stockLevel() > 0 && !_this.hasBeenDisabled());
                }
            });
        }
        ItemState.prototype.hasBeenDisabled = function () { return this.disabled; };
        ;
        ItemState.prototype.stockLevel = function () { return this.inStock; };
        return ItemState;
    })(EventStore.AggregateState);
    exports.ItemState = ItemState;
    /* AGGREGATE */
    var Item = (function (_super) {
        __extends(Item, _super);
        function Item(id) {
            _super.call(this, id, new ItemState());
        }
        Item.prototype.register = function (id, description) {
            this.RaiseEvent(new Events.ItemCreated(id, description));
        };
        Item.prototype.disable = function () {
            if (!this.State.hasBeenDisabled()) {
                this.RaiseEvent(new Events.ItemDisabled());
            }
        };
        Item.prototype.load = function (quantity) {
            Error();
            this.RaiseEvent(new Events.ItemLoaded(quantity));
        };
        Item.prototype.unLoad = function (quantity) {
            var currentStock = this.State.stockLevel();
            if (currentStock >= quantity) {
                this.RaiseEvent(new Events.ItemPicked(quantity));
            }
            else {
                this.RaiseEvent(new Events.ItemPickingFailed(quantity, currentStock));
            }
        };
        Item.prototype.Factory = function (id) {
            return new Item(id);
        };
        Item.Type = new Item(null);
        return Item;
    })(EventStore.Aggregate);
    exports.Item = Item;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludmVudG9yeS9pdGVtLnRzIl0sIm5hbWVzIjpbIkl0ZW1TdGF0ZSIsIkl0ZW1TdGF0ZS5jb25zdHJ1Y3RvciIsIkl0ZW1TdGF0ZS5oYXNCZWVuRGlzYWJsZWQiLCJJdGVtU3RhdGUuc3RvY2tMZXZlbCIsIkl0ZW0iLCJJdGVtLmNvbnN0cnVjdG9yIiwiSXRlbS5yZWdpc3RlciIsIkl0ZW0uZGlzYWJsZSIsIkl0ZW0ubG9hZCIsIkl0ZW0udW5Mb2FkIiwiSXRlbS5GYWN0b3J5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0lBR0MsdUJBQXVCO0lBRXZCO1FBQStCQSw2QkFBeUJBO1FBS3ZEQTtZQUxEQyxpQkF1QkNBO1lBakJDQSxpQkFBT0EsQ0FBQ0E7WUFMREEsYUFBUUEsR0FBWUEsS0FBS0EsQ0FBQ0E7WUFDMUJBLFlBQU9BLEdBQVdBLENBQUNBLENBQUNBO1lBQ3BCQSxRQUFHQSxHQUFVQSxJQUFJQSxDQUFDQTtZQUl6QkEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQUEsQ0FBQ0EsSUFBR0EsT0FBQUEsS0FBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsRUFBcEJBLENBQW9CQSxDQUFDQSxDQUFDQTtZQUM1REEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQUEsQ0FBQ0EsSUFBR0EsT0FBQUEsS0FBSUEsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFBMUJBLENBQTBCQSxDQUFDQSxDQUFDQTtZQUNoRUEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQUEsQ0FBQ0EsSUFBR0EsT0FBQUEsS0FBSUEsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFBMUJBLENBQTBCQSxDQUFDQSxDQUFDQTtZQUNoRUEsSUFB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RUEsQ0FBQ0E7UUFDRkEsQ0FBQ0E7UUFFREwsc0JBQU9BLEdBQVBBLFVBQVFBLEVBQVNBO1lBQ2hCTSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7UUEvQk1OLFNBQUlBLEdBQVNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBZ0NwQ0EsV0FBQ0E7SUFBREEsQ0FqQ0EsQUFpQ0NBLEVBakN5QixVQUFVLENBQUMsU0FBUyxFQWlDN0M7SUFqQ1ksWUFBSSxPQWlDaEIsQ0FBQSIsImZpbGUiOiJpbnZlbnRvcnkvaXRlbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4uL2V2ZW50c3RvcmUvRXZlbnRTdG9yZVwiXG5pbXBvcnQgKiBhcyBFdmVudHMgZnJvbSBcIi4vZXZlbnRzXCJcblxuXHQvKiBzdGF0ZSAmIGFnZ3JlZ2F0ZSAqL1xuXG5cdGV4cG9ydCBjbGFzcyBJdGVtU3RhdGUgZXh0ZW5kcyBFdmVudFN0b3JlLkFnZ3JlZ2F0ZVN0YXRlICB7XG5cdFx0cHJpdmF0ZSBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXHRcdHByaXZhdGUgaW5TdG9jazogbnVtYmVyID0gMDtcblx0XHRwcml2YXRlIHNrdTpzdHJpbmcgPSBudWxsO1xuXHRcdFxuXHRcdGNvbnN0cnVjdG9yKCkge1xuXHRcdFx0c3VwZXIoKTtcblx0XHRcdHRoaXMuT24oRXZlbnRzLkl0ZW1EaXNhYmxlZC5UeXBlLCBlPT4gdGhpcy5kaXNhYmxlZCA9IHRydWUpO1xuXHRcdFx0dGhpcy5PbihFdmVudHMuSXRlbUxvYWRlZC5UeXBlLCBlPT4gdGhpcy5pblN0b2NrICs9IGUucXVhbnRpdHkpO1xuXHRcdFx0dGhpcy5PbihFdmVudHMuSXRlbVBpY2tlZC5UeXBlLCBlPT4gdGhpcy5pblN0b2NrIC09IGUucXVhbnRpdHkpO1xuXHRcdFx0dGhpcy5PbihFdmVudHMuSXRlbUNyZWF0ZWQuVHlwZSwgZSA9PiB0aGlzLnNrdSA9IGUuc2t1KTtcblx0XHRcdFxuXHRcdFx0dGhpcy5hZGRDaGVjayh7bmFtZTpcIkl0ZW0gbXVzdCBoYXZlIGEgU0tVXCIsIHJ1bGUgOiAoKT0+XG5cdFx0XHRcdHRoaXMuc2t1ICE9IG51bGxcblx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHR0aGlzLmFkZENoZWNrKHtuYW1lOlwiSXRlbSBpbiBzdG9jayBtdXN0IG5vdCBiZSBkaXNhYmxlZFwiLCBydWxlIDogKCk9PlxuXHRcdFx0XHR0aGlzLnN0b2NrTGV2ZWwoKSA9PSAwIHx8ICh0aGlzLnN0b2NrTGV2ZWwoKSA+IDAgJiYgIXRoaXMuaGFzQmVlbkRpc2FibGVkKCkpXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRoYXNCZWVuRGlzYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmRpc2FibGVkIH07XG5cdFx0c3RvY2tMZXZlbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pblN0b2NrOyB9XG5cdH1cblxuXHRcblx0LyogQUdHUkVHQVRFICovXG5cdFxuXHRleHBvcnQgY2xhc3MgSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQWdncmVnYXRlPEl0ZW1TdGF0ZT4gaW1wbGVtZW50cyBFdmVudFN0b3JlLklBZ2dyZWdhdGVGYWN0b3J5IHtcblx0XHRzdGF0aWMgVHlwZTogSXRlbSA9IG5ldyBJdGVtKG51bGwpO1xuXHRcdGNvbnN0cnVjdG9yKGlkOiBzdHJpbmcpIHtcblx0XHRcdHN1cGVyKGlkLCBuZXcgSXRlbVN0YXRlKCkpXG5cdFx0fVxuXG5cdFx0cmVnaXN0ZXIoaWQ6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xuXHRcdFx0dGhpcy5SYWlzZUV2ZW50KG5ldyBFdmVudHMuSXRlbUNyZWF0ZWQoaWQsIGRlc2NyaXB0aW9uKSk7XG5cdFx0fVxuXG5cdFx0ZGlzYWJsZSgpIHtcblx0XHRcdGlmICghdGhpcy5TdGF0ZS5oYXNCZWVuRGlzYWJsZWQoKSkge1xuXHRcdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEV2ZW50cy5JdGVtRGlzYWJsZWQoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bG9hZChxdWFudGl0eTogbnVtYmVyKTogdm9pZCB7XG5cdFx0XHRFcnJvcigpXG5cdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEV2ZW50cy5JdGVtTG9hZGVkKHF1YW50aXR5KSlcblx0XHR9XG5cblx0XHR1bkxvYWQocXVhbnRpdHk6IG51bWJlcik6IHZvaWQge1xuXHRcdFx0dmFyIGN1cnJlbnRTdG9jayA9IHRoaXMuU3RhdGUuc3RvY2tMZXZlbCgpO1xuXHRcdFx0aWYgKGN1cnJlbnRTdG9jayA+PSBxdWFudGl0eSkge1xuXHRcdFx0XHR0aGlzLlJhaXNlRXZlbnQobmV3IEV2ZW50cy5JdGVtUGlja2VkKHF1YW50aXR5KSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuUmFpc2VFdmVudChuZXcgRXZlbnRzLkl0ZW1QaWNraW5nRmFpbGVkKHF1YW50aXR5LCBjdXJyZW50U3RvY2spKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0RmFjdG9yeShpZDpzdHJpbmcpe1xuXHRcdFx0cmV0dXJuIG5ldyBJdGVtKGlkKTtcblx0XHR9XG5cdH1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
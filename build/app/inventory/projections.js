var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../eventstore/Collections", "../eventstore/EventStore", "./events"], function (require, exports, Collections, EventStore, Events) {
    function padStringRight(str, len) {
        var padding = "                             ";
        return (str + padding).slice(0, len);
    }
    function padNumberLeft(v, len) {
        return padStringLeft('' + v, len);
    }
    function padStringLeft(str, len) {
        var padding = "                             ";
        return padding.slice(0, len - str.length) + str;
    }
    var ItemsList = (function (_super) {
        __extends(ItemsList, _super);
        function ItemsList() {
            var _this = this;
            _super.call(this);
            this.allItems = new Collections.Dictionary();
            this.On(Events.ItemCreated.Type, function (e) {
                _this.allItems.add(e.streamId, {
                    id: e.sku,
                    description: e.description,
                    active: true,
                    inStock: 0
                });
            });
            this.On(Events.ItemDisabled.Type, function (e) {
                return _this.allItems.getValue(e.streamId).active = false;
            });
            this.On(EventStore.Event.Type, function (e) {
                console.log('generic handler for ', e);
            });
            this.On(Events.ItemLoaded.Type, function (e) {
                return _this.allItems.getValue(e.streamId).inStock += e.quantity;
            });
            this.On(Events.ItemPicked.Type, function (e) {
                return _this.allItems.getValue(e.streamId).inStock -= e.quantity;
            });
        }
        ItemsList.prototype.print = function () {
            console.log("----------------------------");
            console.log("Item list");
            console.log("----------------------------");
            var text = "==========================================================\n";
            text += padStringRight("Id", 10) + " | " + padStringRight("Description", 32) + " | " + padStringLeft("In Stock", 10) + "\n";
            text += "----------------------------------------------------------\n";
            this.allItems.values().forEach(function (e) {
                text += padStringRight(e.id, 10) + " | " + padStringRight(e.description, 32) + " | " + padNumberLeft(e.inStock, 10) + "\n";
            });
            text += "==========================================================\n";
            var pre = document.createElement('pre');
            pre.innerText = text;
            document.body.appendChild(pre);
        };
        return ItemsList;
    })(EventStore.Projection);
    exports.ItemsList = ItemsList;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludmVudG9yeS9wcm9qZWN0aW9ucy50cyJdLCJuYW1lcyI6WyJwYWRTdHJpbmdSaWdodCIsInBhZE51bWJlckxlZnQiLCJwYWRTdHJpbmdMZWZ0IiwiSXRlbXNMaXN0IiwiSXRlbXNMaXN0LmNvbnN0cnVjdG9yIiwiSXRlbXNMaXN0LnByaW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0lBSUEsd0JBQXdCLEdBQVcsRUFBRSxHQUFXO1FBQy9DQSxJQUFNQSxPQUFPQSxHQUFHQSwrQkFBK0JBLENBQUNBO1FBQ2hEQSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxPQUFPQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUN0Q0EsQ0FBQ0E7SUFFRCx1QkFBdUIsQ0FBUyxFQUFFLEdBQVc7UUFDNUNDLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO0lBQ25DQSxDQUFDQTtJQUVELHVCQUF1QixHQUFXLEVBQUUsR0FBVztRQUM5Q0MsSUFBTUEsT0FBT0EsR0FBR0EsK0JBQStCQSxDQUFDQTtRQUNoREEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7SUFDakRBLENBQUNBO0lBU0Q7UUFBK0JDLDZCQUFxQkE7UUFHbkRBO1lBSERDLGlCQWlEQ0E7WUE3Q0NBLGlCQUFPQSxDQUFDQTtZQUhEQSxhQUFRQSxHQUEyQ0EsSUFBSUEsV0FBV0EsQ0FBQ0EsVUFBVUEsRUFBaUJBLENBQUNBO1lBS3RHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFBQSxDQUFDQTtnQkFDakNBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNB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SUEsQ0FBQ0E7WUFDckJBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxDQUFDQTtRQUNGRixnQkFBQ0E7SUFBREEsQ0FqREEsQUFpRENBLEVBakQ4QixVQUFVLENBQUMsVUFBVSxFQWlEbkQ7SUFqRFksaUJBQVMsWUFpRHJCLENBQUEiLCJmaWxlIjoiaW52ZW50b3J5L3Byb2plY3Rpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQ29sbGVjdGlvbnMgZnJvbSBcIi4uL2V2ZW50c3RvcmUvQ29sbGVjdGlvbnNcIlxuaW1wb3J0ICogYXMgRXZlbnRTdG9yZSBmcm9tIFwiLi4vZXZlbnRzdG9yZS9FdmVudFN0b3JlXCJcbmltcG9ydCAqIGFzIEV2ZW50cyBmcm9tIFwiLi9ldmVudHNcIlxuXG5mdW5jdGlvbiBwYWRTdHJpbmdSaWdodChzdHI6IHN0cmluZywgbGVuOiBudW1iZXIpIHtcblx0Y29uc3QgcGFkZGluZyA9IFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjtcblx0cmV0dXJuIChzdHIgKyBwYWRkaW5nKS5zbGljZSgwLCBsZW4pO1xufVxuXG5mdW5jdGlvbiBwYWROdW1iZXJMZWZ0KHY6IG51bWJlciwgbGVuOiBudW1iZXIpIHtcblx0cmV0dXJuIHBhZFN0cmluZ0xlZnQoJycgKyB2LCBsZW4pO1xufVxuXG5mdW5jdGlvbiBwYWRTdHJpbmdMZWZ0KHN0cjogc3RyaW5nLCBsZW46IG51bWJlcikge1xuXHRjb25zdCBwYWRkaW5nID0gXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiO1xuXHRyZXR1cm4gcGFkZGluZy5zbGljZSgwLCBsZW4gLSBzdHIubGVuZ3RoKSArIHN0cjtcbn1cblxuaW50ZXJmYWNlIEl0ZW1SZWFkTW9kZWwge1xuXHRpZDogc3RyaW5nO1xuXHRkZXNjcmlwdGlvbjogc3RyaW5nO1xuXHRhY3RpdmU6IGJvb2xlYW47XG5cdGluU3RvY2s6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEl0ZW1zTGlzdCBleHRlbmRzIEV2ZW50U3RvcmUuUHJvamVjdGlvbiB7XG5cdHByaXZhdGUgYWxsSXRlbXM6IENvbGxlY3Rpb25zLklEaWN0aW9uYXJ5PEl0ZW1SZWFkTW9kZWw+ID0gbmV3IENvbGxlY3Rpb25zLkRpY3Rpb25hcnk8SXRlbVJlYWRNb2RlbD4oKTtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5PbihFdmVudHMuSXRlbUNyZWF0ZWQuVHlwZSwgZSA9PiB7XG5cdFx0XHR0aGlzLmFsbEl0ZW1zLmFkZChlLnN0cmVhbUlkLCB7XG5cdFx0XHRcdGlkOiBlLnNrdSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGUuZGVzY3JpcHRpb24sXG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRcdFx0aW5TdG9jazogMFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLk9uKEV2ZW50cy5JdGVtRGlzYWJsZWQuVHlwZSwgZSA9PlxuXHRcdFx0dGhpcy5hbGxJdGVtcy5nZXRWYWx1ZShlLnN0cmVhbUlkKS5hY3RpdmUgPSBmYWxzZVxuXHRcdFx0KTtcblxuXHRcdHRoaXMuT24oRXZlbnRTdG9yZS5FdmVudC5UeXBlLCBlID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdnZW5lcmljIGhhbmRsZXIgZm9yICcsIGUpO1xuXHRcdH0pXG5cblx0XHR0aGlzLk9uKEV2ZW50cy5JdGVtTG9hZGVkLlR5cGUsIGU9PlxuXHRcdFx0dGhpcy5hbGxJdGVtcy5nZXRWYWx1ZShlLnN0cmVhbUlkKS5pblN0b2NrICs9IGUucXVhbnRpdHlcblx0XHRcdCk7XG5cblx0XHR0aGlzLk9uKEV2ZW50cy5JdGVtUGlja2VkLlR5cGUsIGU9PlxuXHRcdFx0dGhpcy5hbGxJdGVtcy5nZXRWYWx1ZShlLnN0cmVhbUlkKS5pblN0b2NrIC09IGUucXVhbnRpdHlcblx0XHRcdCk7XG5cdH1cblxuXHRwcmludCgpIHtcblx0XHRjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIilcblx0XHRjb25zb2xlLmxvZyhcIkl0ZW0gbGlzdFwiKTtcblx0XHRjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIilcblx0XHR2YXIgdGV4dCA9IFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxcblwiO1xuXHRcdHRleHQgKz0gYCR7cGFkU3RyaW5nUmlnaHQoXCJJZFwiLCAxMCkgfSB8ICR7cGFkU3RyaW5nUmlnaHQoXCJEZXNjcmlwdGlvblwiLCAzMikgfSB8ICR7cGFkU3RyaW5nTGVmdChcIkluIFN0b2NrXCIsIDEwKSB9XFxuYDtcblx0XHR0ZXh0ICs9IFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcblwiO1xuXHRcdHRoaXMuYWxsSXRlbXMudmFsdWVzKCkuZm9yRWFjaChlID0+IHtcblx0XHRcdHRleHQgKz0gYCR7cGFkU3RyaW5nUmlnaHQoZS5pZCwgMTApIH0gfCAke3BhZFN0cmluZ1JpZ2h0KGUuZGVzY3JpcHRpb24sIDMyKSB9IHwgJHtwYWROdW1iZXJMZWZ0KGUuaW5TdG9jaywgMTApIH1cXG5gO1xuXHRcdH0pO1xuXHRcdHRleHQgKz0gXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuXCI7XG5cblx0XHR2YXIgcHJlID0gPEhUTUxQcmVFbGVtZW50PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcblxuXHRcdHByZS5pbm5lclRleHQgPSB0ZXh0O1xuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHJlKTtcblx0fVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
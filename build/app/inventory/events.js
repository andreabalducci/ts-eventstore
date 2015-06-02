var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../eventstore/EventStore"], function (require, exports, EventStore) {
    /* events */
    var ItemCreated = (function (_super) {
        __extends(ItemCreated, _super);
        function ItemCreated(sku, description) {
            _super.call(this);
            this.sku = sku;
            this.description = description;
        }
        ItemCreated.Type = new ItemCreated(null, null);
        return ItemCreated;
    })(EventStore.Event);
    exports.ItemCreated = ItemCreated;
    var ItemDisabled = (function (_super) {
        __extends(ItemDisabled, _super);
        function ItemDisabled() {
            _super.call(this);
        }
        ItemDisabled.Type = new ItemDisabled();
        return ItemDisabled;
    })(EventStore.Event);
    exports.ItemDisabled = ItemDisabled;
    var ItemLoaded = (function (_super) {
        __extends(ItemLoaded, _super);
        function ItemLoaded(quantity) {
            _super.call(this);
            this.quantity = quantity;
        }
        ItemLoaded.Type = new ItemLoaded(0);
        return ItemLoaded;
    })(EventStore.Event);
    exports.ItemLoaded = ItemLoaded;
    var ItemPicked = (function (_super) {
        __extends(ItemPicked, _super);
        function ItemPicked(quantity) {
            _super.call(this);
            this.quantity = quantity;
        }
        ItemPicked.Type = new ItemPicked(0);
        return ItemPicked;
    })(EventStore.Event);
    exports.ItemPicked = ItemPicked;
    var ItemPickingFailed = (function (_super) {
        __extends(ItemPickingFailed, _super);
        function ItemPickingFailed(requested, inStock) {
            _super.call(this);
            this.requested = requested;
            this.inStock = inStock;
        }
        ItemPickingFailed.Type = new ItemPickingFailed(0, 0);
        return ItemPickingFailed;
    })(EventStore.Event);
    exports.ItemPickingFailed = ItemPickingFailed;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludmVudG9yeS9ldmVudHMudHMiXSwibmFtZXMiOlsiSXRlbUNyZWF0ZWQiLCJJdGVtQ3JlYXRlZC5jb25zdHJ1Y3RvciIsIkl0ZW1EaXNhYmxlZCIsIkl0ZW1EaXNhYmxlZC5jb25zdHJ1Y3RvciIsIkl0ZW1Mb2FkZWQiLCJJdGVtTG9hZGVkLmNvbnN0cnVjdG9yIiwiSXRlbVBpY2tlZCIsIkl0ZW1QaWNrZWQuY29uc3RydWN0b3IiLCJJdGVtUGlja2luZ0ZhaWxlZCIsIkl0ZW1QaWNraW5nRmFpbGVkLmNvbnN0cnVjdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0lBR0MsWUFBWTtJQUNaO1FBQWlDQSwrQkFBZ0JBO1FBRWhEQSxxQkFBbUJBLEdBQVdBLEVBQVNBLFdBQW1CQTtZQUN6REMsaUJBQU9BLENBQUNBO1lBRFVBLFFBQUdBLEdBQUhBLEdBQUdBLENBQVFBO1lBQVNBLGdCQUFXQSxHQUFYQSxXQUFXQSxDQUFRQTtRQUUxREEsQ0FBQ0E7UUFITUQsZ0JBQUlBLEdBQWdCQSxJQUFJQSxXQUFXQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUl4REEsa0JBQUNBO0lBQURBLENBTEEsQUFLQ0EsRUFMZ0MsVUFBVSxDQUFDLEtBQUssRUFLaEQ7SUFMWSxtQkFBVyxjQUt2QixDQUFBO0lBRUQ7UUFBa0NFLGdDQUFnQkE7UUFFakRBO1lBQ0NDLGlCQUFPQSxDQUFDQTtRQUNUQSxDQUFDQTtRQUhNRCxpQkFBSUEsR0FBaUJBLElBQUlBLFlBQVlBLEVBQUVBLENBQUNBO1FBSWhEQSxtQkFBQ0E7SUFBREEsQ0FMQSxBQUtDQSxFQUxpQyxVQUFVLENBQUMsS0FBSyxFQUtqRDtJQUxZLG9CQUFZLGVBS3hCLENBQUE7SUFFRDtRQUFnQ0UsOEJBQWdCQTtRQUUvQ0Esb0JBQW1CQSxRQUFnQkE7WUFDbENDLGlCQUFPQSxDQUFDQTtZQURVQSxhQUFRQSxHQUFSQSxRQUFRQSxDQUFRQTtRQUVuQ0EsQ0FBQ0E7UUFITUQsZUFBSUEsR0FBZUEsSUFBSUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFJN0NBLGlCQUFDQTtJQUFEQSxDQUxBLEFBS0NBLEVBTCtCLFVBQVUsQ0FBQyxLQUFLLEVBSy9DO0lBTFksa0JBQVUsYUFLdEIsQ0FBQTtJQUdEO1FBQWdDRSw4QkFBZ0JBO1FBRS9DQSxvQkFBbUJBLFFBQWdCQTtZQUNsQ0MsaUJBQU9BLENBQUNBO1lBRFVBLGFBQVFBLEdBQVJBLFFBQVFBLENBQVFBO1FBRW5DQSxDQUFDQTtRQUhNRCxlQUFJQSxHQUFlQSxJQUFJQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUk3Q0EsaUJBQUNBO0lBQURBLENBTEEsQUFLQ0EsRUFMK0IsVUFBVSxDQUFDLEtBQUssRUFLL0M7SUFMWSxrQkFBVSxhQUt0QixDQUFBO0lBQ0Q7UUFBdUNFLHFDQUFnQkE7UUFFdERBLDJCQUFtQkEsU0FBaUJBLEVBQVNBLE9BQWVBO1lBQzNEQyxpQkFBT0EsQ0FBQ0E7WUFEVUEsY0FBU0EsR0FBVEEsU0FBU0EsQ0FBUUE7WUFBU0EsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBUUE7UUFFNURBLENBQUNBO1FBSE1ELHNCQUFJQSxHQUFzQkEsSUFBSUEsaUJBQWlCQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUk5REEsd0JBQUNBO0lBQURBLENBTEEsQUFLQ0EsRUFMc0MsVUFBVSxDQUFDLEtBQUssRUFLdEQ7SUFMWSx5QkFBaUIsb0JBSzdCLENBQUEiLCJmaWxlIjoiaW52ZW50b3J5L2V2ZW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEV2ZW50U3RvcmUgZnJvbSBcIi4uL2V2ZW50c3RvcmUvRXZlbnRTdG9yZVwiXG5cblxuXHQvKiBldmVudHMgKi9cblx0ZXhwb3J0IGNsYXNzIEl0ZW1DcmVhdGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1DcmVhdGVkID0gbmV3IEl0ZW1DcmVhdGVkKG51bGwsIG51bGwpO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyBza3U6IHN0cmluZywgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGNsYXNzIEl0ZW1EaXNhYmxlZCBleHRlbmRzIEV2ZW50U3RvcmUuRXZlbnQge1xuXHRcdHN0YXRpYyBUeXBlOiBJdGVtRGlzYWJsZWQgPSBuZXcgSXRlbURpc2FibGVkKCk7XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBjbGFzcyBJdGVtTG9hZGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1Mb2FkZWQgPSBuZXcgSXRlbUxvYWRlZCgwKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgcXVhbnRpdHk6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblxuXG5cdGV4cG9ydCBjbGFzcyBJdGVtUGlja2VkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1QaWNrZWQgPSBuZXcgSXRlbVBpY2tlZCgwKTtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgcXVhbnRpdHk6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0ZXhwb3J0IGNsYXNzIEl0ZW1QaWNraW5nRmFpbGVkIGV4dGVuZHMgRXZlbnRTdG9yZS5FdmVudCB7XG5cdFx0c3RhdGljIFR5cGU6IEl0ZW1QaWNraW5nRmFpbGVkID0gbmV3IEl0ZW1QaWNraW5nRmFpbGVkKDAsIDApO1xuXHRcdGNvbnN0cnVjdG9yKHB1YmxpYyByZXF1ZXN0ZWQ6IG51bWJlciwgcHVibGljIGluU3RvY2s6IG51bWJlcikge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
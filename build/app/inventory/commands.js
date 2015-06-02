var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../eventstore/EventStore"], function (require, exports, EventStore) {
    /* Commands */
    var RegisterItem = (function (_super) {
        __extends(RegisterItem, _super);
        function RegisterItem(itemId, sku, description) {
            _super.call(this);
            this.itemId = itemId;
            this.sku = sku;
            this.description = description;
            this.__registerItem = null;
        }
        RegisterItem.Type = new RegisterItem(null, null, null);
        return RegisterItem;
    })(EventStore.Command);
    exports.RegisterItem = RegisterItem;
    var DisableItem = (function (_super) {
        __extends(DisableItem, _super);
        function DisableItem(itemId) {
            _super.call(this);
            this.itemId = itemId;
            this.__disableItem = null;
        }
        DisableItem.Type = new DisableItem(null);
        return DisableItem;
    })(EventStore.Command);
    exports.DisableItem = DisableItem;
    var LoadItem = (function (_super) {
        __extends(LoadItem, _super);
        function LoadItem(itemId, quantity) {
            _super.call(this);
            this.itemId = itemId;
            this.quantity = quantity;
            this.__loadItem = null;
        }
        LoadItem.Type = new LoadItem(null, 0);
        return LoadItem;
    })(EventStore.Command);
    exports.LoadItem = LoadItem;
    var PickItem = (function (_super) {
        __extends(PickItem, _super);
        function PickItem(itemId, quantity) {
            _super.call(this);
            this.itemId = itemId;
            this.quantity = quantity;
            this.__loadItem = null;
        }
        PickItem.Type = new PickItem(null, 0);
        return PickItem;
    })(EventStore.Command);
    exports.PickItem = PickItem;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludmVudG9yeS9jb21tYW5kcy50cyJdLCJuYW1lcyI6WyJSZWdpc3Rlckl0ZW0iLCJSZWdpc3Rlckl0ZW0uY29uc3RydWN0b3IiLCJEaXNhYmxlSXRlbSIsIkRpc2FibGVJdGVtLmNvbnN0cnVjdG9yIiwiTG9hZEl0ZW0iLCJMb2FkSXRlbS5jb25zdHJ1Y3RvciIsIlBpY2tJdGVtIiwiUGlja0l0ZW0uY29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7SUFFQyxjQUFjO0lBQ2Q7UUFBa0NBLGdDQUFrQkE7UUFHbkRBLHNCQUFtQkEsTUFBYUEsRUFBU0EsR0FBVUEsRUFBU0EsV0FBa0JBO1lBQzdFQyxpQkFBT0EsQ0FBQ0E7WUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7WUFBU0EsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBT0E7WUFBU0EsZ0JBQVdBLEdBQVhBLFdBQVdBLENBQU9BO1lBRDlFQSxtQkFBY0EsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFHdEJBLENBQUNBO1FBSk1ELGlCQUFJQSxHQUFpQkEsSUFBSUEsWUFBWUEsQ0FBQ0EsSUFBSUEsRUFBQ0EsSUFBSUEsRUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFLOURBLG1CQUFDQTtJQUFEQSxDQU5BLEFBTUNBLEVBTmlDLFVBQVUsQ0FBQyxPQUFPLEVBTW5EO0lBTlksb0JBQVksZUFNeEIsQ0FBQTtJQUVEO1FBQWlDRSwrQkFBa0JBO1FBR2xEQSxxQkFBbUJBLE1BQWFBO1lBQy9CQyxpQkFBT0EsQ0FBQ0E7WUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7WUFEaENBLGtCQUFhQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUdyQkEsQ0FBQ0E7UUFKTUQsZ0JBQUlBLEdBQWdCQSxJQUFJQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUtsREEsa0JBQUNBO0lBQURBLENBTkEsQUFNQ0EsRUFOZ0MsVUFBVSxDQUFDLE9BQU8sRUFNbEQ7SUFOWSxtQkFBVyxjQU12QixDQUFBO0lBRUQ7UUFBOEJFLDRCQUFrQkE7UUFHL0NBLGtCQUFtQkEsTUFBYUEsRUFBU0EsUUFBZ0JBO1lBQ3hEQyxpQkFBT0EsQ0FBQ0E7WUFEVUEsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBT0E7WUFBU0EsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBUUE7WUFEekRBLGVBQVVBLEdBQUdBLElBQUlBLENBQUNBO1FBR2xCQSxDQUFDQTtRQUpNRCxhQUFJQSxHQUFhQSxJQUFJQSxRQUFRQSxDQUFDQSxJQUFJQSxFQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUs5Q0EsZUFBQ0E7SUFBREEsQ0FOQSxBQU1DQSxFQU42QixVQUFVLENBQUMsT0FBTyxFQU0vQztJQU5ZLGdCQUFRLFdBTXBCLENBQUE7SUFFRDtRQUE4QkUsNEJBQWtCQTtRQUcvQ0Esa0JBQW1CQSxNQUFhQSxFQUFTQSxRQUFnQkE7WUFDeERDLGlCQUFPQSxDQUFDQTtZQURVQSxXQUFNQSxHQUFOQSxNQUFNQSxDQUFPQTtZQUFTQSxhQUFRQSxHQUFSQSxRQUFRQSxDQUFRQTtZQUR6REEsZUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFHbEJBLENBQUNBO1FBSk1ELGFBQUlBLEdBQWFBLElBQUlBLFFBQVFBLENBQUNBLElBQUlBLEVBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBSzlDQSxlQUFDQTtJQUFEQSxDQU5BLEFBTUNBLEVBTjZCLFVBQVUsQ0FBQyxPQUFPLEVBTS9DO0lBTlksZ0JBQVEsV0FNcEIsQ0FBQSIsImZpbGUiOiJpbnZlbnRvcnkvY29tbWFuZHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBFdmVudFN0b3JlIGZyb20gXCIuLi9ldmVudHN0b3JlL0V2ZW50U3RvcmVcIlxuXG5cdC8qIENvbW1hbmRzICovXG5cdGV4cG9ydCBjbGFzcyBSZWdpc3Rlckl0ZW0gZXh0ZW5kcyBFdmVudFN0b3JlLkNvbW1hbmR7XG5cdFx0c3RhdGljIFR5cGU6IFJlZ2lzdGVySXRlbSA9IG5ldyBSZWdpc3Rlckl0ZW0obnVsbCxudWxsLG51bGwpO1xuXHRcdF9fcmVnaXN0ZXJJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHNrdTpzdHJpbmcsIHB1YmxpYyBkZXNjcmlwdGlvbjpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBEaXNhYmxlSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogRGlzYWJsZUl0ZW0gPSBuZXcgRGlzYWJsZUl0ZW0obnVsbCk7XG5cdFx0X19kaXNhYmxlSXRlbSA9IG51bGw7XG5cdFx0Y29uc3RydWN0b3IocHVibGljIGl0ZW1JZDpzdHJpbmcpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBMb2FkSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogTG9hZEl0ZW0gPSBuZXcgTG9hZEl0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cblx0XG5cdGV4cG9ydCBjbGFzcyBQaWNrSXRlbSBleHRlbmRzIEV2ZW50U3RvcmUuQ29tbWFuZHtcblx0XHRzdGF0aWMgVHlwZTogUGlja0l0ZW0gPSBuZXcgUGlja0l0ZW0obnVsbCwwKTtcblx0XHRfX2xvYWRJdGVtID0gbnVsbDtcblx0XHRjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbUlkOnN0cmluZywgcHVibGljIHF1YW50aXR5OiBudW1iZXIpe1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9XG5cdH1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
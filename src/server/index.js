const util = require("util");

export class OrderBook {
  EMPTY_ORDER_BOOK = { buy: [], sell: [] };

  constructor(link) {
    this.link = link;
    this.put = util.promisify(this.link.put).bind(this.link);
    this.get = util.promisify(this.link.get).bind(this.link);
    this.orderBookHash = null;
  }

  getHash() {
    return this.orderBookHash;
  }
  async setOrder(order) {
    if (this.orderBookHash === null) {
      this.orderBookHash = await this.put({
        v: JSON.stringify(this.EMPTY_ORDER_BOOK),
      });
    }

    const orderBook = await this.getOrderBook();
    if (order.type === "buy") {
      const index = orderBook.sell.findIndex((previousOrder) => {
        return (
          previousOrder.price == order.bid.price &&
          previousOrder.quantity == order.bid.quantity
        );
      });
      if (index > -1) {
        orderBook.sell.splice(index, 1);
      } else {
        orderBook.buy.push(order.bid);
      }
    } else {
      const index = orderBook.buy.findIndex((previousOrder) => {
        return (
          previousOrder.price == order.ask.price &&
          previousOrder.quantity == order.ask.quantity
        );
      });

      if (index > -1) {
        orderBook.buy.splice(index, 1);
      } else {
        orderBook.sell.push(order.ask);
      }
    }

    this.orderBookHash = await this.put({ v: JSON.stringify(orderBook) });
  }

  async getOrderBook() {
    return await this.get(this.orderBookHash).then((data) =>
      JSON.parse(data.v),
    );
  }
}

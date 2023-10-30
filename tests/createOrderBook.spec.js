const expect = require("chai").expect;
const { PeerRPCClient } = require("grenache-nodejs-http");
const { buildService } = require("server/server");
const Link = require("grenache-nodejs-link");
const { OrderBook } = require("server");

describe("PLacing an order", () => {
  let peer, link, orderBookService, orderBook, stop;
  let orderBookHash = null;

  beforeEach(() => {
    link = new Link({
      grape: "http://127.0.0.1:30001",
    });
    link.start();
    orderBook = new OrderBook(link);
    peer = new PeerRPCClient(link, {});
    peer.init();

    orderBookService = buildService(link);
    link.announce("rpc_test", orderBookService.port, {});

    stop = () => {
      peer.stop();
      link.stop();
      orderBookService.stop();
    };
  });

  it("creates an order in the orderbook", (done) => {
    orderBookService.on("request", async (rid, key, payload, handler) => {
      const { order } = payload;

      await orderBook.setOrder(order);
      handler.reply(null, "world");
    });

    const opts = { timeout: 100000 };
    const order = {
      type: "buy",
      bid: { price: 1000, quantity: 0.2 },
    };

    const sellOrder = {
      type: "sell",
      ask: { price: 900, quantity: 0.3 },
    };

    const matchingOrder = {
      type: "sell",
      ask: { price: 1000, quantity: 0.2 },
    };

    const matchingBuyOrder = {
      type: "buy",
      bid: { price: 900, quantity: 0.3 },
    };

    const matchingBuyOrderHandler = async (err, result) => {
      if (err) {
        stop();
        done(err);
      } else {
        orderBook
          .getOrderBook()
          .then((o) => {
            expect(o.sell).to.be.empty;
            expect(o.buy).to.be.empty;
            stop();
            done();
          })
          .catch((error) => {
            stop();
            done(error);
          });
      }
    };

    const matchingOrderHandler = async (err, result) => {
      if (err) {
        stop();
        done(err);
      } else {
        orderBook
          .getOrderBook()
          .then((o) => {
            expect(o.sell).to.deep.include(sellOrder.ask);
            expect(o.buy).to.be.empty;
            peer.request(
              "rpc_test",
              { order: matchingBuyOrder },
              opts,
              matchingBuyOrderHandler,
            );
          })
          .catch((error) => {
            stop();
            done(error);
          });
      }
    };

    const handlerSellOrder = async (err, result) => {
      if (err) {
        stop();
        done(err);
      } else {
        orderBook
          .getOrderBook()
          .then((o) => {
            expect(o.sell).to.deep.include(sellOrder.ask);
            peer.request(
              "rpc_test",
              { order: matchingOrder },
              opts,
              matchingOrderHandler,
            );
          })
          .catch((error) => {
            stop();
            done(error);
          });
      }
    };

    const handlerBuyOrder = async (err, result) => {
      if (err) {
        stop();
        done(err);
      } else {
        orderBook
          .getOrderBook()
          .then((o) => {
            expect(o.buy).to.deep.include(order.bid);

            peer.request(
              "rpc_test",
              { order: sellOrder },
              opts,
              handlerSellOrder,
            );
          })
          .catch((error) => {
            stop();
            done(error);
          });
      }
    };

    peer.request("rpc_test", { order }, opts, handlerBuyOrder);
  });
});

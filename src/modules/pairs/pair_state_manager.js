const PairState = require('../../dict/pair_state');
const OrderCapital = require('../../dict/order_capital');

module.exports = class PairStateManager {
  constructor(logger, pairConfig) {
    this.logger = logger;
    this.pairConfig = pairConfig;
    this.stats = {};
  }

  update(exchange, symbol, state, options = {}) {
    if (!['long', 'close', 'short', 'cancel'].includes(state)) {
      this.logger.error(`Invalidate state: ${state}`);
      throw new Error(`Invalidate state: ${state}`);
    }

    const clearCallback = () => {
      this.logger.info(`State cleared: ${exchange} - ${symbol} - ${state}`);
      this.clear(exchange, symbol);
    };

    let pairState;
    if (state === 'long') {
      const capital = this.pairConfig.getSymbolCapital(exchange, symbol);
      if (!(capital instanceof OrderCapital)) {
        this.logger.error(`Invalidate OrderCapital: ${exchange} - ${symbol} - ${state}`);
        return;
      }

      pairState = PairState.createLong(exchange, symbol, capital, options || {}, true, clearCallback);
    } else if (state === 'short') {
      const capital = this.pairConfig.getSymbolCapital(exchange, symbol);
      if (!(capital instanceof OrderCapital)) {
        this.logger.error(`Invalidate OrderCapital: ${exchange} - ${symbol} - ${state}`);
        return;
      }

      pairState = PairState.createShort(exchange, symbol, capital, options || {}, true, clearCallback);
    } else {
      pairState = new PairState(exchange, symbol, state, options || {}, true, clearCallback);
    }

    this.logger.info(
      `Pair state changed: ${JSON.stringify({
        new: JSON.stringify(pairState),
        old: JSON.stringify(this.stats[exchange + symbol] || {})
      })}`
    );

    this.stats[exchange + symbol] = pairState;
  }

  /**
   *
   * @param exchange
   * @param symbol
   * @returns {undefined|PairState}
   */
  get(exchange, symbol) {
    if (exchange + symbol in this.stats) {
      return this.stats[exchange + symbol];
    }

    return undefined;
  }

  all() {
    const stats = [];

    for (const key in this.stats) {
      stats.push(this.stats[key]);
    }

    return stats;
  }

  clear(exchange, symbol) {
    if (exchange + symbol in this.stats) {
      this.logger.debug(`Pair state cleared: ${JSON.stringify(this.stats[exchange + symbol])}`);
    }

    delete this.stats[exchange + symbol];
  }

  getSellingPairs() {
    const pairs = [];

    for (const key in this.stats) {
      if (this.stats[key].state === 'short') {
        pairs.push(this.stats[key]);
      }
    }

    return pairs;
  }

  getBuyingPairs() {
    const pairs = [];

    for (const key in this.stats) {
      if (this.stats[key].state === 'long') {
        pairs.push(this.stats[key]);
      }
    }

    return pairs;
  }

  getClosingPairs() {
    const pairs = [];

    for (const key in this.stats) {
      if (this.stats[key].state === 'close') {
        pairs.push(this.stats[key]);
      }
    }

    return pairs;
  }

  getCancelPairs() {
    const pairs = [];

    for (const key in this.stats) {
      if (this.stats[key].state === 'cancel') {
        pairs.push(this.stats[key]);
      }
    }

    return pairs;
  }

  isNeutral(exchange, symbol) {
    return !(exchange + symbol in this.stats);
  }
};

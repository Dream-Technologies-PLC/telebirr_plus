class TelebirrConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TelebirrConfigError';
  }
}

class TelebirrApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'TelebirrApiError';
    this.status = options.status;
    this.code = options.code;
    this.raw = options.raw;
  }
}

module.exports = {
  TelebirrApiError,
  TelebirrConfigError,
};

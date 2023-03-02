// © 2016-2023 Resurface Labs Inc.

class WriterWrapper {
  constructor(response, limit = 1024 * 1024) {
    this.limit = limit;
    this.body = undefined;
    this.stringified_chunk = undefined;
    this.overflowed = false;
    this.logged_bytes = 0;
    response.write = this.wrap(response, response.write);
    response.end = this.wrap(response, response.end);
  }

  wrap(response, original_method) {
    return (chunk, encoding, callback) => {
      this.logged_bytes += chunk instanceof Buffer || typeof chunk === 'string' || chunk instanceof String ? Buffer.byteLength(chunk, encoding) : Buffer.byteLength((this.stringified_chunk = JSON.stringify(chunk) || ''));
      if (!this.overflowed) {
        if (this.logged_bytes > this.limit) {
          this.overflowed = true;
          this.body = undefined;
        } else if (chunk instanceof Buffer) {
          this.body = this.body === undefined ? chunk.toString() : this.body + chunk.toString();
        } else if (typeof chunk === 'string' || chunk instanceof String) {
          this.body = this.body === undefined ? chunk : this.body + chunk;
        } else {
          this.body = this.body === undefined ? this.stringified_chunk : this.body + this.stringified_chunk;
        }
      }
      original_method.call(response, chunk, encoding, callback);
    };
  }

  logged() {
    return this.overflowed ? `{"overflowed: ${this.logged_bytes}"}` : this.body;
  }
}

module.exports = WriterWrapper;

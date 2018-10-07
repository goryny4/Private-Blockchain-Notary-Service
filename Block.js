const SHA256 = require('crypto-js/sha256');

class Block {
    constructor(body) {
        this.hash = "";
        this.height = 0;
        this.body = body;
        this.time = 0;
        this.previousBlockHash = "";
    }

    loadFromJson(data) {
        this.hash = data.hash;
        this.height = data.height;
        this.body = data.body;
        this.time = data.time;
        this.previousBlockHash = data.previousBlockHash;
    }

    isValid() {
        // remove block hash to test block integrity
        let blockHash = this.hash;
        this.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(this)).toString();
        this.hash = blockHash;
        return blockHash === validBlockHash;
    }

}

module.exports = Block;
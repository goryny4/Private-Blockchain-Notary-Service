/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');
const chainDB = './chaindata';
const level = require('level');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {

    constructor() {
        this.db = level(chainDB)
    }

    getBlockHeightPromise() {
        let db = this.db;
        let count = 0;

        return new Promise(function (resolve, reject) {

            db.createReadStream()
                .on('data', data => {
                    count++;
                })
                .on('close', () => {
                    console.log('Count of blocks is ' + count)
                    resolve(count);
                });

        });
    }

    static _decodeStarStory(data) {
        if ((data.body.star !== undefined) && (data.body.star.story !== undefined)) {
            data.body.star.storyDecoded = Buffer.from(data.body.star.story, 'hex').toString('ascii');
        }
        return data;
    }

    getBlockPromise(blockHeight,json = true) {
        let key = blockHeight;
        let db = this.db;
        return new Promise(function (resolve, reject) {
            db.get(key, function (err, value) {
                if (err) {
                    console.log('Block not found!');
                    reject(false);
                } else {

                    let blockJson = JSON.parse(value);
                    blockJson = Blockchain._decodeStarStory(blockJson);
                    if (json) {
                        resolve(blockJson);
                    } else {
                        let block = new Block();
                        block.loadFromJson(blockJson);
                        resolve(block);
                    }
                }
            });
        });
    }


    getBlockByHashPromise(hash) {
        let db = this.db;
        let _decodeStarStory = Blockchain._decodeStarStory;

        return new Promise(function (resolve, reject) {
            db.createValueStream()
                .on('data', stuff => {
                    let data = JSON.parse(stuff);
                    if (data.hash === hash) {
                        data = _decodeStarStory(data);
                        resolve(data);
                    }
                })
                .on('close', () => {
                    reject(true);
                });
        });
    }

    getBlocksByWalletPromise(address) {
        let db = this.db;
        let blocks = [];
        let _decodeStarStory = Blockchain._decodeStarStory;

        return new Promise(function (resolve, reject) {
            db.createValueStream()
                .on('data', stuff => {
                    let data = JSON.parse(stuff);
                    if (data.body.address === address) {
                        data = _decodeStarStory(data);
                        blocks.push(data);
                    }
                })
                .on('close', () => {
                    resolve(blocks);
                });
        });
    }


    cleanPromise() {
        let keyNames = '';
        let count = 0;
        let db = this.db;

        return new Promise(function (resolve, reject) {
            db.createKeyStream({type: 'del'})
                .on('data', data => {
                    count++;
                    keyNames += ' ' + data;
                    db.del(data);
                })
                .on('close', () => {
                    if (count) console.log('Cleaned ' + count + 'keys')
                    if (keyNames) console.log('Key names: ' + keyNames)
                    resolve(count);
                });
        });
    }

    validateChainPromise() {

        let db = this.db;
        let hash = '';
        let block = null;

        return new Promise(function (resolve, reject) {

            db.createValueStream()
                .on('data', data => {
                    console.log(data);
                    block = JSON.parse(data);
                    hash = block.hash;
                    block.hash = '';
                    if (hash !== SHA256(JSON.stringify(block)).toString()) reject(false);
                })
                .on('close', () => {
                    resolve(true);
                });
        });
    }

    async createGenesisBlock() {
        console.log('createGenesisBlock');

        try {
            let hasGenesis = 0;
            try {
                hasGenesis = await this.getBlockHeightPromise();
                console.log('hasGenesis ' + hasGenesis);
            } catch (e) {
                console.log('Cant check blockchain height');
            }
            if (!hasGenesis) {
                console.log('no genesis yet. Adding');
                try {
                    await this.addBlockPromise('First block in the chain - Genesis block');
                } catch (e) {
                    console.log('Cant create genesis block');
                }
            } else {
                console.log('genesis block exists!');
            }
        } catch (e) {
            console.log('cant add block ' + e.message);
        }
    }

    async addBlockPromise(body) {

        let newBlockObject = new Block(body);

        // Block height
        try {
            newBlockObject.height = await this.getBlockHeightPromise();
        } catch (e) {
            console.log(e.message);
        }
        // UTC timestamp
        newBlockObject.time = new Date().getTime().toString().slice(0, -3);

        console.log('height = ' + newBlockObject.height);

        // previous block hash
        if (newBlockObject.height > 0) {
            // console.log('height > 0');
            try {
                let data = await this.getBlockPromise(newBlockObject.height - 1)
                newBlockObject.previousBlockHash = data.hash;
            } catch (e) {
                console.log('getBlockPromise failed: ' + e.message);
            }
        }

        // Block hash with SHA256 using newBlock and converting to a string
        newBlockObject.hash = SHA256(JSON.stringify(newBlockObject)).toString();

        // Adding block object to LevelDB
        let key = newBlockObject.height;
        let value = JSON.stringify(newBlockObject);
        let db = this.db;

        return new Promise(function (resolve, reject) {
            db.put(key, value, function (err) {
                if (err) {
                    let errorText = 'Block ' + key + ' submission failed';
                    reject(errorText);
                    return console.log(errorText, err);
                }
                console.log('Block ' + key + ' submitted');
                //    console.log(JSON.parse(value));
                resolve(newBlockObject);
            });
        });

    }
}


module.exports = Blockchain;
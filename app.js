let express = require('express');
let app = express();

// bodyParser
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const BlockChain = require('./BlockChain.js');
let myBlockChain = new BlockChain();
myBlockChain.createGenesisBlock();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
});

app.get('/', (req, res) => {
    res.json({'message':'Welcome to my private blockchain'});
});


app.get('/block/:id', (req, res) => {

    async function getBlock() {
        try {
            let data = await myBlockChain.getBlockPromise(req.params.id);

            console.log(data);
            res.json(data);
        } catch (e) {
            let errorJson = {'error': 'No such block: ' + e.message};
            console.log(errorJson);
            res.json(errorJson);
        }
    }

    try {
        getBlock();
    } catch (e) {
        let errorJson = {'error': 'No such block: ' + e.message};
        console.log(errorJson);
        res.json(errorJson);
    }
});

app.post('/block', (req, res) => {
    let body = req.body.body;

    if (body === undefined) return res.status(400).json({error: "The request should contain 'body' element"});

    console.log(body);

    async function addBlock(body) {
        if (!body.toString().length)        return res.status(400).json({error: "The body element shouldn't be blank"});
        if (body.address    === undefined)  return res.status(400).json({error: "The body element should contain an 'address' element"});
        if (body.star       === undefined)  return res.status(400).json({error: "The body element should contain a 'star' element"});
        if (body.star.ra    === undefined)  return res.status(400).json({error: "The star element should contain a 'ra' element"});
        if (body.star.dec   === undefined)  return res.status(400).json({error: "The star element should contain a 'dec' element"});
        if (body.star.story === undefined)  return res.status(400).json({error: "The star element should contain a 'story' element"});

        body.star.story = Buffer.from(body.star.story, 'utf8').toString('hex');

        if (body.star.story.length > 500)   return res.status(400).json({error: "The 'story' element is limited to 500 bytes (converted to HEX). Your story is " + body.star.story.length + ' bytes long (in HEX)'});

        return await myBlockChain.addBlockPromise(body);
    }

    addBlock(body).catch(err => {
        let errorJson = {'error': err.message};
        console.log(errorJson);
        res.json(errorJson);
    }).then((result) => {
        console.log(result);
        res.json(result);
    });

});


// ========== Private Blockchain Notary Service =============================

const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMsg = require('bitcoinjs-message');

let mempool = [];
const delay = 300;

app.post('/requestValidation', (req, res) => {
    let address = req.body.address;
    let timestamp = Math.round(+new Date / 1000);

    // validation mempool, keeps addresses for 'delay' time
    if (!mempool[address] || ((mempool[address] + delay) < timestamp)) {
        mempool[address] = timestamp;
        setTimeout(() => delete mempool[address], delay * 1000);
    }

    let response = {
        address: address,
        requestTimeStamp: timestamp,
        message: [address,timestamp,'starRegistry'].join(':'),
        validationWindow: delay
    };

    console.log(mempool);
    res.json(response);
});


app.post('/message-signature/validate', (req, res) => {
    let isValid = null;
    let response = null;
    let error = null;

    let address = req.body.address;
    let signature = req.body.signature;
    let timestamp = mempool[address];

    if (timestamp === undefined) {
        res.json({
            registerStar: false,
            error: 'Timeout, please request validation message again'
        }); return null;
    }

    const message = [address,timestamp,'starRegistry'].join(':');

    console.log(address);
    console.log(signature);
    console.log(timestamp);

    try {
        isValid = bitcoinMsg.verify(message,address,signature);
    } catch(e) {
        isValid = false;
        console.log(e.message);
        error = e.message;
    }
    console.log(isValid);

    if (isValid) {
        let validationWindow = timestamp + delay - Math.round(+new Date/1000);
        console.log(validationWindow);

        response = {
            registerStar: true,
            status: {
                address: address,
                requestTimeStamp: timestamp,
                message: message,
                validationWindow: validationWindow,
                messageSignature: 'valid'
            }
        };
    } else {
        response = {
            registerStar: false,
            error: error
        }
    }


    res.json(response);

});


// ================ Notar Lookup ================================

app.get('/stars/hash/:hash', (req, res) => {

    async function getBlockByHash(hash) {
        try {
            let data = await myBlockChain.getBlockByHashPromise(hash);

            console.log(data);
            res.json(data);
        } catch (e) {
            let errorJson = {'error': 'No such hash: ' + e.message};
            console.log(errorJson);
            res.json(errorJson);
        }
    }

    try {
        let hash = req.params.hash;
        getBlockByHash(hash);
    } catch (e) {
        let errorJson = {'error': 'No such hash: ' + e.message};
        console.log(errorJson);
        res.json(errorJson);
    }
});

app.get('/stars/address/:address', (req, res) => {

    async function getBlocksByWallet(address) {
        try {
            let data = await myBlockChain.getBlocksByWalletPromise(address);

            console.log(data);
            res.json(data);
        } catch (e) {
            let errorJson = {'error': 'No such address: ' + e.message};
            console.log(errorJson);
            res.json(errorJson);
        }
    }

    try {
        let address = req.params.address;
        getBlocksByWallet(address);
    } catch (e) {
        let errorJson = {'error': 'No such address: ' + e.message};
        console.log(errorJson);
        res.json(errorJson);
    }
});


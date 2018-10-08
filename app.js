let express = require('express');
let app = express();

// bodyParser
let bodyParser = require('body-parser');
let expressValidator = require('express-validator');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(expressValidator());

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
    console.log(body);
    req.checkBody('body', 'Body is required').notEmpty();
    req.checkBody('body.address', 'Address is required').notEmpty();

    if (mempool[body.address] === undefined) {
        return res.status(400).json({"error":"Please request a message first (/requestValidation)"});
    }
    if (allowStarRegistration[body.address] === undefined) {
        return res.status(400).json({"error":"Please sign a message first (/message-signature/validate)"});
    }

    req.checkBody('body.star', 'Star is required').notEmpty();
    req.checkBody('body.star.ra', 'ra is required').notEmpty();
    req.checkBody('body.star.dec', 'dec is required').notEmpty();
    req.checkBody('body.star.story', 'Story is required').notEmpty();

    let errors = req.validationErrors();
    if(errors){
        return res.status(400).json(errors);
    }

    async function addBlock(body) {
        body.star.story = Buffer.from(body.star.story, 'ascii').toString('hex');
        if (body.star.story.length > 500)   {
            return res.status(400).json({error: "The 'story' element is limited to 500 bytes (converted to HEX). Your story is " + body.star.story.length + ' bytes long (in HEX)'});
        }

        return await myBlockChain.addBlockPromise(body);
    }

    addBlock(body).catch(err => {
        let errorJson = {'error': err.message};
        console.log(errorJson);
        res.json(errorJson);
    }).then((result) => {
        console.log(result);
        delete mempool[body.address];
        delete allowStarRegistration[body.address];
        res.json(result);
    });

});


// ========== Private Blockchain Notary Service =============================

const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMsg = require('bitcoinjs-message');

let mempool = [];
let allowStarRegistration = [];
const delay = 300;

app.post('/requestValidation', (req, res) => {
    req.checkBody('address', 'Address is required').notEmpty();
    let errors = req.validationErrors();
    if (errors) return res.status(400).json(errors);

    let address = req.body.address;
    let currentTime = Math.round(+new Date / 1000);

    // validation mempool, keeps addresses for 'delay' time
    if (!mempool[address] || ((mempool[address] + delay) < currentTime)) {
        mempool[address] = currentTime;
        setTimeout(() => {
            delete mempool[address];
            delete allowStarRegistration[address];
        }, delay * 1000);
    }

    let response = {
        address: address,
        requestTimeStamp: mempool[address],
        message: [address,mempool[address],'starRegistry'].join(':'),
        validationWindow: mempool[address] + delay - currentTime
    };

    console.log(mempool);
    res.json(response);
});


app.post('/message-signature/validate', (req, res) => {
    console.log('----------------------------------');
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
        allowStarRegistration[address] = true;
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

app.get('/stars/hash::hash', (req, res) => {
    try {
        let hash = req.params.hash;
        getBlockByHash(hash);
    } catch (e) {
        let errorJson = {'error': 'No such hash'};
        console.log(errorJson);
        res.json(errorJson);
    }

    async function getBlockByHash(hash) {
        try {
            let data = await myBlockChain.getBlockByHashPromise(hash);

            console.log(data);
            res.json(data);
        } catch (e) {
            let errorJson = {'error': 'No such hash'};
            console.log(errorJson);
            res.json(errorJson);
        }
    }

});

app.get('/stars/address::address', (req, res) => {
    try {
        let address = req.params.address;
        getBlocksByWallet(address);
    } catch (e) {
        let errorJson = {'error': 'No such address'};
        console.log(errorJson);
        res.json(errorJson);
    }

    async function getBlocksByWallet(address) {
        try {
            let data = await myBlockChain.getBlocksByWalletPromise(address);

            console.log(data);
            res.json(data);
        } catch (e) {
            let errorJson = {'error': 'No such address'};
            console.log(errorJson);
            res.json(errorJson);
        }
    }
});


// ========== Private Blockchain Notary Service TEST =============================

const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMsg = require('bitcoinjs-message');

let keyPair = bitcoinLib.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss');
let privateKey = keyPair.privateKey;
let message = process.argv.slice(2)[0];
let signature = bitcoinMsg.sign(message, privateKey, keyPair.compressed);
console.log(signature.toString('base64'));

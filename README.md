# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js web site)[https://nodejs.org/en/].

### Configuring your project

- Install dependencies
```
npm install 
```
It includes nodemon, crypto-js, levelDB, express, bodyParser, bitcoinjs-lib, bitcoinjs-message etc 


## How to run and test the app

1) run the server
```
npm start
```

## Endpoints

#### STEP 1
- Ask for a message to sign
```
POST http://localhost:8000/requestValidation 
{
    "address":"1HZwkjkeaoZfTSaJxDw6aKkxp45agDiEzN"
}
```

- run this command to generate a signature for testing purposes
```
node sign {a message, for ex. 1HZwkjkeaoZfTSaJxDw6aKkxp45agDiEzN:1538893200:starRegistry} 
```

- Send a signed message
```
POST http://localhost:8000/requestValidation 
{
    "address":"1HZwkjkeaoZfTSaJxDw6aKkxp45agDiEzN",
    "signature":"G3lCknl7hMj4G/8KXYwwO5yy5fKU2Kcgbay3UKXx07JWJp/FZ4IIR3yzB1blsG7BVualhX959T3aGk2DeG25Y8M="
}
```
#### STEP 2
- Register a Star. Request body shouldn't be empty. Request should be a json with 'body' element.
It should also contain dec, ra and story inside the star element
```
POST http://localhost:8000/block
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}
```


#### STEP 3
- Get block by it's hash
```
GET http://localhost:8000/star/hash/:hash
```

- Get blocks by wallet address
```
GET http://localhost:8000/star/address/:address
```

- Get block by it's height
```
GET http://localhost:8000/block/:height
```


## Built With

(Express)[http://expressjs.com/] - Node.js framework

(BodyParser)[https://www.npmjs.com/package/body-parser] - Node.js middleware 
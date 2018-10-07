# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.



## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.



### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.jsВ® web site)[https://nodejs.org/en/].



### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
npm init
```
- Install crypto-js with --save flag to save dependency to our package.json file
```
npm install crypto-js --save
```
- Install level with --save flag
```
npm install level --save
```

- Install Express with --save flag
```
npm i express --save
```

- Install bodyParser with --save flag
```
npm i bodyParser --save
```



## Endpoints

- Create a new block. Request body shouldn't be empty. Request should be a json with 'body' element.
```
POST http://localhost:8000/block
```

- Get block by it's height (id)
```
GET http://localhost:8000/block/:id
```



## How to run and test the app

0) If you already have records in your local LevelDB, clean it 
```
node index.js
```

1) run the server
```
node app.js
```

2) Create a genesis block 
```
POST http://localhost:8000/block
```
```
{body:'Some test content'}
```

3) Create few more blocks by repeating step 2) with different body content

4) Check if the blocks are valid in DB by reaching
```
http://localhost:8000/block/0
http://localhost:8000/block/1
http://localhost:8000/block/2
```
in your browser



## Built With

(Express)[http://expressjs.com/] - Node.js framework

(BodyParser)[https://www.npmjs.com/package/body-parser] - Node.js middleware 
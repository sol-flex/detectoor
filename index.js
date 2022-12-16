const express = require('express');
const cors = require('cors');
var axios = require("axios")
var Metaplex = require("@metaplex-foundation/js");
var Solana = require("@solana/web3.js")
const Connection = Solana.Connection
const clusterApiUrl = Solana.clusterApiUrl
const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex.Metaplex(connection);
const PORT = process.env.PORT || 5000
const Delay = require("http-delayed-response")
const { v4: uuidv4 } = require('uuid');


var AWS = require("aws-sdk");
AWS.config.update({region: 'us-west-2'});

s3 = new AWS.S3({apiVersion: '2006-03-01'});


const app = express();

app.use(cors({
    origin: '*'
}));


app.get('/', (req, res) => {
  try {
      res.send("Detectooor server running")
  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /" })
  }

});

app.get('/results/:filePath', async (req, res) => {
  try {
    console.log("this end point was hit baby hit it baby")
    console.log(req.params.filePath)
    var params = {
      Bucket: "detectooor", 
      Key: req.params.filePath
     };
  
     await s3.getObject(params, function(err, data) {
       if (err) {
         if(err.code == "NoSuchKey") {
          res.status(202).send({ msg: "NoSuchKey"})
          console.log(err, err.stack);
          // send response that the resource doesn't exist
         } else {
          res.status(404).send({ msg: "Something went wrong with accessing s3"})
         }
       } 
       else {
         var jsonData = JSON.parse(data.Body)
         console.log(jsonData);
         res.send(jsonData);
       }
     });
      
  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /results/" })
  }

});

app.get('/start2/:collectionSymbol', async (req, res) => {
  try {
    console.log(req.params)

    var body = {}

    body.washTradingWallets = await start2(req.params.collectionSymbol);

    console.log("body", body)
    res.send(body);

  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /start2" })
  }
});

app.get('/start3/:collectionSymbol', async (req, res) => {
  try {
    console.log(req.params)

    var body = {}
    var uid = uuidv4();

    startAndSendResultToS3(req.params.collectionSymbol, uid);

    res.location(`/${req.params.collectionSymbol}-${uid}.json`)
    res.status(202).send({ location: `/${req.params.collectionSymbol}-${uid}.json` });
/*
    if (temp instanceof Error) {
      console.log("sending error to front-end")
      body[temp.name] = temp.message
      body.isError = true;
      res.send(body);
    } else {
      console.log("body", body)
      body.walletsFundedByCreator = temp;
      res.send(body);
    }
*/
  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /start2" })
  }
});

app.listen(PORT, () => console.log(`Example app is listening on port ${PORT}.`));

const getCollectionBuyTxns = async (collection_symbol) => {
  
  var wallet_tally = {}
  let offset = 0
  let limit = 1000
  var data_length = 1000;

  try {

    while(true) {
      const response = await axios({
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=${offset}&limit=${limit}`
      });

      if(response.data.length == 0) { break; }

      response.data.forEach(element => {
        if (element.type === "buyNow" && element.buyer in wallet_tally) {
          wallet_tally[element.buyer].txns++;
          wallet_tally[element.buyer].vol = wallet_tally[element.buyer].vol + element.price
        } else if (element.type === "buyNow" && !(element.buyer in wallet_tally)) {
          
          wallet_tally[element.buyer] = {
            txns: 1,
            vol: element.price
          }
        } 
      });

      console.log(response.data[0])
      console.log(response.data.length)
      data_length = response.data.length

      offset = offset + 1000;

    }

    console.log(`Tally of buy txns on the collection: ${wallet_tally}`);
    console.log(wallet_tally)

    return wallet_tally;

  } catch (err) {
    console.log(err);
  }
};

const getCreatorWallets = async (mintAddress) => {
  let creatorWallets = []
  mintAddress = new Solana.PublicKey(mintAddress);

  const nft = await metaplex.nfts().findByMint({ mintAddress });

  for (let i = 0; i < nft.creators.length; i++) {
    creatorWallets.push(nft.creators[i].address.toBase58())
  }
  console.log(creatorWallets)
  return creatorWallets;
}


const getCreatorTransfers = async (royalty_wallet) => {

  var offset = 0;
  var limit = 100;
  var solTransfers = []
  var data_length = 100;
  var iter = 1;

  try {

    while(true) {
      var response = await axios({
        method: "get",
        url: `https://public-api.solscan.io/account/solTransfers?account=${royalty_wallet}&limit=${limit}&offset=${offset}`
      });

      data_length = response.data.data.length

      console.log(`Page ${iter} of data length: `, data_length, `with offset of ${offset}`)
      console.log(response.data.data[0])

      if(data_length == 0) { break; }

      iter++;

      response.data.data.forEach(element => {
        solTransfers.push(element.dst)
      })

      offset = offset + 100;
   }

    console.log(`First element of creator sol transfers: ${solTransfers[0]}`);
    console.log(`How many creator sol transfers: ${solTransfers.length}`);

    return solTransfers;

  } catch (err) {
    console.log(err)
  }
}

const getWallet2WalletTxs = async (collection_symbol) => {
  
  var wash_trading_wallets = {};
  var buyNow_txns = [];
  let offset = 0
  let limit = 1000
  var data_length = 1000;

  try {

    while(data_length == limit && offset != 16000) {
      const response = await axios({
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=${offset}&limit=${limit}`
      });

      response.data.forEach(element => {
        if(element.type === "buyNow") {
          buyNow_txns.push(element);
        }
      })
      console.log(response.data[0])
      console.log(response.data.length)
      data_length = response.data.length

      offset = offset + 1000;

    }

    buyNow_txns.forEach(element => {
      buyNow_txns.forEach(element_1 => {
        if(element.buyer === element_1.seller && element.seller === element_1.buyer) {
          if(!(element.buyer in wash_trading_wallets)) {
            wash_trading_wallets[element.buyer] = {}
            wash_trading_wallets[element.buyer].wallet_2 = element.seller
            wash_trading_wallets[element.buyer].vol = 0;
            wash_trading_wallets[element.buyer].txns = 0;
          }
        }
      })
    });

    for (const wallet in wash_trading_wallets) {

      console.log(wallet)
      console.log(wash_trading_wallets)

      buyNow_txns.forEach(element => {
        if(element.buyer == wallet && element.seller == wash_trading_wallets[wallet].wallet_2) {
          console.log(wash_trading_wallets[wallet])
          wash_trading_wallets[wallet].vol = wash_trading_wallets[wallet].vol + element.price
          wash_trading_wallets[wallet].txns++
        }
      })
    }

    console.log(wash_trading_wallets);

    return wash_trading_wallets;

  
  } catch (err) {
    console.log(err);
  }
};

const start = async (collection_symbol) => {
  try {
    var matches = {};
    var solTransferWallets = [];
    let token_mint_address = ""
    let creatorWallets = [];
  
    console.log("calling start");
  
    const response = await axios({
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/listings?offset=0&limit=20`
      });
  
    token_mint_address = response.data[0].tokenMint
  
    console.log(`retrieving sample token mint address: ${token_mint_address}`)
  
    // console.log(token_mint_address)
  
    creatorWallets = await getCreatorWallets(token_mint_address);
  
    console.log(`Found creator wallets from token mint address: ${creatorWallets}`);
  
    for (let i = 0; i < creatorWallets.length; i++) {    
      let transfers = await getCreatorTransfers(creatorWallets[i]);
      solTransferWallets = solTransferWallets.concat(transfers)
    }
  
    console.log("sol wallet transfers, index 0: ", solTransferWallets[0]);
  
    var walletTally = await getCollectionBuyTxns(collection_symbol);
  
    console.log("wallet tally :", walletTally);
  
  
    solTransferWallets.forEach(transfer_recipient => {
      for (const wallet in walletTally) {
        if(wallet == transfer_recipient && !(wallet in matches)) {
          matches[wallet] = {
            txns: walletTally[wallet].txns,
            vol: walletTally[wallet].vol
          };
        }
      }
    })
  
    console.log(matches)
    return matches;
  } catch(err) {
    console.log("this the error mfer: ", err);
    return err;
  }


}

// start("magic_stars", "At4e5B4HicbnV1DLa8ChGcBouqPhWMyaAzutwTSxvFjH");

// updateContactData("differentworld");

//input collection name --> it finds the creator wallets --> searches for transfers

const start2 = async (collection_symbol) => {
  try {
  console.log("yee")
  const stuff = await getWallet2WalletTxs(collection_symbol)

  return stuff;
  } catch(err) {
    console.log(err)
  }
}
/*
const start3 = async (collection_symbol) => {
  var matches = {};
  var solTransferWallets = [];
  let token_mint_address = ""
  let creatorWallets = [];
  

  const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/listings?offset=0&limit=20`
    });

  token_mint_address = response.data[0].tokenMint

  // console.log(token_mint_address)

  creatorWallets = await getCreatorWallets(token_mint_address);

  console.log(creatorWallets);

  for (let i = 0; i < creatorWallets.length; i++) {    
    let transfers = await getCreatorTransfers(creatorWallets[i]);
    solTransferWallets = solTransferWallets.concat(transfers)
  }

  console.log("sol wallet transfers: ", solTransferWallets);

  var walletTally = await getCollectionBuyTxns(collection_symbol);

  console.log("wallet tally :", walletTally);


  solTransferWallets.forEach(transfer_recipient => {
    for (const wallet in walletTally) {
      if(wallet == transfer_recipient && !(wallet in matches)) {
        matches[wallet] = true;
      }
    }
  })

  console.log(matches)
  return matches;

}
*/

const startAndSendResultToS3 = async (collection_symbol, uid) => {

  var temp = await start(collection_symbol);

  var obj = temp;

  var buf = Buffer.from(JSON.stringify(obj));

  var data = {
      Bucket: 'detectooor',
      Key: `${collection_symbol}-${uid}.json`,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'application/json',
  };

  s3.upload(data, function (err, data) {
      if (err) {
          console.log(err);
          console.log('Error uploading data: ', data);
      } else {
          console.log('succesfully uploaded!!!');
      }
  });  
}

const retrieveFromS3 = async (fileName) => {
  var params = {
    Bucket: "detectooor", 
    Key: fileName
   };

   s3.getObject(params, function(err, data) {
     if (err) {
       if (err.code == "NoSuchKey")
       res.send({msg: "NoSuchKey"});
     } 
     else {
       var jsonData = JSON.parse(data.Body)
       console.log(jsonData);
       // var jsonData = JSON.parse(data);
     }
   });
}

// startAndSendResultToS3("sakura_cats")

// retrieveFromS3("sakura_cats-blahfuck")


// getCollectionBuyTxns("doodlegenics")
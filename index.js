const express = require('express');
const cors = require('cors');
var axios = require("axios")
var Metaplex = require("@metaplex-foundation/js");
var Solana = require("@solana/web3.js")
const clusterApiUrl = Solana.clusterApiUrl
const connection = new Solana.Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex.Metaplex(connection); 
const PORT = process.env.PORT || 5000
const Delay = require("http-delayed-response")
const { v4: uuidv4 } = require('uuid');
const bodyParser = require("body-parser");
const {MongoClient, ServerApiVersion} = require('mongodb');
const mongoose = require("mongoose");
const SPL = require("@solana/spl-token")
const Anchor = require("@project-serum/anchor")

// Scanooor 

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new Solana.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
const MINT_MANAGER_PROGRAM_ID = new Solana.PublicKey("mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM")

const ocpProgramId = new Solana.PublicKey("ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E");

// MONGO DB
const username = "thugraffes"
const password = "fVLi29iGzwAk92XV"
const cluster = "cluster0.pl9nm"
const dbname = "calendooor";
const mongoURI = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`
const client = new MongoClient(mongoURI);
const database = client.db('calendooor');

    /*
    const reference_example = 
    
    {
      year: 2023,
      hoursOfDay: {
        0: {
          ricky: {
            start_time: 30
          },
          browny: {},
          marko: { end_time: 45 }
        },
        1: {}
      }
    }
*/

var AWS = require("aws-sdk");
AWS.config.update({region: 'us-west-2'});

s3 = new AWS.S3({apiVersion: '2006-03-01'});


const app = express();

app.use(cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// scanooor

app.get('/scanooor/:mintAddress', async (req, res) => {
  try {
      const mintData = await findByMint(new Solana.PublicKey(req.params.mintAddress))

      console.log(mintData)

      res.send(mintData)
  } catch(err) {

    console.log(err)
    res.status(500).json({ message: "Error in invocation of API: /scanooor/:mintAddress" })
  }

});

// scanooor end 

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

app.get('/start2/:collectionSymbol/:timeFrame', async (req, res) => {
  try {
    console.log(req.params)
    console.log("Time frame: ", req.params.timeFrame)
    console.log("Collection symbol: ", req.params.collectionSymbol)

    var body = {}

    body.washTradingWallets = await start2(req.params.collectionSymbol, req.params.timeFrame);

    console.log("body", body)
    res.send(body);

  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /start2" })
  }
});

app.get('/start3/:collectionSymbol/:timeFrame', async (req, res) => {
  try {
    console.log(req.params)

    var body = {}
    var uid = uuidv4();

    startAndSendResultToS3(req.params.collectionSymbol, req.params.timeFrame, uid);

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

app.get('/calendooor/:JSdateOnFirstDayOfWeek', async (req, res) => {
  try {
    console.log("got a request")
    console.log(req.params.JSdateOnFirstDayOfWeek)

    const JSdateOnSunday = parseInt(req.params.JSdateOnFirstDayOfWeek)
    console.log("JSdateOnSunday", JSdateOnSunday)
    const dateOnSunday = new Date(JSdateOnSunday)
    const milisecondsIn24Hours = 86400000;

    const daysOfWeek = []

    // Establish and verify connection
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
    const calendar = database.collection('calendar');

    const scheduleObj = []


    for(let i = -1; i < 8; i++) {
      const JSdateOnWeekDay = JSdateOnSunday + (milisecondsIn24Hours * i)
      console.log("JSdateOnWeekDay", JSdateOnWeekDay)
      const dateOnWeekDay = new Date(JSdateOnWeekDay)
      console.log("dateOnWeekDay", dateOnWeekDay)

      const mongoQueryObj = {
        year: dateOnWeekDay.getUTCFullYear(),
        month: dateOnWeekDay.getUTCMonth(),
        date: dateOnWeekDay.getUTCDate()
      }
      console.log(mongoQueryObj);

      let calendarDoc = await calendar.findOne(mongoQueryObj)
      console.log(calendarDoc)

      if(calendarDoc === null) {
        scheduleObj.push({})
      } else {
        scheduleObj.push(calendarDoc)
      }

    }

    console.log(scheduleObj);

    

    res.send(scheduleObj);

  } catch(err) {
    console.log(err)
    res.status(500).json({ message: "Error in invocation of API: /calendooor" })
  }
});

app.post('/calendooor/addtime', async (req, res) => {
  try {
    console.log(req.body)

    // Establish and verify connection
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");

    const calendar = database.collection('calendar');

    const start_time_hour = parseInt(req.body.start_time_hour)
    const end_time_hour = parseInt(req.body.end_time_hour)
    const start_time_minute = parseInt(req.body.start_time_minute)
    const end_time_minute = parseInt(req.body.end_time_minute)
    const applyChangesTo = req.body.applyChangesTo
    const staff = req.body.staff
    const toggledDays = req.body.toggledDays

    console.log(req.body.toggledDays[0])
    console.log(req.body.toggledDays[1])
    console.log(req.body.toggledDays[req.body.toggledDays-1])

    for(let i = 0; i < req.body.toggledDays.length; i++) {
      console.log(req.body.toggledDays.length)
      const year = req.body.toggledDays[i].year
      const month = req.body.toggledDays[i].month
      const date = req.body.toggledDays[i].date
      

      //find the document matching the year, month, date
      let calendarDoc = await calendar.findOne({ year: year, month: month, date})

      if(calendarDoc === null) {

        calendarDoc = {
          year : year,
          month : month,
          date : date,
          hoursOfDay : {}
        }
      }

      for(let i = 0; i < 24; i++) { if(!(i in calendarDoc.hoursOfDay)) { calendarDoc.hoursOfDay[i] = {} } }

      if(req.body.action === "delete_button") {
        for (const hour in calendarDoc.hoursOfDay) {
          toggledDays[i].hoursOfDay.forEach(function(hourToAdd) {
            delete calendarDoc.hoursOfDay[hourToAdd][staff]
          })
        }
      } else if (req.body.action === "submit_button") {
        for (const hour in calendarDoc.hoursOfDay) {
          toggledDays[i].hoursOfDay.forEach(function(hourToAdd) {
            calendarDoc.hoursOfDay[hourToAdd][staff] = {}
          })
        }
      }

      console.log(typeof calendarDoc)
      console.log(calendarDoc);
      const mongoResult = await calendar.replaceOne({ year: year, month: month, date: date }, calendarDoc, { upsert: true})
      console.log(mongoResult);
      console.log(`Modified ${mongoResult.modifiedCount} document(s)`);

    }

    res.send({ msg: "yesss"})

  } catch(err) {
    console.log(err)
    res.status(500).json({ message: "Error in invocation of API: /calendooor/add_time" })
  }
});

app.listen(PORT, () => console.log(`Example app is listening on port ${PORT}.`));

const getCollectionBuyTxns = async (collection_symbol, beginTime) => {
  
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
        if (element.type === "buyNow" && element.blockTime >= beginTime) {
          if (element.buyer in wallet_tally) {
            wallet_tally[element.buyer].txns++;
            wallet_tally[element.buyer].vol = wallet_tally[element.buyer].vol + element.price
          } else if (!(element.buyer in wallet_tally)) {
            wallet_tally[element.buyer] = {
              txns: 1,
              vol: element.price
            }
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

const getWallet2WalletTxs = async (collection_symbol, beginTime) => {  

  var wash_trading_wallets = {};
  var buyNow_txns = [];
  let offset = 0
  let limit = 1000
  var data_length = 1000;

  try {

    console.log("Begin time:", beginTime)

    while(data_length == limit && offset != 16000) {
      const response = await axios({
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=${offset}&limit=${limit}`
      });

      console.log(beginTime)
      console.log(response.data[0].blockTime)
      console.log(response.data[0].blockTime - beginTime)
      response.data.forEach(element => {
        if(element.type === "buyNow" && element.blockTime >= beginTime) {
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

const start = async (collection_symbol, beginTime) => {
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
  
    var walletTally = await getCollectionBuyTxns(collection_symbol, beginTime);
  
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

const start2 = async (collection_symbol, timeFrame) => {

  const timeNow = Date.now() / 1000
  const minus1hrTime = timeNow - 3600
  const minus6hrsTime = timeNow - 21600
  const minus24hrsTime = timeNow - 86400
  const allTime = 0;
  let beginTime;

  try {
  console.log("Time now: ", timeNow)
  console.log("Time frame: ", timeFrame);
  switch(timeFrame) {
    case "1hr":
      beginTime = minus1hrTime
      break;
    case "6hr":
      beginTime = minus6hrsTime
      break;
    case "24hr":
      beginTime = minus24hrsTime
      break;
    case "all_time":
      beginTime = 0;
      break;
  }  

  console.log("Begin time: ", beginTime);


  const stuff = await getWallet2WalletTxs(collection_symbol, beginTime)

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

const startAndSendResultToS3 = async (collection_symbol, timeFrame, uid) => {

  const timeNow = Date.now() / 1000
  const minus1hrTime = timeNow - 3600
  const minus6hrsTime = timeNow - 21600
  const minus24hrsTime = timeNow - 86400
  const allTime = 0;
  let beginTime;

  switch(timeFrame) {
    case "1hr":
      beginTime = minus1hrTime
      break;
    case "6hr":
      beginTime = minus6hrsTime
      break;
    case "24hr":
      beginTime = minus24hrsTime
      break;
    case "all_time":
      beginTime = 0;
      break;
  }  

  var temp = await start(collection_symbol, beginTime);

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

// Scanooor

async function findByMint(mintAddress) {

  try {

    const data = {}

    console.log(`calling findByMint with ${mintAddress}`)

    const nft = await metaplex.nfts().findByMint({ mintAddress });

    console.log("NFT RIGHT HERE: ", nft);
  
    // OCP Mint State Account
    const mintStatePk = findMintStatePk(mintAddress)
    const mintStateAcc = await getMintStateAccountInfo(mintStatePk);
  
    // Cardinal Labs Mint Manager Account 
    const mintManagerPk = await findCardinalLabsMintManagerPDA(mintAddress)
    const mintManagerAcc = await getMintManagerAccountInfo(mintManagerPk)
  
    if(getOwnerWalletFromMint(mintAddress) != false) {
      const ownerWalletAddress = await getOwnerWalletFromMint(mintAddress)
      console.log("owner wallet: ", ownerWalletAddress)

      const ataOwnerAddress = await getTokenLargestAccounts(mintAddress)

      const associatedTokenAccount = await findAssociatedTokenAddress(nft.tokenStandard === 4 ? ataOwnerAddress : ownerWalletAddress, mintAddress)
  
      console.log("ATA: ", associatedTokenAccount);
  
      const associatedTokenAccountInfo = await getAccountInfo(associatedTokenAccount)
  
      console.log("ATA info", associatedTokenAccountInfo);
    
      data.ownerWallet = ownerWalletAddress.toBase58()
      data.ataAddress = associatedTokenAccount.toBase58()
      data.ataDelegateAddress = associatedTokenAccountInfo.data.parsed.info.delegate === null | associatedTokenAccountInfo.data.parsed.info.delegate === undefined ? null : associatedTokenAccountInfo.data.parsed.info.delegate
      data.ataDelegatedAmount = associatedTokenAccountInfo.data.parsed.info.delegate === null | associatedTokenAccountInfo.data.parsed.info.delegate === undefined ? null : associatedTokenAccountInfo.data.parsed.info.delegatedAmount.amount
      data.ataState = associatedTokenAccountInfo.data.parsed.info.state
      data.ataOwnerAddress = ataOwnerAddress;
  
    }
  
    data.nft = nft
    data.type = nft.model
    data.json = nft.json
    data.updateAuthorityAddress =  nft.updateAuthorityAddress.toBase58()
    data.collection = nft.collection === null ? null : nft.collection.address.toBase58()
    data.collectionVerified = nft.collection === null ? null : nft.collection.verified
    data.collectionDetails = nft.collectionDetails
    data.mintAuthority = nft.mint.mintAuthorityAddress === null | nft.mint.mintAuthorityAddress === undefined ? null : nft.mint.mintAuthorityAddress.toBase58()
    data.freezeAuthority =  nft.mint.freezeAuthorityAddress === null | nft.mint.freezeAuthorityAddress === undefined ? null : nft.mint.freezeAuthorityAddress.toBase58()
    data.decimals = nft.mint.decimals
    data.supply = await nft.mint.supply.basisPoints
    data.sellerFee = nft.sellerFeeBasisPoints
    data.creators = nft.creators
    data.tokenStandard = nft.tokenStandard
    data.metadataAddress = nft.metadataAddress.toBase58()
    data.edition = nft.edition === undefined | nft.edition === null ? null : nft.edition.model
    data.originalEdition = nft.edition === undefined | nft.edition === null ? null : nft.edition.isOriginal
    data.editionAccountAddress = nft.edition === undefined | nft.edition === null ? null : nft.edition.address.toBase58()
    data.editionAccountSupply = nft.edition === undefined | nft.edition === null ? null : await nft.edition.supply
    data.editionAccountMaxSupply = nft.edition === undefined | nft.edition === null ? null : nft.edition.maxSupply
    data.isOCP = mintStateAcc === null? false : true
    data.isCardinal = mintManagerAcc === null ? false: true
    data.isMIP1 = nft.programmableConfig === null | nft.programmableConfig === undefined ? false : true

    console.log(data)
  
    return data;
  
  
  } catch(err) {
    console.log(err)
  }

}

const findMintStatePk = (mint) => {
  return  Solana.PublicKey.findProgramAddressSync(
    [Anchor.utils.bytes.utf8.encode("mint_state"), mint.toBuffer()],
    ocpProgramId
  )[0];

  return mintStatePk;
};

const getMintStateAccountInfo = async (mintStatePk) => {
    const mintStateAcc =  await connection.getAccountInfo(mintStatePk);
    console.log(mintStateAcc);
    return mintStateAcc;
}

const getMintManagerAccountInfo = async (mintManagerPk) => {
  const mintManagerAcc =  await connection.getAccountInfo(mintManagerPk);
  console.log(mintManagerAcc);
  return mintManagerAcc;
}


// const mintStatePk = findMintStatePk(mintAddress)
// const mintStateAcc = getMintStateAccountInfo(mintStatePk);

// findByMint(mintAddress);

async function getAccountInfo(pubKey) {

  const response = await axios({
      method: 'post',
      url: `https://api.mainnet-beta.solana.com`,
      data: {
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getAccountInfo",
          "params": [
            `${pubKey.toString()}`,
            {
              "encoding": "jsonParsed"
            }
          ]
        }
    }) 

    console.log(response.data.result.value);
    //console.log("Token delegate: ", response.data.result.value.data.parsed.info.delegate)
    //console.log("Delegated amount: ", response.data.result.value.data.parsed.info.delegatedAmount.amount)
    // console.log("State of token account: ", response.data.result.value.data.parsed.info.state)

    return response.data.result.value

}



// getAccountInfo(new Solana.PublicKey("JEBA7S7oxHesV1dRLh5d864qY3CSW8qUhWKGsfxJCNgt"));


async function getOwnerWalletFromMint(mintAddress) {
  const response = await axios({
      method: 'get',
      url: `https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress.toString()}`,
    })
    console.log(Object.keys(response.data).length === 0);
    return Object.keys(response.data).length === 0 ? false : new Solana.PublicKey(response.data.owner)

}

async function getTokenLargestAccounts(mintAddress) {

  const connection = new Solana.Connection("https://burned-yolo-night.solana-mainnet.quiknode.pro/895b449661dccbdfbaf12ddef781ae2ac98f800b/");
  const largestAccounts = await connection.getTokenLargestAccounts(mintAddress);
  const largestAccountInfo = await connection.getParsedAccountInfo(largestAccounts.value[0].address);
  console.log(largestAccountInfo.value.data.parsed.info.owner);

  return new Solana.PublicKey(largestAccountInfo.value.data.parsed.info.owner);
}

async function findAssociatedTokenAddress(ownerWallet, tokenMint) {

  const associatedTokenAccount = (await Solana.PublicKey.findProgramAddress(
      [
          ownerWallet.toBuffer(),
          SPL.TOKEN_PROGRAM_ID.toBuffer(),
          tokenMint.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  ))[0];

  console.log(associatedTokenAccount)

  return associatedTokenAccount;

}

async function findCardinalLabsMintManagerPDA(tokenMint) {

  const mintManagerPDA = (await Solana.PublicKey.findProgramAddress(
      [
          Buffer.from('mint-manager'),
          tokenMint.toBuffer(),
      ],
      MINT_MANAGER_PROGRAM_ID
  ))[0];

  console.log(mintManagerPDA)

  return mintManagerPDA;

}

// getOwnerWalletFromMint(mintAddress);

// findAssociatedTokenAddress(walletAddress, mintAddress)

// getAccountInfo(genericAccountTesting);

// findByMint(new Solana.PublicKey("Fu1EVcwZA9vWzbb6hh7g5c5ybhnF9v4q9ywMBSHcxS5n"));

// getAccountInfo(new Solana.PublicKey("FjwKuHn91bYkB6f6YkPKnZWNwcaCFqEnoyyYdKP3C4Py"))


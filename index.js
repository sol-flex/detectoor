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


// start("grifons", "KeZc1o6X5ACdHXWFyVYP6XVtRBhCcczXPKxSCXm7ocS")


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

app.get('/start2/:collectionSymbol', async (req, res) => {
  try {
    console.log(req.params)

    var body = {}

    body.washTradingWallets = await start2(req.params.collectionSymbol);
    body.walletsFundedByCreator = await start(req.params.collectionSymbol);

    console.log("body", body)
    res.send(body);

  } catch(err) {
    res.status(500).json({ message: "Error in invocation of API: /start2" })
  }
});

app.listen(PORT, () => console.log(`Example app is listening on port ${PORT}.`));

const getCollectionBuyTxns = async (collection_symbol) => {
  
  var wallet_tally = {}

  try {

    const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=0&limit=1000`
    });
    console.log(response.data[0].type)
    
    response.data.forEach(element => {
      if (element.type === "buyNow" && element.buyer in wallet_tally) {
        wallet_tally[element.buyer]++
      } else if (element.type === "buyNow" && !(element.buyer in wallet_tally)) {
        
        wallet_tally[element.buyer] = 1
      } 
    });

    console.log(wallet_tally);

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
    console.log()
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

  try {

    while(data_length == limit) {
      const response = await axios({
        method: "get",
        url: `https://public-api.solscan.io/account/solTransfers?account=${royalty_wallet}&limit=${limit}&offset=${offset}`
      });

      data_length = response.data.data.length

      console.log(response.data.data.length)

      response.data.data.forEach(element => {
        solTransfers.push(element.dst)
      })

      offset = offset + 100;
   }

    console.log(solTransfers);
    console.log(solTransfers.length);

    return solTransfers;

  } catch (err) {
    console.log(err)
  }
}

const getWallet2WalletTxs = async (collection_symbol) => {
  
  var wash_trading_wallets = {};
  var buyNow_txns = [];

  try {

    const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=0&limit=1000`
    });
    console.log(response.data[0].type)

    response.data.forEach(element => {
      if(element.type === "buyNow") {
        buyNow_txns.push(element);
      }
    })

    buyNow_txns.forEach(element => {
      buyNow_txns.forEach(element_1 => {
        if(element.buyer === element_1.seller && element.seller === element_1.buyer) {
          if(!(element.buyer in wash_trading_wallets)) {
            wash_trading_wallets[element.buyer] = element.seller
          }
        }
      })
    });

    console.log(wash_trading_wallets);

    return wash_trading_wallets;

  
  } catch (err) {
    console.log(err);
  }
};

const start = async (collection_symbol) => {
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

// start("magic_stars", "At4e5B4HicbnV1DLa8ChGcBouqPhWMyaAzutwTSxvFjH");

// updateContactData("differentworld");

//input collection name --> it finds the creator wallets --> searches for transfers

const start2 = async (collection_symbol) => {
  console.log("yee")
  const stuff = await getWallet2WalletTxs(collection_symbol)

  return stuff;

}

start("grifons")



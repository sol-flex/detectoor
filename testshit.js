var axios = require("axios")
var Metaplex = require("@metaplex-foundation/js");
var Solana = require("@solana/web3.js")

const Connection = Solana.Connection
const clusterApiUrl = Solana.clusterApiUrl


const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex.Metaplex(connection);

const fs = require('fs');
const csvParser = require('csv-parser');

const filePath = "./dust_city_creator_transfers.csv"

const getCollectionBuyTxns = async (collection_symbol) => {
  
  var wallet_tally = {}

  try {

    const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=16000&limit=1000`
    });

    console.log(response.data.length)
    
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

const getCollectionBuyTxnsAll = async (collection_symbol) => {
  
  var wallet_tally = {}
  var limit = 1000;
  var data_length = 1000
  var offset = 0


  try {

    while(data_length == limit && offset != 16000) {
      const response = await axios({
        method: "get",
        headers: {
          'Authorization': "Bearer c4c1c0a6-a554-4fe6-9d1a-396e553cc4b7"
        },
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=${offset}&limit=1000`
      });
      console.log(response.data.length)
      data_length = response.data.length

      response.data.forEach(element => {
        if (element.type === "buyNow" && element.buyer in wallet_tally) {
          wallet_tally[element.buyer]++
        } else if (element.type === "buyNow" && !(element.buyer in wallet_tally)) {
          wallet_tally[element.buyer] = 1
        } 
      });

      offset = offset + 1000;

    }
    

    console.log(wallet_tally);

    return wallet_tally;

  
  } catch (err) {
    console.log(err);
  }
};


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

const getWallet2WalletTxsAll = async (collection_symbol) => {
  
  var wash_trading_wallets = {};
  var buyNow_txns = [];
  var limit = 1000;
  var data_length = 1000
  var offset = 0


  try {

    while(data_length == limit && offset != 16000) {
      const response = await axios({
        method: "get",
        headers: {
          'Authorization': "Bearer c4c1c0a6-a554-4fe6-9d1a-396e553cc4b7"
        },
        url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=${offset}&limit=1000`
      });
      console.log(response.data.length)
      data_length = response.data.length

      response.data.forEach(element => {
        if(element.type === "buyNow") {
          buyNow_txns.push(element);
        }
      })

      offset = offset + 1000;

    }
    
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

const getCreatorTransfers2 = async (collection_symbol) => {

  var offset = 0;
  var limit = 100;
  var solTransfers = []
  var data_length = 100;

  try {

    const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=0&limit=1`
    });

    const token_mint_address = response.data[0].tokenMint

    console.log(response);

    const mint_data = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/tokens/${token_mint_address}`
    });

    console.log(mint_data.data.properties.creators) // this is an array of royalty addresses

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

const start = async (collection_symbol) => {
  var matches = {};
  var solTransferWallets = [];

  const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=0&limit=100`
    });

  let i = 0;
  let token_mint_address = response.data[i].tokenMint

  // console.log(token_mint_address)

  let mint_data = {
    data: {}
  };
  let found = false;

  while(Object.keys(mint_data.data).length == 0 || found == false) {
    mint_data = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/tokens/${token_mint_address}` //change this to variable
    });

    i++;

    if(Object.keys(mint_data.data).length != 0) {
      if("creators" in mint_data.data.properties) {
        found = true;
      }
    }
     
  }

  // console.log(mint_data.data.properties.creators)

  // console.log(mint_data.data.properties.creators) // this is an array of royalty addresses [0].address

  for (let i = 0; i < mint_data.data.properties.creators.length; i++) {
    console.log(mint_data.data.properties.creators)
    let transfers = await getCreatorTransfers(mint_data.data.properties.creators[i].address);
    console.log("trasfers length", transfers[0])
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

// start("pengoo_ai", "43NfTJqiTNFYhUugeSQszwxTqz2YbYWQMc87z75JQwaC");

// updateContactData("differentworld");

//input collection name --> it finds the creator wallets --> searches for transfers

const start2 = (collection_symbol) => {
  console.log("yee")
  getCollectionBuyTxnsAll(collection_symbol)
}

// getCreatorTransfers2("secret_skeletons");

// start("sonic_sniper_bot")

const getCreatorWallets = async () => {
  let creatorWallets = []
  const mintAddress = new Solana.PublicKey("GZj1ZZL81iAgbwddDmRScaGEpzq1z3okU3AogPLtiRVx");

  const nft = await metaplex.nfts().findByMint({ mintAddress });

  for (let i = 0; i < nft.creators.length; i++) {
    console.log()
    creatorWallets.push(nft.creators[i].address.toBase58())
  }
  console.log(creatorWallets)
  return creatorWallets;
}

const findCommonFundingSources = async (wallets) => {

  let solTransfers = {}

  try {

    for (let i = 0; i < wallets.length; i++) {

      let offset = 0;
      let limit = 100;
      let data_length = 100;
      let walletsToAdd = {};
      let max_pages = 7;
      let page = 0;

      //&& page != max_pages <- add this into the condition below if running into timeouts 

      while(data_length == limit && page != max_pages) {
        const response = await axios({
          method: "get",
          url: `https://public-api.solscan.io/account/solTransfers?account=${wallets[i]}&limit=${limit}&offset=${offset}`
        });

        data_length = response.data.data.length

        console.log(`[${i}]: ${wallets[i]}`, response.data.data.length)

        response.data.data.forEach(element => {
          if(element.src != wallets[i] && !(element.src in walletsToAdd)) {
            walletsToAdd[element.src] = wallets[i];
          }
        })

        offset = offset + 100;
        page++;
     }

     console.log(`${wallets[i]}: `, walletsToAdd);

      for (const wallet in walletsToAdd) {
        if(wallet in solTransfers) {
          solTransfers[wallet].count++;
          solTransfers[wallet].wallets_funded.push(walletsToAdd[wallet])
        } else {
          solTransfers[wallet] = { count: 1, wallets_funded: [walletsToAdd[wallet]] }
        }
      }

      walletsToAdd = {};
      offset = 0;


    }

    console.log(`Wallets funding buyers: `, solTransfers);

  } catch(err) {
    console.log(err);
  }

}

const washywashy = async () => {
  var wallets = await getCollectionBuyTxns("sol_city_gen_2");
  console.log(Object.keys(wallets).length)
  findCommonFundingSources(Object.keys(wallets));
}

const getCreatorTransfersFromCSV = async () => {
  let transferWallets = []

  fs.createReadStream(filePath)
      .on('error', () => {
          console.log("Error");
      })

      .pipe(csvParser())
      .on('data', (row) => {

        transferWallets.push(row["                        SolTransfer Destination"])

      })

      .on('end', () => {
        console.log("file finished reading")
        console.log(transferWallets.length)
        return transferWallets;
      })
  }

// washywashy();

const getNFT = async () => {

const mintAddress = new Solana.PublicKey("FULsjDzKCyb83jERvzDbtJLo55ynckTtvgsBZpShNdEQ");

const nft = await metaplex.nfts().findByMint({ mintAddress });

console.log(nft)

console.log(nft.mint.freezeAuthorityAddress.toBase58());

}

// getNFT();

//getCreatorTransfersFromCSV();

const start3 = async (collection_symbol) => {
  var matches = {};
  var solTransferWallets = [];
  let token_mint_address = ""
  let creatorWallets = [];

  let transferWallets = []

  fs.createReadStream(filePath)
      .on('error', () => {
          console.log("Error");
      })

      .pipe(csvParser())
      .on('data', (row) => {

        transferWallets.push(row["                        SolTransfer Destination"])

      })

      .on('end', async () => {
        console.log("file finished reading")
        console.log(transferWallets.length)
        
        solTransferWallets = transferWallets;
        console.log(solTransferWallets)

        var walletTally = await getCollectionBuyTxnsAll(collection_symbol);
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

      })

}

const getPercentNewWallets = async (collection_symbol) => {
  
  var wallet_tally = {}
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
        if (element.type === "buyNow" && element.buyer in wallet_tally) {
          wallet_tally[element.buyer].numTxns++
        } else if (element.type === "buyNow" && !(element.buyer in wallet_tally)) {
          
          wallet_tally[element.buyer] = { numTxns: 1 }
        } 
      });

      console.log(response.data[0])
      console.log(response.data.length)
      data_length = response.data.length

      offset = offset + 1000;

    }

    console.log(wallet_tally);

    for (const wallet in wallet_tally) {
      let walletActivities = await getWalletActivities(wallet)
      let earliestTxn = walletActivities[walletActivities.length-1].blockTime
      console.log(walletActivities[walletActivities.length-1])
      console.log(earliestTxn)
      console.log(earliestTxn)
      if(earliestTxn >= Date.now() - 259200) {
        wallet_tally[wallet].newWallet = true
        console.log(wallet_tally[wallet])
      } else {
        wallet_tally[wallet].newWallet = false
        console.log(wallet_tally[wallet])
      }
    }

    console.log(wallet_tally);
    return wallet_tally


  
  } catch (err) {
    console.log(err);
  }
};

const getWalletActivities = async (wallet) => {

  let walletActivities = [];

  try {
    let offset = 0
    let limit = 500
    var data_length = 500;

    while(data_length == limit && offset != 15500) {
      const response = await axios({
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/wallets/${wallet}/activities?offset=${offset}&limit=500`
      });

      console.log(response.data[0].blockTime)
      console.log(response.data.length)
      data_length = response.data.length

      walletActivities = walletActivities.concat(response.data)

      offset = offset + 500;

    }

    console.log(walletActivities.length)
    console.log(walletActivities.length-1)
    return walletActivities;

  } catch(err) {
    console.log(err);
  }
}

console.log(Date.now());

getPercentNewWallets("justbears")

// getWalletActivities("2cTsA8sEz25Bm5vgdKKddKCa4Vs7KycyJGAqZBxcg74n")
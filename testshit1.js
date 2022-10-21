var axios = require("axios")

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

const start = async (collection_symbol, royalty_wallet) => {
  var matches = {};
  var solTransferWallets = await getCreatorTransfers(royalty_wallet);
  var walletTally = await getCollectionBuyTxns(collection_symbol);

  console.log("wallet tally: ", walletTally);
  console.log("SOL Transfer Wallets: ", solTransferWallets)

  solTransferWallets.forEach(transfer_recipient => {
    for (const wallet in walletTally) {
      if(wallet == transfer_recipient && !(wallet in matches)) {
        matches[wallet] = true;
      }
    }
  })

  console.log("matches: ", matches)
  return matches;

}

start("sonic_sniper_bot", "8RFv5zBY9KzqrkbzJGd7F34basUYKKcD7aGG3e8H4HdG");

// updateContactData("differentworld");

//input collection name --> it finds the creator wallets --> searches for transfers

const start2 = async (collection_symbol) => {
  console.log("yee")
  const stuff = await getWallet2WalletTxs(collection_symbol)

  return stuff;

}
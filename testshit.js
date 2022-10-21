var axios = require("axios")
var Metaplex = require("@metaplex-foundation/js");
var Solana = require("@solana/web3.js")

const Connection = Solana.Connection
const clusterApiUrl = Solana.clusterApiUrl


const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex.Metaplex(connection);


const getCollectionBuyTxns = async (collection_symbol) => {
  
  var wallet_tally = {}

  try {

    const response = await axios({
      method: "get",
      url: `https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/activities?offset=0&limit=1000`
    });

    console.log(response.data[0].tokenMint)
    
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
  getWallet2WalletTxs(collection_symbol)
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

getCreatorWallets();






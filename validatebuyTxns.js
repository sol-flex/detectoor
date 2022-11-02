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

const validateBuyTxnVol = async (collection_symbol, buyer_wallet, seller_wallet) => {
  
  var test_results = {
  	buyer: buyer_wallet,
  	seller: seller_wallet,
  	volume: 0
  };

  var buyNow_txns = [];
  let offset = 0
  let limit = 1000
  var data_length = 1000;

  try {

    while(data_length == limit) {
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

      offset = offset + 100;

    }

    buyNow_txns.forEach(element => {
    	if (element.type === "buyNow" && element.buyer == buyer_wallet && element.seller == seller_wallet) {
    		test_results.volume = test_results.volume + element.price
    	}
    })

    
    console.log(test_results)
    return test_results;

  
  } catch (err) {
    console.log(err);
  }
};

validateBuyTxnVol("narcoverse_nerhala", "7W2TTRVkjp48xS2Upn4UvhyT21AWtu6NcWPunr72yM6S", "E7o8hqykRNzvzZSyiqoWSWWu5j8cKTWTT4QhJEPUzfC")

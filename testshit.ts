var axios = require("axios")


const updateContactData = async (wallet_address) => {
  try {
    const response = await axios({
      method: "get",
      url: `api-devnet.magiceden.dev/v2/wallets/${wallet_address}/activities?offset=0&limit=500`

    });

    console.log(response)
    console.log(response.data.custom_attributes)

  } catch (err) {
    console.log(err);
  }
};

updateContactData("3JyRiBSiDKFe65GCKPndYzD4i7tZWmU4ofRbnXaFkmYs");
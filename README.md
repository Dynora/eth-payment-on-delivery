# Ethereum Payment on Delivery

Still work in progress, but to set up the project:

## Truffle

- Install Truffle: `npm install -g truffle`
- In de `./truffle` folder install dependencies: `npm install`
- Compile the smart contract: `truffle compile`
- Enter a BIP39 mnemonic (for example the one you will create with MetaMask later) in `truffle/truffle.js`
- Deploy the smart contract to the network of your choice: `truffle migrate --network rinkeby`


## Ionic App

- Install requirements by running `npm install` in de `app` folder.
- Create a `local-mnemonic.json` file with a BIP39 mnemonic e.g.: `{"mnemonic": "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"}`
- Run `ionic serve` in de `app` folder. Navigate to `http://localhost:8100/`. The app will automatically reload if you change any of the source files.



## Shop / Merchant admin

- In `./backend` folder and in a Python 3 virtualenv install requirements: `pip install -r requirements.txt`
- In `./backend/paymentchannels` folder create a `local_settings.py` file to overwrite at least:
  - ETH_MERCHANT_ADDRESS
  - ETH_MERCHANT_PRIVATE_KEY
  - ETH_CONTRACT_ADDRESS
  - ETH_CURRENT_NETWORK (depending on which network you are currently working on)

- Create the tables: `./manage.py migrate`
- Start Django dev server: `./manage.py runserver`

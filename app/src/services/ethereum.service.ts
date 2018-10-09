import {Injectable} from '@angular/core';

const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = require('../../../local-mnemonic.json').mnemonic;

export enum messages {
    NOT_AVAILABLE = 'Ethereum provider not available.',
    ACCOUNT_RETRIEVAL_FAILED = 'There was an error retrieving your accounts.',
    NO_ACCOUNTS_AVAILABLE = 'Could not retrieve any accounts, is MetaMask unlocked?'
}


@Injectable()
export class EthereumService {

    provider: any;

    currentNetwerk: string;

    constructor() {

      //this.provider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
      //this.provider = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/'))

        if ( (<any>window).web3 !== undefined) {
            // Use Mist/MetaMask's provider
            this.provider = new Web3((<any>window).web3.currentProvider);

            if (this.provider.version.network === '1') {
                alert('Attention: You are connected to Ethereum Mainnet'); // TODO: temporary
            }
        } else {
            //alert('Please use a dapp browser like mist or MetaMask plugin for Chrome'); // TODO: temporary
            //this.provider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            //this.provider = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/'))
            //this.provider = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws'));
            this.provider = new Web3(new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/", 0, 5));

            //this.provider.eth.defaultAccount = "0x280099201f6b6778cb2C27A8259fb88E40954662";
            //this.provider.personal.unlockAccount(this.provider.eth.defaultAccount);
        }
    }


    getAccounts(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (!this.provider) {
                reject(messages.NOT_AVAILABLE);
                return;
            }

            this.provider.eth.getAccounts((error, accounts) => {
                console.log('accounts', accounts);
                if (error !== null) {
                    reject(messages.ACCOUNT_RETRIEVAL_FAILED);
                    return;
                }

                if (accounts.length === 0) {
                    reject(messages.NO_ACCOUNTS_AVAILABLE);
                    return;
                }

                resolve(accounts);
            });
        });
    }


    getBalance(account): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.provider) {
                reject(messages.NOT_AVAILABLE);
                return;
            }

            this.provider.eth.getBalance(account, (error: string, balance: number) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(this.fromWei(balance));
                }
            });
        });
    }


    getTransactionCount(account): Promise<number> {
        return new Promise((resolve, reject) => {
            this.provider.eth.getTransactionCount(account, (error: string, count: number) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(count);
                }
            });
        });
    }


    fromWei(amount: number): number {
        return this.provider.fromWei(amount); // amount.toString()
    }


    toWei(amount: number): number {
      console.log(this.provider.utils);
        return this.provider.toWei(amount.toString ? amount.toString() : '0');
    }


    toAscii(value: any): string {
        return this.provider.utils.toAscii(value);
    }
}

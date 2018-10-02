import {Injectable} from '@angular/core';

//import {LocalStorageService} from 'angular-2-local-storage';

import {AccountService} from './account.service';
import {EthereumService} from './ethereum.service';
import {debugLog, isDefined} from "../../../src/app/core/util/helpers.util";
import {Delivery} from "../classes/delivery.class";

const contract = require('truffle-contract');
const paymentOnDeliveryArtifacts = require('../../../build/contracts/PaymentOnDelivery.json');


export enum messages {
    INCORRECT_MOVES = 'Incorrect moves',
    NO_MOVES_FOUND = 'Cannot find moves in local storage to match signature'
}


@Injectable()
export class PaymentOnDeliveryService {
    PaymentOnDelivery = contract(paymentOnDeliveryArtifacts);

    fee: number;

    constructor(private ethereum: EthereumService,
                private accountService: AccountService) {
        this.PaymentOnDelivery.setProvider(this.ethereum.provider.currentProvider);
    }

    async getCustomerDeliveries(address: string): Promise<string>  {
      const instance = await this.PaymentOnDelivery.deployed();
      return instance.getCustomerDeliveries(address);
    }

    async getMerchantDeliveries(address: string): Promise<string>  {
      const instance = await this.PaymentOnDelivery.deployed();
      return instance.getMerchantDeliveries(address);
    }

    async signData(data): Promise<string> {
        const account = await this.accountService.getAccount();

        const signature = await new Promise((resolve, reject) => {
            this.ethereum.provider.currentProvider.sendAsync({
                method: 'eth_signTypedData',
                params: [data, account]
            }, function (err, result) {
                if (result.error) {
                    reject(result.error);
                } else {
                    resolve(result.result);
                }
            });
        }) as string;

        return signature;
    }


    async createReleaseCode(delivery: Delivery): Promise<string> {
      const messageData = [
          {
              'type': 'string',
              'name': 'description',
              'value': 'Approved amount signature'
          },
          {
              'type': 'bytes32',
              'name': 'delivery_id',
              'value': delivery.deliveryId
          },
          {
              'type': 'uint',
              'name': 'value',
              'value': this.ethereum.toWei(delivery.deposit),
          }
      ];
      return this.signData(messageData);
    }

    async createDelivery(merchant: string, amount: number): Promise<string> {
        const instance = await this.PaymentOnDelivery.deployed();

        const account = await this.accountService.getAccount().catch((reason: string) => console.log(reason));


        // console.log('test',instance.createDelivery(merchant, 3600).buildTransaction({
        //     from: account,
        //     value: this.ethereum.toWei(amount)
        // }));

        const result = await instance.createDelivery(merchant, 3600, {
            from: account,
            value: this.ethereum.toWei(amount),
            gasLimit: 4700000
        });


        console.log('result', result);

        const deliveryId = result.logs[0].args.deliveryId;

        return deliveryId;
    }

    async refundDelivery(delivery: Delivery): Promise<string> {
        const instance = await this.PaymentOnDelivery.deployed();
        const account = await this.accountService.getAccount();

        const result = await instance.timeoutDelivery(delivery.deliveryId, {
            from: account
        });

        //debugLog(result);

        return result.tx;
    }

    async settleDelivery(delivery: Delivery, signature: string): Promise<string> {
        const instance = await this.PaymentOnDelivery.deployed();
        const account = await this.accountService.getAccount();

        const result = await instance.settleDelivery(delivery.deliveryId, 0, signature, {
            from: account,
            gasLimit: 4700000
        });

        //debugLog(result);

        return result.tx;
    }

    async getDelivery(deliveryId: string): Promise<Delivery> {
        const instance = await this.PaymentOnDelivery.deployed();
        const account = await this.accountService.getAccount();

        const customer = await instance.getDeliveryCustomer(deliveryId, {from: account});

        if (customer === '0x0000000000000000000000000000000000000000') {
            return null;
        }

        const merchant = await instance.getDeliveryMerchant(deliveryId, {from: account});
        const deposit = await instance.getDeliveryDeposit(deliveryId, {from: account});
        const timeout = await instance.getDeliveryTimeout(deliveryId, {from: account});
        const active = await instance.getDeliveryActive(deliveryId, {from: account});


        return {
            deliveryId: deliveryId,
            customer: customer,
            merchant: merchant,
            deposit: this.ethereum.fromWei(deposit.toString()),
            timeoutTimestamp: new Date(timeout.toNumber() * 1000),
            active: active
        };
    }
}

import {Injectable} from '@angular/core';
import {EthereumService, messages as ethereumMessages} from './ethereum.service';
import {MessageService} from './message.service';


@Injectable()
export class AccountService {

    private account: string;
    private currentAccountIndex: number;

    constructor(private ethereum: EthereumService,
                private messageService: MessageService) {
      this.currentAccountIndex = 0;
    }


    getAccount(useCache: boolean = true): Promise<string> {
        this.clearGetAccountErrors();

        return new Promise<string>((resolve, reject) => {
            if (!useCache || !this.account) {
                this.ethereum.getAccounts()
                    .then((accounts: string[]) => {

                            this.account = accounts[this.currentAccountIndex].toLowerCase();
                            console.log('Current account', this.account);
                            resolve(this.account);
                        },
                        (error: string) => {
                            this.messageService.error(error);
                            alert(error);
                            reject();
                        });
            } else {
                console.log('Cached account', this.account);
                resolve(this.account);
            }
        });
    }


    clearAccountCache() {
      this.account = null;
    }

    async getAccountBalance(account: string): Promise<number> {
        const balance = await this.ethereum.getBalance(account)
            .catch((error: string) => this.messageService.error(error));

        return balance ? balance : 0;
    }


    async getAccountTransactionCount(account: string): Promise<number> {
        const count = await this.ethereum.getTransactionCount(account);

        return count ? count : 0;
    }


    private clearGetAccountErrors(): void {
        this.messageService.clear(ethereumMessages.ACCOUNT_RETRIEVAL_FAILED);
        this.messageService.clear(ethereumMessages.NO_ACCOUNTS_AVAILABLE);
        this.messageService.clear(ethereumMessages.NOT_AVAILABLE);
    }
}

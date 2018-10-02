import {Injectable} from '@angular/core';
import {EthereumService, messages as ethereumMessages} from './ethereum.service';
import {MessageService} from './message.service';


@Injectable()
export class AccountService {

    private account: string;

    constructor(private ethereum: EthereumService,
                private messageService: MessageService) {
    }


    getAccount(useCache: boolean = true): Promise<string> {
        this.clearGetAccountErrors();

        return new Promise<string>((resolve, reject) => {
            if (!useCache || !this.account) {
                this.ethereum.getAccounts()
                    .then((account: string) => {
                            this.account = account;
                            resolve(this.account);
                        },
                        (error: string) => {
                            this.messageService.error(error);
                            alert(error);
                            reject();
                        });
            } else {
                resolve(this.account);
            }
        });
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

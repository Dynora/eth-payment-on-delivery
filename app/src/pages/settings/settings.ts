import {Component, OnInit} from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {EthereumService} from "../../services/ethereum.service";
import {AccountService} from "../../services/account.service";

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage implements OnInit {

  accounts: string[];
  currentNetwork: string;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private ethereum: EthereumService, private accountService: AccountService,) {
    this.currentNetwork = 'rinkeby';
  }

  public save() {
    this.accountService.clearAccountCache();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  public ngOnInit() {
    this.ethereum.getAccounts().then( accounts => this.accounts = accounts);
  }

}

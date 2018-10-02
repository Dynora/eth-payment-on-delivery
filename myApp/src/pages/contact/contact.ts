import { Component } from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  releaseCode: string;
  qrCodeData: string;

  constructor(public navCtrl: NavController, public viewCtrl: ViewController, public params: NavParams) {
    this.releaseCode = this.params.get('releaseCode');
    this.qrCodeData = '{"deliveryId": "' + this.params.get('deliveryId') + '", "amount": ' + this.params.get('amount') + ', "signature": "' + this.releaseCode + '"}';
  }

  public dismiss() {
    this.viewCtrl.dismiss();
  }

}

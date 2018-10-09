import {AccountService} from "../../services/account.service";
import {AlertController, ModalController, NavParams, Platform, ViewController} from 'ionic-angular';

declare let require: any;
import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
//const scanner = require('QRScanner');
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import * as TruffleContract from 'truffle-contract';
import {PaymentOnDeliveryService} from "../../services/paymentOnDeliveryService";
import {Delivery} from "../../classes/delivery.class";
import {ContactPage} from "../contact/contact";


@Component({
  selector: 'page-deliveries',
  templateUrl: 'deliveries.html'
})
export class DeliveriesPage implements OnInit {

  merchantAddress: string;
  priceAmount: number;

  customerDeliveries: Delivery[] = [];
  merchantDeliveries: Delivery[] = [];

  type: string = 'create';
  currentDate: Date;

  constructor(public navCtrl: NavController, private qrScanner: QRScanner, private deliveryService: PaymentOnDeliveryService,
                private accountService: AccountService, private alertCtrl: AlertController, public modalCtrl: ModalController) {

  }

  public createDelivery() {
    this.deliveryService.createDelivery(this.merchantAddress, this.priceAmount).then(
      (deliveryId) => {

          this.refreshDatasets();

          let alert = this.alertCtrl.create({
            title: 'Delivery created',
            subTitle: 'Delivery created with id: ' + deliveryId,
            buttons: ['Dismiss']
          });
          alert.present();

      }
    ).catch((reason) => {
        let alert = this.alertCtrl.create({
            title: 'Transaction cancelled',
            subTitle: reason,
            buttons: ['Dismiss']
          });
          alert.present();
    });

  }

  public createReleaseCode(delivery: Delivery) {
    this.deliveryService.createReleaseCode(delivery).then(releaseCode => {
      console.log('release code', releaseCode);
      let modal = this.modalCtrl.create(ContactPage, {
        releaseCode: releaseCode,
        deliveryId: delivery.deliveryId,
        amount: delivery.deposit
      });
      modal.present();
    });
  }

  public refund(delivery: Delivery) {
    this.deliveryService.refundDelivery(delivery).then( result => {
          let alert = this.alertCtrl.create({
            title: 'Payment refunded',
            subTitle: 'Payment refunded to customer',
            buttons: ['Dismiss']
          });
          alert.present();
          this.refreshDatasets();
      }
    ).catch((reason) => {
        let alert = this.alertCtrl.create({
            title: 'Transaction cancelled',
            subTitle: 'Transaction cancelled',
            buttons: ['Dismiss']
          });
          alert.present();
    });
  }

  public settlePayment(delivery: Delivery) {
    let alert = this.alertCtrl.create({
      title: 'Settle payment',
      subTitle: 'Enter release code to settle payment',
      inputs: [
        {
          name: 'releaseCode',
          placeholder: 'Release code'
        },
      ],
      buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: data => {

        }
      },
      {
        text: 'Create',
        handler: data => {

          this.deliveryService.settleDelivery(delivery, data.releaseCode).then( value => {
            let alert = this.alertCtrl.create({
              title: 'Delivery settled',
              subTitle: 'Deposit transferred to merchant',
              buttons: ['Dismiss']
            });
            alert.present();
            this.refreshDatasets();
          }).catch((reason) => {
              let alert = this.alertCtrl.create({
                  title: 'Transaction cancelled',
                  subTitle: 'Transaction cancelled',
                  buttons: ['Dismiss']
                });
                alert.present();
          });
        }
      }
    ]
    });
    alert.present().then( value => {

    });
  }

  public refreshDatasets() {

    this.accountService.getAccount(false).then((account: string) => {

      this.deliveryService.getCustomerDeliveries(account).then(deliveryIds => {

        this.customerDeliveries = [];

        for (const deliveryId of deliveryIds) {
          this.deliveryService.getDelivery(deliveryId).then(delivery => {
            this.customerDeliveries.push(delivery);
            console.log(delivery);
          });
        }
      });

      this.deliveryService.getMerchantDeliveries(account).then(deliveryIds => {

        this.merchantDeliveries = [];

        for (const deliveryId of deliveryIds) {
          this.deliveryService.getDelivery(deliveryId).then(delivery => {
            this.merchantDeliveries.push(delivery);
            console.log(delivery);
          });
        }
      });
    });
  }

  public ngOnInit() {

    this.currentDate = new Date();

    this.refreshDatasets();

    this.merchantAddress = '0x81fdd97d73261e6e40cbc248200cca850fb571f6';
    this.priceAmount = 1;




    //this.accountService.getAccount().then( account => alert(account));




    // Optionally request the permission early
  // this.qrScanner.prepare()
  //   .then((status: QRScannerStatus) => {
  //      if (status.authorized) {
  //        // camera permission was granted
  //
  //
  //        // start scanning
  //        let scanSub = this.qrScanner.scan().subscribe((text: string) => {
  //          console.log('Scanned something', text);
  //
  //          this.qrScanner.hide(); // hide camera preview
  //          scanSub.unsubscribe(); // stop scanning
  //        });
  //
  //      } else if (status.denied) {
  //        // camera permission was permanently denied
  //        // you must use QRScanner.openSettings() method to guide the user to the settings page
  //        // then they can grant the permission from there
  //      } else {
  //        // permission was denied, but not permanently. You can ask for permission again at a later time.
  //      }
  //   })
  //   .catch((e: any) => console.log('Error is', e));
  }
}

// export class ModalContentPage {
//   character;
//
//   constructor(
//     public platform: Platform,
//     public params: NavParams,
//     public viewCtrl: ViewController
//   ) {
//     var characters = [
//       {
//         name: 'Gollum',
//         quote: 'Sneaky little hobbitses!',
//         image: 'assets/img/avatar-gollum.jpg',
//         items: [
//           { title: 'Race', note: 'Hobbit' },
//           { title: 'Culture', note: 'River Folk' },
//           { title: 'Alter Ego', note: 'Smeagol' }
//         ]
//       },
//       {
//         name: 'Frodo',
//         quote: 'Go back, Sam! I\'m going to Mordor alone!',
//         image: 'assets/img/avatar-frodo.jpg',
//         items: [
//           { title: 'Race', note: 'Hobbit' },
//           { title: 'Culture', note: 'Shire Folk' },
//           { title: 'Weapon', note: 'Sting' }
//         ]
//       },
//       {
//         name: 'Samwise Gamgee',
//         quote: 'What we need is a few good taters.',
//         image: 'assets/img/avatar-samwise.jpg',
//         items: [
//           { title: 'Race', note: 'Hobbit' },
//           { title: 'Culture', note: 'Shire Folk' },
//           { title: 'Nickname', note: 'Sam' }
//         ]
//       }
//     ];
//     this.character = characters[this.params.get('charNum')];
//   }
//
//   dismiss() {
//     this.viewCtrl.dismiss();
//   }
// }

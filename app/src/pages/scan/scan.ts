import { Component } from '@angular/core';
import {AlertController, NavController} from 'ionic-angular';
import {QRScanner, QRScannerStatus} from "@ionic-native/qr-scanner";
import {PaymentOnDeliveryService} from "../../services/paymentOnDeliveryService";
import {AccountService} from "../../services/account.service";

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html'
})
export class ScanPage {

  scanning: boolean = false;
  scanSub: any;

  constructor(public navCtrl: NavController, private qrScanner: QRScanner, private deliveryService: PaymentOnDeliveryService,
                private accountService: AccountService, private alertCtrl: AlertController) {

  }

  public scanReleaseCode() {

    this.scanning = true;

    this.qrScanner.prepare()
    .then((status: QRScannerStatus) => {
       if (status.authorized) {
         // camera permission was granted


         // start scanning
         (window.document.querySelector('ion-app') as HTMLElement).classList.add('cameraView');
         this.qrScanner.show();

         this.scanSub = this.qrScanner.scan().subscribe((text: string) => {
           console.log('Scanned something', text);


           try {
             const releaseCode = JSON.parse(text);


             console.log('Delivery ID', releaseCode.deliveryId);
             console.log('signature', releaseCode.signature);

             // Get delivery
             this.deliveryService.getDelivery(releaseCode.deliveryId).then(delivery => {
               this.deliveryService.settleDelivery(delivery, releaseCode.signature).then(value => {
                 let alert = this.alertCtrl.create({
                   title: 'Delivery settled',
                   subTitle: 'Deposit transferred to merchant',
                   buttons: ['Dismiss']
                 });
                 alert.present();

               }).catch((reason) => {
                 let alert = this.alertCtrl.create({
                   title: 'Transaction cancelled',
                   subTitle: reason,
                   buttons: ['Dismiss']
                 });
                 alert.present();
               });
             });
           } catch(e) {

           }


           (window.document.querySelector('ion-app') as HTMLElement).classList.remove('cameraView');
           this.scanning = false;
           this.qrScanner.hide(); // hide camera preview
           this.scanSub.unsubscribe(); // stop scanning
         });

       } else if (status.denied) {
         // camera permission was permanently denied
         // you must use QRScanner.openSettings() method to guide the user to the settings page
         // then they can grant the permission from there
       } else {
         // permission was denied, but not permanently. You can ask for permission again at a later time.
       }
    })
    .catch((e: any) => console.log('Error is', e));

  }

  public stopScanning() {

    this.scanning = false;
    (window.document.querySelector('ion-app') as HTMLElement).classList.remove('cameraView');
     this.qrScanner.hide(); // hide camera preview
      if (this.scanSub) {
        this.scanSub.unsubscribe(); // stop scanning
      }
  }

}

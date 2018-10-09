import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { ScanPage } from '../pages/scan/scan';
import { ContactPage } from '../pages/contact/contact';
import { DeliveriesPage } from '../pages/deliveries/deliveries';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { QRScanner } from '@ionic-native/qr-scanner';
import { EthcontractProvider } from '../providers/ethcontract/ethcontract';
import {EthereumService} from "../services/ethereum.service";
import {AccountService} from "../services/account.service";
import {PaymentOnDeliveryService} from "../services/paymentOnDeliveryService";
import {MessageService} from "../services/message.service";
import {QRCodeModule} from "angularx-qrcode";
import {SettingsPage} from "../pages/settings/settings";


@NgModule({
  declarations: [
    MyApp,
    ScanPage,
    ContactPage,
    DeliveriesPage,
    TabsPage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    QRCodeModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ScanPage,
    ContactPage,
    DeliveriesPage,
    TabsPage,
    SettingsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    QRScanner,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    EthcontractProvider,
    EthereumService,
    AccountService,
    PaymentOnDeliveryService,
    MessageService
  ]
})
export class AppModule {}

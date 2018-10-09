import { Component } from '@angular/core';

import { ScanPage } from '../scan/scan';
import { ContactPage } from '../contact/contact';
import { DeliveriesPage } from '../deliveries/deliveries';
import {SettingsPage} from "../settings/settings";

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = DeliveriesPage;
  tab2Root = ScanPage;
  tab3Root = ContactPage;
  tab4Root = SettingsPage;

  constructor() {

  }
}

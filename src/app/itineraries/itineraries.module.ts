import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ItinerariesPageRoutingModule } from './itineraries-routing.module';

import { ItinerariesPage } from './itineraries.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ItinerariesPageRoutingModule
  ],
  declarations: [ItinerariesPage]
})
export class ItinerariesPageModule {}

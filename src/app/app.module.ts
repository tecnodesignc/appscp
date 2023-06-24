import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule } from  '@angular/common/http';

import { IonicStorageModule } from '@ionic/storage-angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Device } from '@ionic-native/device/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule,
    IonicStorageModule.forRoot()
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, 
    BarcodeScanner, 
    NativeAudio, 
    AndroidPermissions, 
    UniqueDeviceID,
    Network,
    File,
    Device
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

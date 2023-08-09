import { Component } from '@angular/core';
import { GlobalService } from '../service/global.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import { Platform } from '@ionic/angular';
import { NetworkService } from '../service/network.service';
import * as moment from 'moment';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  loadingGlobal: any;
  UniqueDeviceID = "";
  token = ""
  isConnected = false;
  lastSync = "";
  constructor(
    private storage: Storage,
    private router: Router,
    private globalServ: GlobalService,
    private barcodeScanner: BarcodeScanner,
    private uniqueDeviceID: UniqueDeviceID,
    public platform: Platform,
    private networkService: NetworkService
  ) {
    this.storage.get('token').then((token)=>{
      if(token) {
        this.token = token;
        this.doLogin();
      }
    });
    this.platform.ready().then(() => {
      this.getUniqueDeviceID();
    });



  }

  ionViewDidEnter() {
    this.storage.get('lastSync').then((lastSync)=>{
      if(lastSync) {
        let duration = moment.duration(moment(new Date()).diff(moment(lastSync)));
        if(duration.hours() > 0) {
          this.lastSync = "Última actualización hace " + duration.hours() + "hrs";
        };
        if(duration.days() > 0) {
          this.lastSync = "Última actualización hace " + duration.days() + "dias " + duration.hours() + "hrs";
        };
      }
    });
  }

  ngOnInit(){
      this.networkService.getNetworkStatus().subscribe((connected: boolean) => {
              this.isConnected = connected;
              if (!this.isConnected) {
                  console.log('Por favor enciende tu conexión a Internet');
              }
      });
  }


  getUniqueDeviceID() {

    this.uniqueDeviceID.get()
      .then((uuid: any) => {
        console.log(uuid);
        this.UniqueDeviceID = "d5651863a5"//uuid.replaceAll("-", "").substring(0, 10);
      })
      .catch((error: any) => {
        console.log(error);
        //this.UniqueDeviceID = "Error! ${error}";
      });
  }

  async doLogin(){

    if(this.isConnected){
      //login server
      this.globalServ._openLoading("Espere...")
      this.globalServ._login({token: this.token}).subscribe(request => {
        this.globalServ?._closeLoading();
        if(request?.data?.id){
          this.storage.set("lastSync", moment(new Date()).valueOf()).then(()=>{
            this.globalServ._syncPassengers(this.token);
            this.storage.set('token', this.token).then(()=>{
              this.storage.set('user', request?.data).then(()=>{
                this.router.navigateByUrl('/list' );
              });
            });
          })
        }
      });
    }else{
      //login local
      this.globalServ._showToast("Data local");
      this.storage.get("data_offline_drivers").then((data_offline_drivers)=>{
        let user = data_offline_drivers.find((f:any)=> f?.user?.api_key == this.token)
        if(user){
          this.storage.set('token', this.token).then(()=>{
            this.storage.set('user', user?.user).then(()=>{
              this.router.navigateByUrl('/list' );
            });
          });
        }
      })
    }

  }

  scan() {
    this.barcodeScanner.scan({
      prompt : "Coloque el Qr en posición para loguearse \n",
      showFlipCameraButton : true
    }).then(barcodeData => {
      console.log(barcodeData);
      if(barcodeData?.cancelled != true){
        this.token = barcodeData?.text;
        this.doLogin();
      }
     }).catch(err => {
         console.log('Error', err);
     });
  }

}

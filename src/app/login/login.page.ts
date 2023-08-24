import { Component } from '@angular/core';
import { GlobalService } from '../service/global.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import { Platform , AlertController} from '@ionic/angular';
import { NetworkService } from '../service/network.service';
import * as moment from 'moment';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  loadingGlobal: any;
  UniqueDeviceID = "" // "d5651863a5";
  //token = "9e1c6040-c83b-4edf-bbda-0e75fc845121"
  //token = "dfa0945c-15c4-45f0-84eb-20c059053ba0"
  token = "";
  isConnected = false;
  lastSync = "";
  isModalOpen = false;
  companies!: any;
  requestTemp : any

  constructor(
    private storage: Storage,
    private router: Router,
    private globalServ: GlobalService,
    private barcodeScanner: BarcodeScanner,
    private uniqueDeviceID: UniqueDeviceID,
    public platform: Platform,
    private networkService: NetworkService,
    private alertController: AlertController
  ) {
    this.storage.get('token').then((token)=>{
      if(token) {
        this.token = token;
        this.doLogin(true);
      }
    });
    this.platform.ready().then(() => {
      this.getUniqueDeviceID();
      this.checkInternet()
    });
  }

  ionViewDidEnter = async() => {
    let lastSync = await this.storage.get('lastSync')
    if(lastSync) {
      let duration = moment.duration(moment(new Date()).diff(moment(lastSync)));
      if(duration.hours() > 0) {
        this.lastSync = "Última actualización hace " + duration.hours() + "hrs";
      };
      if(duration.days() > 0) {
        this.lastSync = "Última actualización hace " + duration.days() + "dias " + duration.hours() + "hrs";
      };
    }
  }

  ngOnInit(){
      this.checkInternet()
  }

  checkInternet () {
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
        this.UniqueDeviceID = uuid.replaceAll("-", "").substring(0, 10);
      })
      .catch((error: any) => {
        console.log(error);
        //this.UniqueDeviceID = "Error! ${error}";
      });
  }

  _ = async (request:any) => {
    await this.storage.set('token', this.token);
    await this.storage.set('user', request?.data);
    await this.storage.set("data_offline_passengers", []);
    await this.storage.set("data_offline_drivers", []);
    await this.storage.set("data_offline_routes", []);
  }

  setCompany = async(company:any) => {
    this._(this.requestTemp);
    this.isModalOpen = false
    await this.storage.set('company_id', company?.id);
    await this.storage.set("lastSync", moment(new Date()).valueOf());
    this.globalServ._syncPassengers(this.token);
    this.router.navigateByUrl('/list' );
  }

  async doLogin(autologin = false){
    this.isModalOpen = false;
    this.companies = [];

    if(this.isConnected){
      //login server
      this.globalServ._openLoading("Espere...")
      this.globalServ._login({token: this.token}).subscribe(async request => {
        if(request?.data?.id){
          
          this.globalServ?._closeLoading();

          if(autologin){
            this._(request);
            await this.storage.set("lastSync", moment(new Date()).valueOf());
            this.globalServ._syncPassengers(this.token);
            this.router.navigateByUrl('/list' );
            return;
          }

          if(request?.data?.companies.length == 1){
            this._(request);
            await this.storage.set("lastSync", moment(new Date()).valueOf());
            await this.storage.set('company_id', request?.data?.companies[0]?.id);
            this.globalServ._syncPassengers(this.token);
            this.router.navigateByUrl('/list' );

          }else{
            this.requestTemp = request;
            this.companies =  request?.data?.companies
            this.isModalOpen = true
          }
        }
      });
      
    }else{
      //login local
      //this.globalServ._showToast("Data local");

      if(autologin){
        this.router.navigateByUrl('/list' );
        return;
      }

      let data_offline_drivers = await this.storage.get("data_offline_drivers")
      let user = data_offline_drivers.find((f:any)=> f?.user?.api_key == this.token)
      if(user){
        await this.storage.set('token', this.token)
        await this.storage.set('user', user?.user)
        this.router.navigateByUrl('/list' );
      }else{
        const alert = await this.alertController.create({
          header: "Usuario no encontrado",
          cssClass: "isRedAlertOpen",
        });
        await alert.present();
        setTimeout(()=>{
          alert.dismiss()
        },1500)
      }
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

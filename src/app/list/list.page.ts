import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { GlobalService } from '../service/global.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Router } from '@angular/router';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import * as moment from 'moment';
import { AlertController } from '@ionic/angular';
import { NetworkService } from '../service/network.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit {
  ruta = "";
  rutas!: any;
  user = {
    full_name: "",
    main_image: ""
  };
  token = "";
  routeActive = {
    id: "",
    route_id: "",
    start_place: "",
    arrival_place: "",
    created_at: "",
    token: null,
    name: ""
  };
  isGreenAlertOpen=false;
  isRedAlertOpen=false;
  uuid = "";
  isConnected = false;
  company_id = ""
  constructor(
    private storage: Storage,
    private globalServ: GlobalService,
    private barcodeScanner: BarcodeScanner,
    private router: Router,
    private nativeAudio: NativeAudio,
    private uniqueDeviceID: UniqueDeviceID,
    private alertCtrl: AlertController,
    private networkService: NetworkService
  ) {
    this.nativeAudio.preloadSimple('scan-tono', 'assets/scan-tono.mp3').then((success)=>{
      console.log("success");
    }, (e)=>{
      console.log(e);
    });

    this.nativeAudio.preloadSimple('scan-error', 'assets/scan-error2.mp3').then((success)=>{
      console.log("success");
    }, (e)=>{
      console.log(e);
    });
    this.uniqueDeviceID.get()
    .then((uuid: any) => {
      this.uuid = uuid.replaceAll("-", "").substring(0, 10);
    })
    .catch((error: any) => {
      console.log(error);
      //this.uuid = "";
    });
  }

  ngOnInit(){
      this.networkService.getNetworkStatus().subscribe((connected: boolean) => {
              this.isConnected = connected;
      });
  }

  ionViewCanLeave() {return false;}

  ionViewDidEnter = async() => {
    this.user = await this.storage.get("user");
    this.token = await this.storage.get("token");
    this.company_id = await this.storage.get("company_id");
    let routeActive = await this.storage.get("routeActive");
    if(routeActive?.token == this.token){
      this.routeActive = routeActive
    }
    this.initiate()
  }

  initiate() {
    if(this.isConnected){
      this.globalServ?._openLoading("Espere...");
      this.globalServ._routes(this.token, this.company_id).subscribe(request => {
        this.globalServ?._closeLoading();
        if(request?.data){
          this.rutas = request?.data;
        }
      });
    }else{
      //this.globalServ._showToast("Data local");
      this.storage.get("data_offline_routes").then((data_offline_routes)=>{
        if(data_offline_routes) this.rutas = data_offline_routes;
      })
    }
    
  }

  onPlaySuccess = () => {
    this.nativeAudio.play('scan-tono').then((success)=>{
        console.log("success");
    }, (e)=>{
        console.log(e);
    });
  }

  onPlayError = () => {
    this.nativeAudio.play('scan-error').then((success)=>{
        console.log("success");
    }, (e)=>{
        console.log(e);
    });
  }

  //
  //PROCCESS SCAN
  //
  doBegin() {
    if(this.ruta == ""){return}

    this.storage.get('lastSync').then(async (lastSync)=>{
      if(lastSync) {
        let duration = moment.duration(moment(new Date()).diff(moment(lastSync)));
        if((duration.hours() + (duration.days() * 24)) >= 12) {
          let alert = await this.alertCtrl.create({
            subHeader: 'Necesitas actualizar',
            message: 'Ha pasado más de 12 horas de la última actualización, por favor conectate a la red y logueate de nuevo.',
            backdropDismiss: false,
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.onLogout();
                }
              }
            ]
          });
          await alert.present();
          return
        }

        let createData = {
          route_id: this.ruta,
          imei: this.uuid,
          start_date: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        if(this.isConnected){
          //begin route server
          this.globalServ?._openLoading("Espere...");
          this.globalServ._createRoute(createData, this.token).subscribe(async request => {
            this.globalServ._closeLoading();
            if(request?.data?.id){
              this.escanear();
              let routeActive = this.rutas.filter((f:any)=> f.id == this.ruta);
              let newRoute = {
                ...routeActive[0],
                ...request?.data,
                id: request?.data?.id,
                token: this.token
              }
              await this.storage.set('routeActive', newRoute)
              this.routeActive = newRoute;
            }
          });
        }else{
          //begin route local
          this.globalServ._saveQs("_createRoute", createData, this.token);
          this.escanear();
          let routeActive = this.rutas.filter((f:any)=> f.id == this.ruta);
          let newRoute = {
            ...routeActive[0],
            id: null,
            token: this.token
          }
          await this.storage.set('routeActive', newRoute)
          this.routeActive = newRoute;
        }
      }
    });
  }

  validatePassenger(passenger_id:any) {
    if(this.isConnected){

      let validateData = {
        passenger: passenger_id,
        route_itinerary_id: this.routeActive?.id ?? this.globalServ.last_createRoute_id
      }

      //validate server
      this.globalServ?._openLoading("Espere...");
      this.globalServ._validatePassenger(validateData, this.token).subscribe(request => {
        this.globalServ._closeLoading();
        if(request?.data?.validate_passenger){
          this.onPlaySuccess();
          this.isGreenAlertOpen = true;
        }else{
          this.onPlayError();
          this.isRedAlertOpen = true;
        }
        setTimeout(()=>{
          this.isGreenAlertOpen = false;
          this.isRedAlertOpen = false;
          this.escanear();
        }, 2000)
      });
    }else{

      let validateData = {
        passenger: passenger_id,
        route_itinerary_id: this.routeActive?.id
      }

      //validate local
      this.globalServ._showToast("Data local");
      this.globalServ._saveQs("_validatePassenger", validateData, this.token);
      this.storage.get("data_offline_passengers").then((data_offline_passengers)=>{
        if(data_offline_passengers){
          let passenger = data_offline_passengers.find((f:any)=> f?.user?.api_key == passenger_id)

          if(passenger && passenger?.tickets_available > 0 && passenger?.user?.is_activated == true){
            this.onPlaySuccess();
            this.isGreenAlertOpen = true;
          }else{
            this.onPlayError();
            this.isRedAlertOpen = true;
          }

          setTimeout(()=>{
            this.isGreenAlertOpen = false;
            this.isRedAlertOpen = false;
            this.escanear();
          }, 2000)

        }
      })
    }
  }

  async escanear() {
    this.barcodeScanner.scan({
      prompt : "Oprima Back para dejar de escanear",
      disableSuccessBeep: true,
      showFlipCameraButton : true
    }).then(barcodeData => {
      if(barcodeData?.cancelled == true){
        //barcode scan back
      }else{
        console.log('Barcode data', barcodeData);
        this.validatePassenger(barcodeData?.text);
      }
     }).catch(err => {
         console.log('Error', err);
     });
  }

  finish() {
    let finishData = {
      imei: this.uuid,
      end_date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    if(this.isConnected){
      //finish router server
      this.globalServ?._openLoading("Espere...");
      this.globalServ._finishRoute(finishData, this.token, this.routeActive?.id ?? this.globalServ.last_createRoute_id).subscribe(request => {
        this.globalServ._closeLoading();
        if(request?.data){
          this.showReport();
        }
      });
    }else{
      //finish route local
      this.globalServ._showToast("Data local");
      this.globalServ._saveQs("_finishRoute", finishData, this.token, this.routeActive?.id);
      this.showReport();
    }
  }

  showReport = async () => {
    
    if(this.isConnected){
      this.globalServ?._openLoading("Espere...");
      //show report server
      this.globalServ._report(this.routeActive?.id ?? this.globalServ.last_createRoute_id, this.token).subscribe(async request => {
        this.globalServ?._closeLoading();
        this.storage.remove("routeActive");
        this.routeActive = {
          id: "",
          route_id: "",
          start_place: "",
          arrival_place: "",
          created_at: "",
          token: null,
          name: ""
        };
  
        let alert = await this.alertCtrl.create({
          subHeader: 'Ruta finalizada',
          message: 'Cantidad de pasajeros: ' + request?.data?.passenger_count,
          backdropDismiss: false,
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.onLogout();
              }
            }
          ]
        });
        await alert.present();
      });
    }else{
      //show report local
      this.storage.remove("routeActive");
      this.routeActive = {
        id: "",
        route_id: "",
        start_place: "",
        arrival_place: "",
        created_at: "",
        token: null,
        name: ""
      };
      let alert = await this.alertCtrl.create({
        subHeader: 'Ruta finalizada',
        backdropDismiss: false,
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.onLogout();
            }
          }
        ]
      });
      await alert.present();
    }
  }

  onLogout = async() => {
    await this.storage.remove('token')
    await this.storage.remove('user')
    await this.storage.remove('company_id')
    this.router.navigateByUrl('/login' );
  }

  goItineraries() {
    this.router.navigateByUrl('/itineraries' );
  }

  errorImage(img:any) {
    img.src = '../assets/person-logo.png'
  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError  } from 'rxjs/operators';
import { LoadingController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public base = "http://transporte.ejesatelital.com/";

  public baseApi = this.base + "api/";
  public loadingGlobal:any;
  public token = "";
  public toast:any;
  public last_createRoute_id = "";

  constructor(
  	private http: HttpClient, 
    private toastCtrl: ToastController, 
    private loading: LoadingController,
    private storage: Storage,
    private alertController: AlertController
  ) {

  }

  _login(postData:any): Observable<any> {
    let url = this.baseApi + "auth/login";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleErrors)
    );
  }

  _routes(token:any, company_id = "0"): Observable<any> {
    let url = this.baseApi + "transport/v1/routes?company_id=" + company_id;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.get(url, {headers})
    .pipe(
      tap((data) => this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _createRoute(postData:any, token: any): Observable<any> {
    let url = this.baseApi + "transport/v1/route-itineraries";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.post(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleErrors)
    );
  }

  _createRouteOffline(postData:any, token: any): Observable<any> {
    let url = this.baseApi + "transport/v1/route-itineraries";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.post(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _validatePassenger(postData:any, token: any): Observable<any> {
    let url = this.baseApi + "transport/v1/itineraries";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.post(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleErrors)
    );
  }

  _validatePassengerOffline(postData:any, token: any): Observable<any> {
    let url = this.baseApi + "transport/v1/itineraries";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.post(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _finishRoute(postData:any, token: any, route_id: any): Observable<any> {
    let url = this.baseApi + "transport/v1/route-itineraries/" + route_id;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.put(url, postData, {headers})
    .pipe(
      tap((data)=> this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _itineraries(token:any): Observable<any> {
    let url = this.baseApi + "transport/v1/itineraries";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.get(url, {headers})
    .pipe(
      tap((data) => this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _report(route_id:any, token:any): Observable<any> {
    let url = this.baseApi + "transport/v1/reports/route-itineraries/" + route_id + "?count=true";
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });
    return this.http.get(url, {headers})
    .pipe(
      tap((data) => this.processResponse(data)),
      catchError(this.handleError('error', [], false))
    );
  }

  _saveQs = (f:string, d:object, t:string, u = "") => {
    this.storage.get("qs").then((qs)=>{
      let _qs = qs ?? [];
      _qs.push({
        f: f,
        d: d,
        t: t,
        u: u
      })
      this.storage.set("qs", _qs);
    });
  } 

  async _syncRoutes (token:any, page = 1)  { 
    let company_id= await this.storage.get("company_id");
    let url = this.baseApi + "transport/v1/routes?company_id=" + company_id;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });

    this.http.get(url, {headers}).subscribe((data:any) => {
      this.storage.get("data_offline_routes").then((data_offline_routes)=>{
        let dataStorage = data_offline_routes ?? [];
        
        if(data?.data){
          data?.data?.map((d:any)=>{
            let oneData = dataStorage.findIndex((f:any)=> f.id === d.id );
            if(oneData != -1){
              dataStorage[oneData] = d
            }else{
              dataStorage.push(d);
            }
          })
          this.storage.set("data_offline_routes", dataStorage).then(()=>{
            this.toast?.dismiss();
          })
        }
      });
    })
  }

  async _syncDrivers (token:any, page = 1)  { 
    let company_id = await this.storage.get("company_id");
    let url = this.baseApi + "transport/v1/drivers?include=itineraries&limit=100&company_id="+company_id+"&page=" + page;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    });

    this.http.get(url, {headers}).subscribe(async(data:any) => {
      let data_offline_drivers = await this.storage.get("data_offline_drivers")
        let dataStorage = data_offline_drivers ?? [];
        if(data?.data){
          data?.data?.map((d:any)=>{
            let oneData = dataStorage.findIndex((f:any)=> f.id === d.id );
            if(oneData != -1){
              dataStorage[oneData] = d
            }else{
              dataStorage.push(d);
            }
          })
          await this.storage.set("data_offline_drivers", dataStorage)
          if(data?.data?.length == 100){
            this._syncDrivers(token, page + 1);
          }else{
            this._syncRoutes(token);
          }
        }
    })
  }

  _syncPassengers =  async(token:any, page = 1) => { 

    this.toastCtrl.create({
      message: "Sincronizando",
      duration: 1000,
      position: 'top'
    }).then(toast => toast.present());
    
      let company_id = await this.storage.get("company_id");
      let url = this.baseApi + "transport/v1/passengers?include=user&limit=100&company_id="+company_id+"&page=" + page;
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      });
  
      this.http.get(url, {headers}).subscribe(async(data:any) => {
        let data_offline_passengers = await this.storage.get("data_offline_passengers");
        let dataStorage = data_offline_passengers ?? [];
        if(data?.data){
          data?.data?.map((d:any)=>{
            let oneData = dataStorage.findIndex((f:any)=> f.id === d.id );
            if(oneData != -1){
              dataStorage[oneData] = d
            }else{
              dataStorage.push(d);
            }
          })
          await this.storage.set("data_offline_passengers", dataStorage)
          if(data?.data?.length == 100){
            this._syncPassengers(token, page + 1);
          }else{
            this._syncDrivers(token);
          }
        }
      })
  }

  _syncProcess () {
    this.storage.get("qs").then(qs=>{
      if(qs && qs.length > 0){
        let _qs = qs[0];
        let _func = _qs?.f;
        switch (_func) {
          case "_createRoute":
            this._createRouteOffline(_qs.d, _qs.t).subscribe(request => {
              if(request?.data?.id){
                this.last_createRoute_id = request?.data?.id;
              }
              qs.shift();
              this.storage.set("qs", qs).then(()=>{
                this._syncProcess();
              })
            });
            break;
          case "_validatePassenger":
            this._validatePassengerOffline({..._qs.d, route_itinerary_id : _qs?.d?.route_itinerary_id && _qs?.d?.route_itinerary_id != "" ? _qs?.d?.route_itinerary_id : this.last_createRoute_id}, _qs.t).subscribe(request => {
              //if(request?.data || request?.errors){
                qs.shift();
                this.storage.set("qs", qs).then(()=>{
                  this._syncProcess();
                })
              //}
            });
          break;
          case "_finishRoute":
            this._finishRoute(_qs.d, _qs.t, _qs.u && _qs.u != "" ? _qs.u : this.last_createRoute_id).subscribe(request => {
              //if(request?.data || request?.errors){
                qs.shift();
                this.storage.set("qs", qs).then(()=>{
                  this._syncProcess();
                })
              //}
            });
          break;
        
          default:
            
            break;
        }
      }else{
        //this._showToast("Estas al dia!");
      }
    })
  }
  
  processResponse(data: any) {
    this._closeLoading();
  }
  
  async _openLoading(msg: string) {
    this.loadingGlobal = await this.loading.create({
      message: msg
    });
    await this.loadingGlobal.present();
  }

  async _closeLoading() {
    this.loadingGlobal ? this.loadingGlobal.dismiss() : null ;  
  }

  _showToast(msg:any) {
    this.toastCtrl.create({
      message: msg,
      duration: 1000,
      position: 'bottom'
    }).then(toast => toast.present());
  }

  log(msg: string) {}

  handleErrors = async (error: HttpErrorResponse) => {
    this._closeLoading();

    if(error && error?.error && error?.error?.errors){
      const alert = await this.alertController.create({
        header: error?.error?.errors,
        cssClass: "isRedAlertOpen",
      });
      await alert.present();
      setTimeout(()=>{
        alert.dismiss()
      },1500)
    }
    return "it`s is an error"
  }

  handleError<T>(operation = 'operation', result?: T, showMsg = true) {
    this._closeLoading();
    return (error: any): Observable<T> => {
      this.processResponse(error?.error);
      if(showMsg) this._showToast(error?.error?.message);
      return of(result as T);
    };
  }
}

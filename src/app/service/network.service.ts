import { Injectable } from '@angular/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Platform } from '@ionic/angular';
import { Observable, BehaviorSubject } from 'rxjs';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  private hasConnection = new BehaviorSubject(false);

  constructor(
    private network: Network,
    private platform: Platform,
    private globalServ: GlobalService
  ) {
    if (this.platform.is('cordova')) {
        // on Device
        this.network.onConnect().subscribe(() => {
            //console.log('network was connected :-)');
            let x = document.getElementById("statusConnection");
            if(x){
              x.style.background = "green";
            }
            this.hasConnection.next(true);
            this.globalServ._syncProcess();
            return;
        });
        this.network.onDisconnect().subscribe(() => {
            //console.log('network was disconnected :-(');
            let x = document.getElementById("statusConnection");
            if(x){
              x.style.background = "red";
            }
            this.hasConnection.next(false);
            return;
        });
    } 

  }

  public getNetworkStatus(): Observable<boolean> {
      return this.hasConnection.asObservable();
  }
}

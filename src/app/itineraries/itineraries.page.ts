import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../service/global.service';
import { Storage } from '@ionic/storage';
@Component({
  selector: 'app-itineraries',
  templateUrl: './itineraries.page.html',
  styleUrls: ['./itineraries.page.scss'],
})
export class ItinerariesPage implements OnInit {
  itinerarios!: any;
  constructor(
    private storage: Storage,
    private globalServ: GlobalService
  ) {

  }

  ionViewDidEnter() {
    this.storage.get('token').then((token)=>{
      this.globalServ?._openLoading("Espere...");
      this.globalServ._itineraries(token).subscribe(request => {
        this.globalServ?._closeLoading();
        if(request?.data){
          this.itinerarios = request?.data;
        }
      });
    });
  }

  ngOnInit() {
  }

}

import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service'
import {ActivatedRoute, Router} from '@angular/router'
import {SipGateways} from '@app/models/sip-gateway'
import {GetNumbers} from '@app/models/tracking_numbers'
import {
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {map, mergeMap, take, tap} from "rxjs/operators";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-sipgateway-delete',
  templateUrl: './sipgateway-delete.component.html',
  styleUrls: ['./sipgateway-delete.component.scss'],
  animations: [
  ]
})
export class SipGatewayDeleteComponent implements OnInit {

  sipGateway: SipGateways
  trackingNumbers: GetNumbers[]

  blockContent = false

  constructor(public api: ApiService,
              public router: ActivatedRoute,
              public route: Router,
              private location: Location,
              public store: StoreService,
              public messageService: MessageService) {
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      // let guiVisibility = this.store.getGuiVisibility()
      //
      // let permission = PERMISSION_TYPE_DENY
      // for (let v of guiVisibility) {
      //   if (v.GuiSection.name == "SipGateways") {
      //     permission = v.GuiPermission.name
      //     break
      //   }
      // }
      //
      // if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      // }
    }

    /**************************** page started *************************/
    this.api.getSipGatewayById(this.router.snapshot.params.id).pipe(
      map(res => {
        this.sipGateway = res
        return {id: res.id};
      }),
      take(1),
      mergeMap(({id}) => {
        return this.api.getTrackingNumbersBySipGateway(id);
      }),
      tap(resNumbers => {
        if (this.trackingNumbers === undefined || this.trackingNumbers === null) {
          this.trackingNumbers = resNumbers;
        } else {
          resNumbers.forEach(number => {
            this.trackingNumbers.push(number);
          })
        }
      })
    ).subscribe((resNumbers) => {


    }, e => {

    });
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };


  onDelete = () => {
    this.blockContent = true
    this.api.deleteSipGatewayById(this.sipGateway.id).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Deleting Succeeded!')
      this.route.navigateByUrl(RoutePath.receiving.sipgateways)
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

  onBack = () => {
    this.location.back()
  }
}

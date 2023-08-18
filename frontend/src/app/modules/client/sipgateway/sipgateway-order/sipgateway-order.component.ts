import { Component, OnInit } from '@angular/core';
import {ApiService} from "@services/api/api.service";
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {StoreService} from "@services/store/store.service";
import {Location} from "@angular/common";
import {CMSUserType, NoPermissionAlertInteral} from "@app/modules/client/constant";
import {catchError, tap} from "rxjs/operators";
import {of} from "rxjs";
import {SipGateways} from "@app/models/sip-gateway";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-sipgateway-order',
  templateUrl: './sipgateway-order.component.html',
  styleUrls: ['./sipgateway-order.component.scss']
})
export class SipgatewayOrderComponent implements OnInit {

  blockContent = false
  sipGateways: SipGateways[];

  constructor(public api: ApiService,
              public router: Router,
              private messageService: MessageService,
              private store: StoreService,
              private location: Location) {
  }

  async ngOnInit() {
    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);

          resolve();
        }
      }, 100);
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      // this.customerSelectable = false;
      // this.sipGateway.customerId = this.store.getUser().customerId;
      // const guiVisibility = this.store.getGuiVisibility();
      //
      // let permission = PERMISSION_TYPE_DENY;
      // for (const v of guiVisibility) {
      //   if (v.GuiSection.name == 'SipGateways') {
      //     permission = v.GuiPermission.name;
      //     break;
      //   }
      // }

      // if (permission != PERMISSION_TYPE_ALL) {
      this.showWarn('You have no permission for this page')
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, NoPermissionAlertInteral);
      });
      this.location.back();
      // }
    }

    this.getSipGateways()
  }

  getSipGateways = async () => {
    this.blockContent = true;

    try {
      await this.api.getSipGateways('order', 'asc', 1, 1000, '', null)
        .pipe(tap(res => {
          this.sipGateways = res.body
          this.blockContent = false;
        }), catchError((_) => {
          this.blockContent = false;
          return of(0);
        })).toPromise();

    } catch (e) {

    }
  }

  onAssign() {
    if (this.sipGateways==null || this.sipGateways.length==0) {
      this.showError("No SipGateways. Please create sipgateway first.")
      return
    }

    let ids = [];
    let order = 1;
    for (let item of this.sipGateways) {
      ids.push({ id: item.id, order: order});
      order++;
    }

    this.blockContent = true
    this.api.assignSipGatewayOrder(ids).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Updating Succeeded!')
      this.router.navigateByUrl(RoutePath.receiving.sipgateways)
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
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
}

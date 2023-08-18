import {Component, OnInit} from '@angular/core';
import {ApiService} from '@services/api/api.service'
import {ActivatedRoute, Router} from '@angular/router'
import {ReceivingNumber} from '@app/models/receiving-number'
import {Location} from '@angular/common'
import {GetNumbers} from '@app/models/tracking_numbers'
import {trigger, transition, query, style, animate} from '@angular/animations'
import {
  AnimationInterval,
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
  selector: 'app-receiving-delete',
  templateUrl: './receiving-delete.component.html',
  styleUrls: ['./receiving-delete.component.scss'],
  animations: [
  ]
})
export class ReceivingDeleteComponent implements OnInit {

  number: ReceivingNumber
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
      let guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "ReceivingNumbers") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    this.api.getReceivingNumberById(this.router.snapshot.params.id).pipe(
      map(res => {
        this.number = res;
        return {id: res.id};
      }),
      take(1),
      mergeMap(({id}) => {
        return this.api.getTrackingNumbersByReceivingNumber(id);
      }),
      tap(resNumbers => {
        if (this.trackingNumbers === undefined || this.trackingNumbers == null) {
          this.trackingNumbers = resNumbers;
        } else {
          resNumbers.forEach(number => {
            this.trackingNumbers.push(number);
          })
        }
      })
    ).subscribe(resNumbers => {


    }, e => {
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

  /**
   * this is called at clicking release button
   */
  onDelete = () => {
    this.blockContent = true

    this.api.deleteReceivingNumberById(this.number.id).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Deleting Succeeded!')
      this.route.navigateByUrl(RoutePath.receiving.numbers);
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

  /**
   * this is called at clicking back button
   */
  onBack = () => {
    this.location.back()
  }
}

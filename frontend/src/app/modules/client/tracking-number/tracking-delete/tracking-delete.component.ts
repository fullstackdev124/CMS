import {Component, OnInit} from '@angular/core';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router'
import {ApiService} from '../../../../services/api/api.service'
import {GetNumbers} from '../../../../models/tracking_numbers'
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-tracking-delete',
  templateUrl: './tracking-delete.component.html',
  styleUrls: ['./tracking-delete.component.scss'],
  animations: [
  ]
})

export class TrackingDeleteComponent implements OnInit {

  id = null
  data: GetNumbers

  blockContent = false

  constructor(public route: ActivatedRoute,
              public api: ApiService,
              public router: Router,
              private messageService : MessageService,
              private location: Location,
              public store: StoreService,
  ) {
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
        if (v.GuiSection.name == "TrackingNumbers") {
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

    /**************************** page started *************************/
    this.id = this.route.snapshot.params.id;
    this.api.getDetailById(this.route.snapshot.params.id).subscribe(async data => {
      this.data = data;

      if (this.store.getUserType() != CMSUserType.superAdmin && this.store.getUser().customerId != data.customerId) {
        this.showWarn("You have no permission for this tracking number")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    });
  }

  /**
   * this is called at clicking release button
   */
  onDeleteNumber = () => {
    this.blockContent = true
    this.api.deleteDetailById(this.id).subscribe(data => {
      this.blockContent = false
      this.showSuccess('Deleting Succeeded!')
      this.router.navigateByUrl(RoutePath.tracking_number.numbers)
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

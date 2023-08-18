import {Component, OnInit} from '@angular/core';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-user-delete',
  templateUrl: './user-delete.component.html',
  styleUrls: ['./user-delete.component.scss'],
  animations: [
  ]
})

export class UserDeleteComponent implements OnInit {

  customers = [];
  user: any = {};

  blockContent = false

  constructor(public api: ApiService,
              public router: ActivatedRoute,
              public location: Location,
              public store: StoreService,
              private messageService: MessageService) {
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

    /**************************** page started *************************/
    this.api.getUser(this.router.snapshot.params.id).subscribe(async res => {
      this.user = res;

      /**************************** permission checking *************************/
      if (this.store.getUserType() != CMSUserType.superAdmin) {
        let guiVisibility = this.store.getGuiVisibility()

        let permission = PERMISSION_TYPE_DENY
        for (let v of guiVisibility) {
          if (v.GuiSection.name == "User") {
            permission = v.GuiPermission.name
            break
          }
        }

        if (permission != PERMISSION_TYPE_ALL || (this.store.getUser() && this.store.getUser().id == this.user.id) ) {
          this.showWarning("You have no permission for this page")
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, NoPermissionAlertInteral)
          })
          this.location.back()
        }

        // check if other customer user is trying to delete user or no primary user is trying to delete primary user
        if (this.store.getUser().customerId != this.user.customerId || (this.store.getUserType() != CMSUserType.primaryAdmin && this.user.primaryAdmin)) {
          this.showWarning("You have no permission for this user")
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, NoPermissionAlertInteral)
          })
          this.location.back()
        }
      }
    });
  }

  /**
   * this is called at clicking release button
   */
  onRemoveUser = (event) => {
    event.preventDefault()

    this.blockContent = true
    this.api.deleteUserById(this.router.snapshot.params.id).subscribe(res => {
      this.blockContent = false
      if (!res || !res.count || res.count <= 0) {
        this.showError('Unable to delete user, try again later!')
      } else {
        this.showSuccess('User successfully deleted!')
        this.onPressCancel()
      }
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  /**
   *
   */
  onPressCancel = () => {
    this.location.back();
  }
}

import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { trigger, transition, query, style, animate} from '@angular/animations'
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute} from '@angular/router';
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-role-delete',
  templateUrl: './role-delete.component.html',
  styleUrls: ['./role-delete.component.scss'],
  animations: [
  ]
})

export class RoleDeleteComponent implements OnInit {

  customers = [];
  role: any = {};

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

    /**************************** permission checking *************************/
    let hasCustomerPermission = false
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility()


      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "Role") {
          permission = v.GuiPermission.name
        }

        if (v.GuiSection.name == "Customer" && v.GuiPermission.name != PERMISSION_TYPE_DENY) {
          hasCustomerPermission = true
        }

      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }

    } else {
      hasCustomerPermission = true
    }

    /**************************** page started *************************/
    this.api.getRole(this.router.snapshot.params.id).subscribe(async res => {
      this.role = res;

      // check if other customer user is trying to delete role
      if (!hasCustomerPermission) {
        if (this.store.getUser().customerId != this.role.customerId) {
          this.showWarning("You have no permission for this role")
          await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
          this.location.back()
        }
      }
    });
  }

  /**
   * this is called at clicking release button
   */
  onRemoveRole = async () => {
    try {
      this.blockContent =true

      await new Promise<void>(resolve => {
        this.api.deleteAllVisibilityByRoleId(this.router.snapshot.params.id).subscribe(res => {
          resolve()
        })
      })

      this.api.deleteRoleById(this.router.snapshot.params.id).subscribe(res => {
        this.blockContent = false
        if (!res || !res.count || res.count <= 0) {
          this.showSuccess('Unable to role user, try again later!')
        } else {
          this.showSuccess('Role successfully deleted!')
          this.onPressCancel()
        }
      }, e => {
        this.blockContent = false
      }, () => {
        this.blockContent = false
      })

    } catch (e) {
      this.blockContent = false
    }
  }

  /**
   *
   */
  onPressCancel = () => {
    this.location.back();
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

}

import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ApiService } from '@services/api/api.service';
import { Router } from '@angular/router';
import { GuiPermission, GuiSection, GuiVisibility } from '@app/models/gui';
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY, PERMISSION_ID_DENY, PERMISSION_ID_READONLY, PERMISSION_ID_ALL, PERMISSION_READABLE, PERMISSION_WRITEABLE, PERMISSION_TYPE_DENY } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-role-add',
  templateUrl: './role-add.component.html',
  styleUrls: ['./role-add.component.scss'],
  animations: [
  ]
})
export class RoleAddComponent implements OnInit {

  currentSection = 'role-detail';

  customers = [];

  role: any = {
    id: null,
    name: '',
    description: '',
    customerId: null,
  };

  cmsUserType = CMSUserType

  // Tab
  roleDetailTab = true;
  assignPermissionTab = false;

  hasCustomerPermission = false;

  guiVisibilities: GuiVisibility[] = [];
  guiPermissions: GuiPermission[] = [];
  guiSections: GuiSection[] = [];
  guiData = [];
  groupNames = [];

  permission_readable = PERMISSION_READABLE
  permission_writeable = PERMISSION_WRITEABLE

  blockContent = false

  readable = []
  writable = []


  constructor(public api: ApiService,
    public router: Router,
    private routes: Router,
    private location: Location,
    private messageService: MessageService,
    private store: StoreService) {

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
        if (v.GuiSection.name == "Role") {
          permission = v.GuiPermission.name
        }

        if (v.GuiSection.name == "Customer" && v.GuiPermission.name != PERMISSION_TYPE_DENY) {
          this.hasCustomerPermission = true
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }

    } else {
      this.hasCustomerPermission = true
    }

    this.getCustomerList()
    this.getGuiPermissions()
  };

  /**
   * get available customer list
   */
  getCustomerList = () => {
    if (this.hasCustomerPermission) {
      this.api.getAllCustomerList().subscribe(res => {

        this.customers = res
      })
    } else {
      this.customers.push(this.store.getUser().Customer)
      this.role.customerId = this.customers[0].id
    }
  };

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };
  showInfo = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'info', summary: 'Information', detail: msg });
  };

  handleChange = (key: string, event: any) => {
    this.role[key] = event.target.value;
  };

  onChangeCustomer = (event) => {
    this.role.customerId = parseInt(event.value.id)
  }

  onCreate = async () => {
    // if (!this.role.customerId) {
    //   this.onTab('roleDetail')
    //   this.showWarning('Please select a Customer');
    //   return
    // }

    if (this.role.name == '') {
      this.showWarning('Please input role name')
      return
    }

    if (this.role.description == '') {
      this.showWarning('Please input role description')
      return
    }

    if (this.role.customerId != null && this.role.customerId == 0) {
      this.role.customerId = null
    }

    try {
      let roleId = 0
      this.role.created = new Date().toISOString();
      this.blockContent = true

      await new Promise<void>(resolve => {
        this.api.createRole(this.role).subscribe(res => {
          roleId = res.id
          resolve()
        });
      })

      await new Promise<void>(resolve => {
        let responseCount = 0
        this.guiData.forEach(data => {
          console.log(data)
          let guipermissionId = PERMISSION_ID_DENY
          if (data.readable) {
            guipermissionId = PERMISSION_ID_READONLY
            if (data.writeable)
              guipermissionId = PERMISSION_ID_ALL
          }

          let guisectionId = data.guiSection.id

          const guiVisibility = { roleId, guipermissionId, guisectionId };
          this.api.createGuiVisibility(guiVisibility)
            .subscribe(res1 => {
              responseCount++
              if (responseCount == this.guiData.length) {
                resolve()
              }
            });
        })
      })

      this.blockContent = false
      this.showSuccess('Role successfully created!');

      this.router.navigateByUrl(RoutePath.role.roles)

    } catch (e) {
      this.blockContent = false
    }
  };

  getGuiPermissions = () => {
      this.api.getGuiPermission()
        .subscribe(guiPermissions => {
          this.guiPermissions = guiPermissions;

          this.api.getGuiSections()
            .subscribe(guiSections => {
              this.guiSections = guiSections;

              this.guiSections.forEach(guiSection => {

                let matchedPermissions = this.store.getGuiVisibility().filter(item => (item.GuiSection.name == guiSection.name))
                if (this.store.getUserType() != CMSUserType.superAdmin && (matchedPermissions.length == 0 || matchedPermissions[0].GuiPermission.name == PERMISSION_TYPE_DENY))
                  return

                if (!this.groupNames.includes(guiSection.groupName))
                  this.groupNames.push(guiSection.groupName)

                let data = {
                  guiSection,
                  readable: false,
                  writeable: false,
                }
                this.guiData.push(data);

                this.readable.push(false)
                this.writable.push(false)
              });
            });
        });
  };

  onAssignPermission = async () => {
  }

  /**
   * this function is called at changing slide toggle button
   * @param guisectionId
   * @param permission readable or writeable
   * @param isChecked on/off
   */
  onPermissionChange = (guisectionId, permission, isChecked) => {
    this.guiData.map(data => {
      if (data.guiSection.id == guisectionId) {
        switch (permission) {
          case PERMISSION_READABLE:
            data.readable = isChecked
            if (!isChecked) {
              // data.writeable = false
            }
            break

          case PERMISSION_WRITEABLE:
            data.writeable = isChecked
            break
        }
      }
    })
  }

  onCheckAll() {
    this.guiData.map((data, index) => {
      data.readable = true
      data.writeable = true
      this.readable[index] = true
      this.writable[index] = true
    })
  }

  onUncheckAll() {
    this.guiData.map((data, index) => {
      data.readable = false
      data.writeable = false
      this.readable[index] = false
      this.writable[index] = false
    })
  }

}

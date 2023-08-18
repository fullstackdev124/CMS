import {Component, OnInit} from '@angular/core';
import { trigger, transition, query, style, animate} from '@angular/animations'
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {IRole, IUser} from '@app/models/user';
import {GuiPermission, GuiSection, GuiVisibility} from '@app/models/gui';
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY, PERMISSION_ID_DENY, PERMISSION_ID_READONLY, PERMISSION_ID_ALL, PERMISSION_READABLE, PERMISSION_WRITEABLE, PERMISSION_TYPE_DENY } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss'],
  animations: [
  ]
})
export class RoleEditComponent implements OnInit {

  currentSection = 'role-detail';

  customers = [];

  role: IRole = {
    id: 0,
    name: null,
    customerId: 0,
    created: null,
    description: null,
    modified: null,
    Customer: null,
  };

  cmsUserType = CMSUserType

  isRoleUsing = false

  guiVisibilities: GuiVisibility[] = [];
  guiPermissions: GuiPermission[] = [];
  guiSections: GuiSection[] = [];
  guiData = [];
  groupNames = [];

  permission_readable = PERMISSION_READABLE
  permission_writeable = PERMISSION_WRITEABLE

  hasCustomerPermission = false;

  selectedName = ''
  selectedDescription = ''
  selectedCustomer: any

  readable = []
  writable = []

  blockContent = false

  constructor(public api: ApiService,
    public router: ActivatedRoute,
    private routes: Router,
    private messageService: MessageService,
    private location: Location,
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
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }

    } else {
      this.hasCustomerPermission = true
    }

    /**************************** page started *************************/
    this.api.getRole(this.router.snapshot.params.id).subscribe(async res => {
      this.role = res

      // check if other customer user is trying to edit role
      if (!this.hasCustomerPermission) {
        if (this.store.getUser().customerId != this.role.customerId) {
          this.showWarn("You have no permission for this role")
          await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
          this.location.back()
        }
      }

      this.selectedName = this.role.name
      this.selectedDescription = this.role.description
    })

    this.getCustomerList()
    this.getGuiPermissions()

    if (this.store.getUser() && this.store.getUser().id == 1) // if the user is sadmin, should check if the role is using
      this.checkRoleUsing()
  };

  /**
   * get available customer list
   */
  getCustomerList = () => {
    if (this.hasCustomerPermission) {
      this.api.getAllCustomerList().subscribe(res => {

        this.customers = res

        this.selectedCustomer = this.customers.find((cus) => cus.id == this.role.customerId)
      })
    } else {
      if (this.store.getUser().customerId != null) {
        this.customers.push(this.store.getUser().Customer)
        this.selectedCustomer = this.store.getUser().Customer
      }
    }
  };

  checkRoleUsing = () => {
    const roleId = parseInt(this.router.snapshot.params.id);

    // get role mapping that already exists
    const filter = {
      where: {
        roleId: roleId,
      }
    };
    try {
      this.api.getRoleMappingByFilter(JSON.stringify(filter))
        .subscribe(async res => {
          this.isRoleUsing = res.length > 0
        });
    } catch (e) {

    }
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
  showInfo = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'info', summary: 'Information', detail: msg });
  };


  handleChange = (key: string, event: any) => {
    this.role[key] = event.target.value;
  };

  onChangeCustomer = (event) => {
    this.role.customerId = parseInt(event.value.id)
  }

  onSaveDetail = () => {
    if (this.role.name == '') {
      this.showWarn('Please input role name')
      return
    }

    if (this.role.description == '') {
      this.showWarn('Please input role description')
      return
    }

    if (this.role.customerId != null && this.role.customerId == 0) {
      this.role.customerId = null
    }

    this.blockContent = true

    this.api.updateRole(this.role).subscribe(res => {
      // this.role = res;
      this.blockContent = false
      this.showSuccess('Role update succeeded!');
      // this.routes.navigateByUrl(RouteNames.role.roles);
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  };

  getGuiPermissions = () => {
    const filter = {
      where: {
        roleId: this.router.snapshot.params.id
      }
    };

    this.api.getGuiVisibilitiesByFilter(JSON.stringify(filter))
      .subscribe(guiVisibilities => {
        this.guiVisibilities = guiVisibilities;
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

                  let guiPermissionId = 0;
                  this.guiVisibilities.forEach(guiVisibility => {
                    if (guiVisibility.guisectionId === guiSection.id) {
                      guiPermissionId = guiVisibility.guipermissionId
                    }
                  });

                  if (!this.groupNames.includes(guiSection.groupName))
                    this.groupNames.push(guiSection.groupName)

                  let data = {
                    guiSection,
                    readable: false,
                    writeable: false,
                  }

                  switch (guiPermissionId) {
                    case PERMISSION_ID_DENY:
                      break

                    case PERMISSION_ID_READONLY:
                      data.readable = true
                      break

                    case PERMISSION_ID_ALL:
                      data.readable = true
                      data.writeable = true
                      break
                  }

                  this.guiData.push(data);
                  this.readable.push(data.readable)
                  this.writable.push(data.writeable)
                });
              });
          });
      });
  };

  customTrackBy(index: number, obj: any): any {
    return index;
  }

  /**
   * this function is called at clicking Assign Permission button
   */
  onAssignPermission = async () => {
    const roleId = parseInt(this.router.snapshot.params.id);

    try {
      this.blockContent = true

      await new Promise<void>(resolve => {
        this.api.deleteAllVisibilityByRoleId(roleId).subscribe(res => {
          resolve()
        })
      })

      await new Promise<void>(resolve => {
        let responseCount = 0
        this.guiData.forEach(data => {
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
                this.showSuccess('Permissions update succeeded!');

                this.api.getUser(this.store.getUser().id).subscribe(user => {
                  this.retrieveGuiVisibility(user)
                })
              }
            }, error => {
            }, () => {
            });
        })
      })

      this.blockContent = false

    } catch (e) {
      this.blockContent = false
    }
  }

  public retrieveGuiVisibility(user: IUser): Promise<void> {
    return new Promise<void>(resolve => {
      if (!user.DashRoleMapping || user.DashRoleMapping.length == 0) {
        this.store.setGuiVisibility([])
        resolve()
        return
      }

      let filter = {
          where: {
            roleId: user.DashRoleMapping[0].roleId
          }
      }

      this.api.getGuiVisibilitiesByFilter(JSON.stringify(filter))
        .subscribe(res => {
          this.store.setGuiVisibility(res)
          resolve()
        });
    })
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

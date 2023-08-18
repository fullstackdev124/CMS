import {Component, OnInit } from '@angular/core';
import {Location } from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ApiService } from '@services/api/api.service';
import { StoreService } from '@services/store/store.service'
import { AnimationInterval, CMSUserType, USER_TYPE_ADMINISTRATOR, USER_TYPE_NORMAL_USER, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_DENY } from '../../constant';

// @ts-ignore
import moment from 'moment';
import { tap } from "rxjs/operators";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  animations: [
  ]
})

export class RolesComponent implements OnInit {

  pageSize = 10;
  pageIndex = 1;
  users = [];
  filterValue = '';
  sortActive = '';
  sortDirection = '';
  resultsLength = -1;
  isLoading = true;
  roles = [];

  noNeedEditColumn = false

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL

  totalCount = -1

  constructor(public api: ApiService,
    private store: StoreService,
    private messageService: MessageService,
    private location: Location) {}

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


      this.permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "Role") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    let customFilter = null
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      customFilter = { customerId: this.store.getUser().customerId }
    }

    this.api.getRoleCount("", customFilter)
      .pipe(tap( res => {
        this.totalCount = res.count
      })).toPromise();

    this.getRolesList();
  }

  /**
   * check if the role is using in the role mapping
   * @param roleId role id
   */
  async checkRoleUsing(roleId) {
    // get role mapping that already exists
    const filter = {
      where: {
        roleId: roleId,
      }
    };

    let isUsing = false
    try {
      isUsing = await new Promise(resolve => {
        this.api.getRoleMappingByFilter(JSON.stringify(filter))
          .subscribe(async res => {
            if (res.length > 0)
              resolve(true)
            else
              resolve(false)
        });
      })
    } catch (e) {

    }

    return isUsing.valueOf()
  }

  /**
   * get users tha use role
   * @param roleId role id
   */
  async getRoleUsers(roleId) {
    // get role mapping that already exists
    const filter = {
      where: {
        roleId: roleId,
      }
    };

    let users = []
    try {
      users = await new Promise(resolve => {
        this.api.getRoleMappingByFilter(JSON.stringify(filter))
          .subscribe(async res => {

            let strUserIds = ""
            res.map(roleMapping => {
              strUserIds += strUserIds == "" ? "" : ","
              strUserIds += roleMapping.principalId
            })


            if (strUserIds == '') {
              resolve([])

            } else {
              this.api.getSeveralUsers(strUserIds).subscribe(users => {
                resolve(users)
              })
            }

        });
      })
    } catch (e) {

    }


    return users
  }

  getRolesList = async () => {
    this.isLoading = true;
    try {

      let filterValue = this.filterValue//.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')

      let customFilter = null
      if (this.store.getUserType() != CMSUserType.superAdmin) {
        customFilter = { customerId: this.store.getUser().customerId }
      }

      await this.api.getRoleCount(filterValue, customFilter)
        .pipe(tap( res => {
          this.resultsLength = res.count
        })).toPromise();

      // tslint:disable-next-line: max-line-length
      await this.api.getRolesList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customFilter)
        .pipe(tap(async (roles: any) => {
          roles.map(u => u.created = u.created ? moment(new Date(u.created)).format('YYYY/MM/DD h:mm:ss A') : '');
          roles.map(u => u.modified = u.modified ? moment(new Date(u.modified)).format('YYYY/MM/DD h:mm:ss A') : '');

          let allNotEditable = true
          let result = []
          for (let role of roles) {

            // role.isUsing = await this.checkRoleUsing(role.id)
            // role.users = await this.getRoleUsers(role.id)

            role.isEditable = true
            if (this.store.getUser().DashRoleMapping && this.store.getUser().DashRoleMapping.length > 0 && this.store.getUser().DashRoleMapping[0].roleId == role.id)
              role.isEditable = false
            else
              allNotEditable = false

            result.push(role)
          }

          this.roles = [ ...result ]
          this.noNeedEditColumn = allNotEditable

        })).toPromise();

    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getRolesList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getRolesList();

  onPagination = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getRolesList();
  }

  paginate = (event) => {
    this.onPagination(event.page+1, event.rows);
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

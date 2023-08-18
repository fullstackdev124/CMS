import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import { trigger, transition, query, style, animate} from '@angular/animations'
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import {ApiService} from '@services/api/api.service';

// @ts-ignore
import moment from 'moment';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  animations: [
  ]
})
export class CustomersComponent implements OnInit {

  pageSize = 15;
  pageIndex = 1;
  totalPage = 0;
  customers = [];
  users = [];
  roles = [];
  filterName = '';
  filterValue = '';
  sortActive = '';
  sortDirection = '';
  resultsLength = -1;
  isLoading = true;
  indexes = [];
  displayPages = [];

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  cmsUserType = CMSUserType

  totalCount = -1;

  isSuperAdmin = false

  constructor(public api: ApiService,
    public store: StoreService,
    public messageService: MessageService,
    public location: Location) { }

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
      if (guiVisibility) {
        for (let v of guiVisibility) {
          if (v.GuiSection.name == "Customer") {
            this.permission = v.GuiPermission.name
            break
          }
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }
    else {
      this.isSuperAdmin = true
    }

    this.api.getCustomerCount("", {}).subscribe(res => {
      this.totalCount = res.count
    }, e => {
    })

    this.getUsersList();
  }

  getUsersList = async () => {
    this.isLoading = true;
    try {
      let filterValue = this.filterValue.trim()//.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')
      // tslint:disable-next-line: max-line-length
      this.api.getCustomersList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, this.filterName, filterValue).subscribe((customers: any) => {
        this.customers = customers;
        // tslint:disable-next-line: max-line-length

        // get users
        this.api.getUsers("").subscribe(users => {
          this.users = users
          for (let customer of this.customers) {
            let belongUsers = []
            for (let user of users) {
              if (customer.id == user.customerId) {
                belongUsers.push(user)
              }
            }
            customer.users = belongUsers
          }
        }, e => {
        })

        // get roles
        this.api.getRoles().subscribe(roles => {
          this.roles = roles
          for (let customer of this.customers) {
            let belongRoles = []
            for (let role of roles) {
              if (customer.id == role.customerId) {
                belongRoles.push(role)
              }
            }
            customer.roles = belongRoles
          }
        }, e => {
        })
      });

      this.resultsLength = -1
      this.api.getCustomerCount(filterValue, {}).subscribe(res => {
        this.resultsLength = res.count
      }, e => {
      })

    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getUsersList();
  }

  onFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClickFilter = () => this.getUsersList();

  onPagination = async (pageIndex) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    if (pageIndex === this.pageIndex) {return;}
    this.pageIndex = pageIndex;
    await this.getUsersList();
  }

  paginate = (event) => {
    this.onPagination(event.page+1);
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

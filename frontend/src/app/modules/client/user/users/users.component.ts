import {Component, OnInit, ViewChild} from '@angular/core'
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service'
// @ts-ignore
import moment from 'moment'
import { pluck, take } from 'rxjs/operators'
import { StoreService } from '@services/store/store.service'
import { AnimationInterval, CMSUserType, USER_TYPE_ADMINISTRATOR, USER_TYPE_NORMAL_USER, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY } from '../../constant';
import {MessageService} from "primeng/api";
import {Paginator} from "primeng/paginator";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: [
  ]
})
export class UsersComponent implements OnInit {

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  activeTab = 1   // active tab variable

  // users variables
  pageSize = 10
  pageIndex = 1
  users = []
  filterValue = ''
  sortActive = ''
  sortDirection = ''
  resultsLength = -1
  isLoading = true
  noNeedRemoveColumn = true

  totalCount = -1;

  @ViewChild('paginator', { static: true }) paginator: Paginator

  constructor(public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location
  ) { }

  async ngOnInit() {
    this.pageIndex = this.store.getPageNumber("user")
    this.filterValue = this.store.getPageFilter("user")
    this.pageSize = this.store.getPageSize("user")

    let sortActive = this.store.getPageFilter("user_sortActive")
    if (sortActive!="")
      this.sortActive = sortActive

    let sortDirection = this.store.getPageFilter("user_sortDirection")
    if (sortDirection!="")
      this.sortDirection = sortDirection

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
        if (v.GuiSection.name == "User") {
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

    await this.api.getUserCount("", {}).subscribe(res => {
      this.totalCount = res.count
    })

    await this.getUsersList()

    setTimeout(() => {
      this.paginator.changePage(this.pageIndex-1)
    }, 10)
  }


  /**
   * get user list from the backend
   */
  getUsersList = async () => {
    this.isLoading = true
    try {
      // tslint:disable-next-line: max-line-length

      let filterValue = this.filterValue.trim()//.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')
      if (this.store.getUserType() != CMSUserType.superAdmin) {
        if (filterValue != '')
          filterValue += ','

        filterValue += 'customerId:"' + this.store.getUser().customerId + '"'
      }

      this.api.getUsersList(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, '', filterValue).subscribe((users: any) => {
        this.users = users

        // tslint:disable-next-line: max-line-length
        // this.users.map(u => u.display_name = (String(u.firstName + u.lastName).trim().length > 0) ? u.firstName + ' ' + u.lastName : u.username)
        let noNeedRemoveColumn = false
        this.users.map(u => {
          u.last_login = u.last_login ? moment(new Date(u.last_login)).format('YYYY/MM/DD h:mm:ss A') : ''
          u.isRemoveHidden = false

          if (this.store.getUserType() == CMSUserType.superAdmin)
            return

          if (this.permission == PERMISSION_TYPE_READONLY) {
            noNeedRemoveColumn = true
          }

          if (u.primaryAdmin || (this.store.getUser() && u.id == this.store.getUser().id)) {
            u.isRemoveHidden = true
          }
        })
        this.noNeedRemoveColumn = noNeedRemoveColumn

      });

      await this.api.getUserCount(filterValue, {}).subscribe(res => {
        this.resultsLength = res.count
      })

    } catch (e) {

    } finally {
      setTimeout(() => this.isLoading = false, 1000)
    }
  }

  /**
   * this is called at switching tab
   * @param number tab index
   */
  onTab(number) {
    this.activeTab = number
  }

  /**
   * this is called when the user clicks the top header of table
   * @param name
   */
  onSortChange = async (name) => {
    this.sortActive = name
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    this.pageIndex = 1
    this.store.setPageFilter("user_sortActive", this.sortActive)
    this.store.setPageFilter("user_sortDirection", this.sortDirection)
    this.store.setPageNumber("user", this.pageIndex)
    await this.getUsersList()
  }

  /**
   *
   * @param event
   */
  onFilter = (event: Event) => {
    // this.pageIndex = 1
    // this.filterValue = (event.target as HTMLInputElement).value
  }

  /**
   *
   */
  onClickFilter = () => {
    this.pageIndex = 1
    this.store.setPageNumber("user", this.pageIndex)
    this.store.setPageFilter("user", this.filterValue)
    this.getUsersList()
  }

  /**
   *
   * @param pageIndex page index
   */
  onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getUsersList()
  }

  paginate = (event) => {
    this.store.setPageNumber("user", event.page+1)
    this.store.setPageSize("user", event.rows)
    this.onPageIndexChange(event.page+1, event.rows);
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

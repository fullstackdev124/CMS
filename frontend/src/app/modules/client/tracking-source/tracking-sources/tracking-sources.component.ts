import {Component, OnInit, ViewChild} from '@angular/core';
import {Location} from '@angular/common';
import { trigger, transition, query, style, animate} from '@angular/animations'
import {GetSources} from '@app/models/tracking_numbers'
import {ApiService} from '@services/api/api.service'
import { AnimationInterval, CMSUserType, PERMISSION_TYPE_DENY, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {catchError, tap} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";
import {Paginator} from "primeng/paginator";
import moment from "moment";

@Component({
  selector: 'app-tracking-sources',
  templateUrl: './tracking-sources.component.html',
  styleUrls: ['./tracking-sources.component.scss'],
  animations: [
  ]
})

export class TrackingSourcesComponent implements OnInit {
  pageSize = 10;
  pageIndex = 1;
  sources: any[] = [];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = '';
  sortDirection = '';
  resultsLength = -1;
  totalCount = -1;
  isLoading = true;
  isExporting = false;

  @ViewChild('paginator', { static: true }) paginator: Paginator

  totalTrackingNumbers = -1;

  customerList: any[] = []

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  cmsUserType = CMSUserType
  filteredCustomer: any = {id: '', companyName: 'All'}

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"


  constructor(public api: ApiService,
    private messageService: MessageService,
    private location: Location,
    public store: StoreService) {}

  async ngOnInit() {
    this.pageIndex = this.store.getPageNumber("ts")
    this.filterValue = this.store.getPageFilter("ts")
    this.pageSize = this.store.getPageSize("ts")

    let sortActive = this.store.getPageFilter("ts_sortActive")
    if (sortActive!="")
      this.sortActive = sortActive

    let sortDirection = this.store.getPageFilter("ts_sortDirection")
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
        if (v.GuiSection.name == "TrackingSources") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    await new Promise<void>(resolve => {
      if (this.store.getUserType() == CMSUserType.superAdmin) {
        this.api.getAllCustomerList().subscribe(res => {
          this.customerList.push({id: '', companyName: 'All'})
          this.customerList = this.customerList.concat(res);
          let cus_id = this.store.getPageFilter("ts_customer")
          this.filteredCustomer = this.customerList.find((item) => item.id==cus_id)
          resolve()
        })

      } else {
        this.customerList.push(this.store.getUser().Customer)
        resolve()
      }
  })

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")

    await this.getTotalCount()
    await this.getSourcesAndCount();

    setTimeout(() => {
      this.paginator.changePage(this.pageIndex-1)
    }, 10)
  }

  getTotalCount = async () => {
    this.isLoading = true;

    try {
      await this.api.getSourcesCount("")
        .pipe(tap(value => {
          this.totalCount = value;
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    }
  }

  /**
   * get tracking source data and the count of data from the backend
   */
  getSourcesAndCount = async () => {
    this.isLoading = true;

    let customerFilter = null
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      if (this.filteredCustomer.id!="") {
        customerFilter = {
          customerId: this.filteredCustomer.id
        }
      }
    }

    try {
      await this.api.getTrackingSources(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, this.filterValue.trim(), customerFilter)
        .pipe(tap(res => {
          let offset = 0
          //   offset -= getUserTimezone(this.store.getUser().timezone)
          res.data.map((item: any)=>{
            item.createdAt = item.createdAt? moment(new Date(item.createdAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
            item.updatedAt = item.updatedAt? moment(new Date(item.updatedAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
          })
          this.totalTrackingNumbers = res.data;
          this.sources = res.data;
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getSourcesCount(this.filterValue, customerFilter)
        .pipe(tap(value => {
          this.resultsLength = value;
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  onClickItem = (filterValue) => {
    this.filterValue = filterValue
    this.getSourcesAndCount()
  }

  onSearch = (event) => {
    this.filterValue = event.target.value
    this.pageIndex = 1
    this.store.setPageFilter("ts", this.filterValue)
    this.store.setPageFilter("ts_customer", this.filteredCustomer.id)
    this.store.setPageNumber("ts", this.pageIndex)
    this.getSourcesAndCount()
  }

  // onChangePageSize = async (event: Event) => {
  //   this.pageSize = +(event.target as HTMLInputElement).value;
  //   this.pageIndex = 1;
  //   await this.getSourcesAndCount();
  // }

  onExport = (event: Event) => {
    let filterValue = this.filterValue
    if (this.filterAttr != '') {
      filterValue = `${this.filterAttr}:"${filterValue}"`
    }

    let customerFilter = null
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      if (this.filteredCustomer.id!="") {
        customerFilter = {
          customerId: this.filteredCustomer.id
        }
      }
    }

    this.isExporting = true

    try {
      this.api.downloadAllTrackingSources(filterValue, customerFilter).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `TrackingSources.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }


  /**
   * this is called at clicking any table header
   * @param name sort name
   */
  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    this.store.setPageFilter("ts_sortActive", this.sortActive)
    this.store.setPageFilter("ts_sortDirection", this.sortDirection)
    this.store.setPageNumber("ts", this.pageIndex)
    await this.getSourcesAndCount();
  }

  /**
   * this is called at changing search value
   */
  onChangeFilter = (event: Event) => {
    // this.pageIndex = 1;
    // this.filterName = (event.target as HTMLInputElement).name;
    // this.filterValue = (event.target as HTMLInputElement).value;
  }

  onClearFilter = () => this.filterValue = '';

  /**
   * this is called at pressing enter key in the search input or clicking the search button
   * @returns
   */
  onClickFilter = () => {
    this.pageIndex = 1;
    this.store.setPageNumber("ts", this.pageIndex)
    this.store.setPageFilter("ts", this.filterValue)
    this.store.setPageFilter("ts_customer", this.filteredCustomer.id)
    this.getSourcesAndCount();
  }

  /**
   * this is called at changing page index
   */
  onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getSourcesAndCount();
  }

  paginate = (event) => {
    this.store.setPageNumber("ts", event.page+1)
    this.store.setPageSize("ts", event.rows)
    this.onPageIndexChange(event.page+1, event.rows);
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

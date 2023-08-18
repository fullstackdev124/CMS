import {Component, OnInit, ViewChild} from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from '@services/api/api.service'
import { ReceivingNumber } from '@app/models/receiving-number'
import { trigger, transition, query, style, animate } from '@angular/animations'
import { AnimationInterval, CMSUserType, PERMISSION_TYPE_DENY, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import { of, pipe } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import {MessageService} from "primeng/api";
import {Paginator} from "primeng/paginator";
import moment from "moment";
import {getUserTimezone} from "@app/helper/utils";

@Component({
  selector: 'app-receiving-numbers',
  templateUrl: './receiving-numbers.component.html',
  styleUrls: ['./receiving-numbers.component.scss'],
  animations: [

  ]
})
export class ReceivingNumbersComponent implements OnInit {

  receivingNumbers: ReceivingNumber[];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = 'number';
  sortDirection = 'asc';
  resultsLength = -1;
  totalCount = -1;

  isLoading = true;
  isExporting = false;
  pageSize = 10;
  pageIndex = 1;

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  @ViewChild('paginator', { static: true }) paginator: Paginator

  cmsUserType = CMSUserType
  filteredCustomer: any = {id: '', companyName: 'All'}
  customerList: any[] = []

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"

  userTimezoneOffset = 0

  constructor(public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location) { }

  async ngOnInit() {
    this.pageIndex = this.store.getPageNumber("receiving_number")
    this.pageSize = this.store.getPageSize("receiving_number")
    this.filterValue = this.store.getPageFilter("receiving_number")

    let sortActive = this.store.getPageFilter("receiving_number_sortActive")
    if (sortActive!="")
      this.sortActive = sortActive

    let sortDirection = this.store.getPageFilter("receiving_number_sortDirection")
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
        if (v.GuiSection.name == "ReceivingNumbers") {
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

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      await this.api.getAllCustomerList().subscribe(res => {
        this.customerList.push({id: '', companyName: 'All'})
        this.customerList = this.customerList.concat(res);
        let cus_id = this.store.getPageFilter("receiving_number_customer")
        this.filteredCustomer = this.customerList.find((item) => item.id==cus_id)
      })

    } else {
      this.customerList.push(this.store.getUser().Customer)
    }

    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }
    await this.api.getReceivingNumbersCount("", customerFilter).subscribe(res=> {
      this.totalCount = res.count;
    })


    /**************************** page started *************************/
    await this.getNumbers();
    setTimeout(() => {
      this.paginator.changePage(this.pageIndex-1)
    }, 10)
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

  getNumbers = async () => {
    this.isLoading = true;
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
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
      let filterValue = this.filterValue.trim()//.replace(/\D/g, '').replace(/\(/g, '').replace(/\-/g, '').replace(/\)/g, '');

      await this.api.getReceivingNumbersCount(filterValue, customerFilter)
        .pipe(tap(res => {
          this.resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getReceivingNumbers(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
        .pipe(tap(res => {
          let offset = this.userTimezoneOffset * 60000;

          res.body.map((item: any)=>{
            item.createdAt = item.createdAt? moment(new Date(item.createdAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
            item.updatedAt = item.updatedAt? moment(new Date(item.updatedAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
          })
          this.receivingNumbers = res.body
          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise()

    } catch (e) {

      this.isLoading = false
    }
  }

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
      this.api.downloadAllReceivingNumber(filterValue, customerFilter).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `ReceivingNumbers.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }

  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    this.store.setPageFilter("receiving_number_sortActive", this.sortActive)
    this.store.setPageFilter("receiving_number_sortDirection", this.sortDirection)
    this.store.setPageNumber("receiving_number", this.pageIndex)
    await this.getNumbers();
  }

  onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getNumbers();
  }

  paginate = (event) => {
    this.store.setPageNumber("receiving_number", event.page+1)
    this.store.setPageSize("receiving_number", event.rows)
    this.onPageIndexChange(event.page+1, event.rows);
  }

  onChangePageSize = async (event: Event) => {
    this.pageSize = +(event.target as HTMLInputElement).value;
    this.pageIndex = 1;
    await this.getNumbers();
  }


  onClickFilter = () => {
    this.pageIndex = 1
    this.store.setPageFilter("receiving_number", this.filterValue)
    this.store.setPageNumber("receiving_number", this.pageIndex)
    this.store.setPageFilter("receiving_number_customer", this.filteredCustomer.id)
    this.getNumbers();
  }

  onChangeFilter = (event: Event) => {
    // this.pageIndex = 1;
    // this.filterValue = (event.target as HTMLInputElement).value;
  }
}

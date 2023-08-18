import { GetNumbers } from '@app/models/tracking_numbers'
import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common';
import { ApiService } from '@services/api/api.service'
import { SipGateways } from '@app/models/sip-gateway'
import {
  CMSUserType,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY
} from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { RoutePath } from "@app/app.routes";
import { Paginator } from "primeng/paginator";
import moment from "moment";
import { getUserTimezone } from "@app/helper/utils";

@Component({
  selector: 'app-sipgateway',
  templateUrl: './sipgateway.component.html',
  styleUrls: ['./sipgateway.component.scss'],
  animations: [
  ],
  providers: [ConfirmationService]
})
export class SipGatewaysComponent implements OnInit {

  sipGateways: SipGateways[];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = 'order';
  sortDirection = 'asc';
  resultsLength = -1;
  isLoading = true;
  isExporting = false;
  pageSize = 10;
  pageIndex = 1;

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  trackingNumbers: GetNumbers[];

  blockContent = false

  totalCount = -1;

  @ViewChild('paginator', { static: true }) paginator: Paginator

  cmsUserType = CMSUserType
  filteredCustomer: any = { id: '', companyName: 'All' }
  customerList: any[] = []

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"

  userTimezoneOffset = 0

  constructor(public api: ApiService,
    public store: StoreService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private location: Location) {
  }

  async ngOnInit() {
    this.pageIndex = this.store.getPageNumber("sg")
    this.filterValue = this.store.getPageFilter("sg")
    this.pageSize = this.store.getPageSize("sg")

    let sortActive = this.store.getPageFilter("sg_sortActive")
    if (sortActive != "")
      this.sortActive = sortActive

    let sortDirection = this.store.getPageFilter("sg_sortDirection")
    if (sortDirection != "")
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
      // let guiVisibility = this.store.getGuiVisibility()
      //
      // this.permission = PERMISSION_TYPE_DENY
      // for (let v of guiVisibility) {
      //   if (v.GuiSection.name == "SipGateways") {
      //     this.permission = v.GuiPermission.name
      //     break
      //   }
      // }
      //
      // if (this.permission == PERMISSION_TYPE_DENY) {
      this.showWarn("You have no permission for this page")
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, NoPermissionAlertInteral)
      })
      this.location.back()
      // }
    }

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      await this.api.getAllCustomerList().subscribe(res => {
        this.customerList.push({ id: '', companyName: 'All' })
        this.customerList = this.customerList.concat(res);
        // this.filteredCustomer = {id: '', companyName: 'All'}
        // this.updateFilteredTrackingSources();
        let cus_id = this.store.getPageFilter("sg_customer")
        this.filteredCustomer = this.customerList.find((item) => item.id == cus_id)
      })

    } else {
      this.customerList.push(this.store.getUser().Customer)
    }

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")

    await this.getTotalCount();
    await this.getSipGateways()

    setTimeout(() => {
      this.paginator.changePage(this.pageIndex - 1)
    }, 10)
  }

  getTotalCount = async () => {
    this.totalCount = -1
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }

    await this.api.getSipGatewayCount("", customerFilter)
      .pipe(tap(res => {
        this.totalCount = res.count
      }), catchError((_) => {
        return of(0);
      })).toPromise();
  }

  /**
   * get sip gateways from backend via api
   */
  getSipGateways = async () => {
    this.isLoading = true;
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      if (this.filteredCustomer.id != "") {
        customerFilter = {
          customerId: this.filteredCustomer.id
        }
      }
    }

    try {
      let filterValue = this.filterValue.trim()//.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')
      await this.api.getSipGateways(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
        .pipe(tap(res => {
          let offset = this.userTimezoneOffset * 60000;

          res.body.map((item: any) => {
            item.createdAt = item.createdAt ? moment(new Date(item.createdAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
            item.updatedAt = item.updatedAt ? moment(new Date(item.updatedAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
          })
          this.sipGateways = res.body
          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getSipGatewayCount(filterValue, customerFilter)
        .pipe(tap(res => {
          this.resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();
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
      if (this.filteredCustomer.id != "") {
        customerFilter = {
          customerId: this.filteredCustomer.id
        }
      }
    }

    this.isExporting = true

    try {
      this.api.downloadAllSipGates(filterValue, customerFilter).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `SipGateways.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }


  /**
   * this is called at clicking header name of sip gateway table
   * @param name header name for sorting
   */
  onSortChange = async (name) => {
    this.sortActive = name
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    this.pageIndex = 1
    this.store.setPageFilter("sg_sortActive", this.sortActive)
    this.store.setPageFilter("sg_sortDirection", this.sortDirection)
    this.store.setPageNumber("sg", this.pageIndex)
    await this.getSipGateways()
  }

  /**
   * this is called at clicking page direction button like first, prev, next, last
   * @param pageIndex page index
   */
  onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getSipGateways()
  }

  /**
   *
   * @param event
   */
  onChangePageSize = async (event: Event) => {
    this.pageSize = +(event.target as HTMLInputElement).value;
    this.pageIndex = 1
    await this.getSipGateways()
  }

  /**
   * clear filter
   */
  onClearFilter = () => {
    this.filterValue = ''
    this.getSipGateways()
  }

  onClickFilter = () => {
    this.pageIndex = 1;
    this.store.setPageNumber("sg", this.pageIndex)
    this.store.setPageFilter("sg", this.filterValue)
    this.store.setPageFilter("sg_customer", this.filteredCustomer.id)
    this.getSipGateways()
  }

  /**
   * this is called at changing filter input field value
   * @param event filer input field
   */
  onChangeFilter = (event: Event) => {
    // this.pageIndex = 1;
    // this.filterValue = (event.target as HTMLInputElement).value
  }

  markDefaultOutboundGateway = (id) => {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to set default outbound gateway?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      key: "markDefaultDialog",
      accept: () => {
        this.blockContent = true
        this.api.markDefaultOutboundGateway(id).subscribe(res => {
          this.blockContent = false
          this.showSuccess('Updating Succeeded!')
          this.getSipGateways()
        }, e => {
          this.blockContent = false
          this.showError("Error in setting default outbound gateway: " + e)
        }, () => {
          this.blockContent = false
        })
      }
    });

  }

  paginate = (event) => {
    this.store.setPageNumber("sg", event.page + 1)
    this.store.setPageSize("sg", event.rows)
    this.onPageIndexChange(event.page + 1, event.rows);
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

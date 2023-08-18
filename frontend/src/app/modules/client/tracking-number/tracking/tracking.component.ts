import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core'
import { trigger, transition, query, style, animate} from '@angular/animations'
import {ActivatedRoute, Router} from '@angular/router'
import {Location, CommonModule} from '@angular/common';
import {GetNumbers, GetSources} from '../../../../models/tracking_numbers'
import {ApiService} from '../../../../services/api/api.service';
import { AnimationInterval, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY, CMSUserType, NoPermissionAlertInteral } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import { RoutingActionEnum } from '../../../../models/routing-action';
import {catchError, tap} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";
import {IUser} from "@app/models/user";
import {Paginator} from "primeng/paginator";
import moment from "moment";
import {getUserTimezone} from "@app/helper/utils";
import * as PhoneNumberLibrary from 'google-libphonenumber'



@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
  animations: [
  ]
})
export class TrackingComponent implements OnInit {
  // export class TrackingComponent extends TrackingParentComponent {

  pageSize = 10;
  pageIndex = 1;
  numbers: GetNumbers[] = [];
  sources: GetSources[] = [];
  orgSrcs: GetSources[] = [];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = 'tracking_number';
  sortDirection = 'asc';
  resultsLength = -1;
  totalCount = -1;
  isLoading = true;
  isExporting = false;
  indexes = [];
  id = null;
  state = false;
  activeId = null;
  activeState = false;
  isStop = false;
  changedId = null;
  open = false;
  isRender = false;
  fillValue = null;
  displayPages = [];

  routingActionEnum = RoutingActionEnum

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  isUpdatePastCalls = false

  userList: IUser[] = []

  @ViewChild('paginator', { static: true }) paginator: Paginator

  countOfNumbersViewed = 0

  cmsUserType = CMSUserType
  filteredCustomer: any = {id: '', companyName: 'All'}
  customerList: any[] = []

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"

  userTimezoneOffset = 0


  constructor(public api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private ref: ChangeDetectorRef,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location
  ) { }

  async ngOnInit() {
    this.pageIndex = this.store.getPageNumber("tracking_number")
    this.filterValue = this.store.getPageFilter("tracking_number")
    this.pageSize = this.store.getPageSize("tracking_number")

    let sortActive = this.store.getPageFilter("tracking_number_sortActive")
    if (sortActive!="")
      this.sortActive = sortActive

    let sortDirection = this.store.getPageFilter("tracking_number_sortDirection")
    if (sortDirection!="")
      this.sortDirection = sortDirection

    this.countOfNumbersViewed = this.store.getCountOfTrackingNumbers()

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
        if (v.GuiSection.name == "TrackingNumbers") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.messageService.add({ key: 'tst', severity: 'warning', summary: 'Warning', detail: "You have no permission for this page" });
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")

    // testing
    // this.checkPermission("TrackingNumbers", PERMISSION_TYPE_ALL)
    this.subscribeToQueryParams();

    await this.api.getAllUserList().subscribe(res => {
      this.userList = res
      this.userList.map(item => item.label = item.firstName + ' ' + item.lastName+" ("+item.Customer?.companyName+")")
    })

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      await this.api.getAllCustomerList().subscribe(res => {
        this.customerList.push({id: '', companyName: 'All'})
        this.customerList = this.customerList.concat(res);
        let cus_id = this.store.getPageFilter("tracking_number_customer")
        this.filteredCustomer = this.customerList.find((item) => item.id==cus_id)
        // this.updateFilteredTrackingSources();
      })

    } else {
      this.customerList.push(this.store.getUser().Customer)
    }

    await this.getSources();

    await this.getTotalCount()
    await this.getNumbersAndCount();

    setTimeout(() => {
      this.paginator.changePage(this.pageIndex-1)
    }, 10)
  }

  subscribeToQueryParams = () => {
    this.route.queryParams.subscribe(p => {
      if (p.routing) {
        this.filterValue = `routing:"${p.routing}"`;
      }
      if (p.receiving_number) {
        this.filterValue = p.receiving_number;
      }
    });
  };

  getTotalCount = async () => {
    this.isLoading = true;
    try {
      await this.api.getTrackingNumberCount("")
        .pipe(tap(res => {
          this.totalCount = res//.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    }
  }

  /**
   * get numbers and count information from the backend
   */
  getNumbersAndCount = async () => {
    this.isLoading = true;
    let filterValue = this.filterValue.trim()
    if (this.filterAttr != '') {
      filterValue = `${this.filterAttr}:"${filterValue}"`;
    }

    try {
      // Filter out extra characters
      // filterValue = filterValue.replace(/\D/g, '').replace(/\(/g, '').replace(/-/g, '').replace(/\)/g, '');

      // removed by jett.  2 times repeated.  22/08/11
      // await this.api.getTrackingNumbers(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
      //   .pipe(tap(res => {
      //     this.numbers = res.body;
      //   }), catchError((_) => {
      //     return of(0);
      //   })).toPromise();

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

      await this.api.getTrackingNumberCount(filterValue, customerFilter)
        .pipe(tap(res => {
          this.resultsLength = res//.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getTrackingNumbers(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
        .pipe(tap(res => {
          let offset = this.userTimezoneOffset * 60000;

          res.body.map((item: any)=>{
            item.createdAt = item.createdAt? moment(new Date(item.createdAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
            item.updatedAt = item.updatedAt? moment(new Date(item.updatedAt)).format(this.dateDisplayFormat.toUpperCase() + ' HH:mm:ss') : ''
          })
          this.numbers = res.body;
          // this.numbers.map(item => {
/*
            if (item.routing_action == RoutingActionEnum.DialAgent.key && item.agent_id!=null) {
              const u = this.userList.find((row) => row.id == item.agent_id)
              if (u!=null)
                item.agent_name = u.label
            }
*/
          // })
          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    }
  }

  /**
   * get tracking sources from backend
   */
  getSources = async () => {
    this.isLoading = true;

    try {
      await this.api.getTrackingSources('', '', 1, 10000, '')
        .pipe(tap(res => {
          const result = res.data.sort((a, b) => a.name > b.name ? 1 : -1)
          this.sources = result;
          this.orgSrcs = result;
          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    }
  }

  /**
   *
   * @param event
   */
  onChangePageSize = async (event: Event) => {
    this.pageSize = +(event.target as HTMLInputElement).value
    this.pageIndex = 1
    await this.getNumbersAndCount()
  }

  /**
   *
   */
  onSortChange = async (name) => {
    this.sortActive = name
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    this.pageIndex = 1
    this.store.setPageFilter("tracking_number_sortActive", this.sortActive)
    this.store.setPageFilter("tracking_number_sortDirection", this.sortDirection)
    this.store.setPageNumber("tracking_number", this.pageIndex)
    await this.getNumbersAndCount()
  }

  /**
   *
   * @param event
   */
  onChangeFilter = (event: Event) => {
    // this.pageIndex = 1
    // this.filterName = (event.target as HTMLInputElement).name
    // this.filterValue = (event.target as HTMLInputElement).value
  }

  /**
   *
   */
  onSearch = (event) => {
    this.filterAttr = ''
    this.filterValue = event.target.value
    this.pageIndex = 1
    this.store.setPageFilter("tracking_number", this.filterValue)
    this.store.setPageFilter("tracking_number_customer", this.filteredCustomer.id)
    this.store.setPageNumber("tracking_number", this.pageIndex)
    this.getNumbersAndCount()
  }

  /**
   *
   */
  onClickFilter = () => {
    this.filterAttr = ''
    this.pageIndex = 1
    this.store.setPageNumber("tracking_number", this.pageIndex)
    this.store.setPageFilter("tracking_number", this.filterValue)
    this.store.setPageFilter("tracking_number_customer", this.filteredCustomer.id)
    this.getNumbersAndCount()
  }

  /**
   * this is called at changing page index
   * @param pageIndex page index
   */
  onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.pageSize = pageRows
    this.pageIndex = pageIndex;
    await this.getNumbersAndCount()
  }

  paginate = (event) => {
    this.store.setPageNumber("tracking_number", event.page+1)
    this.store.setPageSize("tracking_number", event.rows)
    this.onPageIndexChange(event.page+1, event.rows);
  }

  /**
   * this is called at collapsing or expading source cell
   * @param id
   * @param state
   * @param check
   */
  onCollapseSource = async (id: number, state: boolean, check: boolean) => {
    this.id = id;
    this.state = state;


    if (check) {
      const num = this.numbers.find(n => n.id === id);
      if (this.changedId) {
        const source = this.sources.find(s => s.id === +this.changedId)
        num.tracking_sourceId = +this.changedId
        num.TrackingSources = source
        if (!num.hasOwnProperty('update_call_logs')) num.update_call_logs = false
        this.isLoading = true

        try {
          await this.api.saveDetailById(num, id)
            .pipe(tap(res => {
              this.changedId = null;
              this.isLoading = false;
            }), catchError((_) => {
              return of(0);
            })).toPromise();
        } catch (e) {

        }
      }
    }
  }

  onUpdateCallLogChange = (event, id) => {
    if (this.numbers) {
      this.numbers.map(number => {
        if (number.id === id) number.update_call_logs = event.target.checked;
      })
    }
  }

  /**
   *
   * @param id
   * @param state
   * @param check
   */
  onCollapseActive = (id: number, state: boolean, check: boolean) => {
    this.activeId = id;
    this.activeState = state;
    if (check && this.isStop) {
      this.router.navigate([RoutePath.tracking_number.delete_full + this.activeId]);
    }
  }

  /**
   *
   * @param event
   */
  onSelectCall = (event: any) => {
    this.isStop = event.target.value === 'stop';
  }

  /**
   *
   * @param event
   */
  onChangeSource = (event: any) => {
    this.changedId = event.target.value;
  }

  /**
   * @param attr
   * @param value
   */
  setFilter = (attr: string, value: string) => {
    this.filterAttr = attr
    this.filterValue = value;
    this.pageIndex = 1;
    this.getNumbersAndCount();
  }

  /**
   *
   * @param isOpen
   */
  onCollapse = (isOpen: boolean) => {
    this.open = isOpen;
    this.fillValue = null;
    this.sources = this.orgSrcs;
  }

  /**
   *
   * @param id
   * @param srcId
   */
  onAddSource = (id: number, srcId: any) => {
    this.changedId = srcId;
    this.numbers.find(n => n.id === id).tracking_sourceId = srcId;
    this.numbers.find(n => n.id === id).TrackingSources = this.sources.find(s => s.id === parseInt(srcId));
    this.open = false;
    this.fillValue = null;
    this.sources = this.orgSrcs;
  }

  /**
   *
   * @param event
   */
  onFilterSrcs = (event: Event) => {
    this.fillValue = (event.target as HTMLInputElement).value;
  }

  /**
   *
   */
  clickFilter = () => {
    this.sources = this.orgSrcs.filter(s => s.name.toLowerCase().includes(this.fillValue.toLowerCase()));
  }

  /**
   * this is called at clicking export button
   * @param event export button
   */
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

    let sorting = ""
    if (this.sortActive!="" && this.sortDirection!="")
      sorting = this.sortActive + " " + this.sortDirection

    this.isExporting = true

    try {
      this.api.downloadAllTrackingNumber(filterValue, customerFilter, sorting).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `TrackingNumbers.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }


}

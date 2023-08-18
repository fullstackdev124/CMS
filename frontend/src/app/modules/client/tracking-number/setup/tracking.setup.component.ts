import {ChangeDetectorRef, Component, OnInit} from '@angular/core'
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
@Component({
  selector: 'app-tracking-setup',
  templateUrl: './tracking.setup.component.html',
  styleUrls: ['./tracking.setup.component.scss'],
  animations: [
  ]
})
export class TrackingSetupComponent implements OnInit {
  // export class TrackingComponent extends TrackingParentComponent {
  numbers: GetNumbers[] = [];
  sources: GetSources[] = [];
  orgSrcs: GetSources[] = [];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = '';
  sortDirection = '';
  resultsLength = -1;
  isLoading = true;
  isExporting = false;
  id = null;
  state = false;
  activeId = null;
  activeState = false;
  isStop = false;
  changedId = null;
  open = false;
  isRender = false;
  fillValue = null;

  routingActionEnum = RoutingActionEnum

  cmsUserType = CMSUserType

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  isUpdatePastCalls = false

  countNumberPurchased = -1
  userList: IUser[] = []

  constructor(public api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private ref: ChangeDetectorRef,
    public store: StoreService,
    private messageService: MessageService,
    private location: Location
  ) { }

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
        if (v.GuiSection.name == "TrackingNumbers") {
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

    // testing
    // this.checkPermission("TrackingNumbers", PERMISSION_TYPE_ALL)

    /**************************** page started *************************/
    this.subscribeToQueryParams();

    await this.api.getAllUserList().subscribe(res => {
      this.userList = res
      this.userList.map(item => item.label = item.firstName + ' ' + item.lastName+" ("+item.Customer?.companyName+")")
    })

    await this.getSources();
    await this.getNumbersAndCount();
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

  /**
   * get numbers and count information from the backend
   */
  getNumbersAndCount = async () => {
    let filterValue = this.filterValue
    if (this.filterAttr != '') {
      filterValue = `${this.filterAttr}:"${filterValue}"`;
    }

    let customerFilter = {}

    let purchasedNumber = [];
    if (this.store.getReservedNumber()) {
      for (let v of this.store.getReservedNumber()) {
        purchasedNumber.push({tracking_number: v.number});
      }
    }

    if (purchasedNumber.length==0)
      return;

    customerFilter = { ...customerFilter, 'or' :  purchasedNumber };

    try {
      this.isLoading = true;
      // Filter out extra characters
      filterValue = filterValue.trim()//.replace('/\D/g', '');

      await this.api.getTrackingNumbers(this.sortActive, this.sortDirection, 1, purchasedNumber.length, filterValue, customerFilter)
        .pipe(tap(res => {
          this.numbers = res.body;
          this.numbers.map(item => {
            /*if (item.routing_action == RoutingActionEnum.DialAgent.key && item.agent_id!=null) {
              const u = this.userList.find((row) => row.id == item.agent_id)
              if (u!=null)
                item.agent_name = u.label
            }*/
          })
          this.countNumberPurchased = this.numbers.length < this.store.getReservedNumber().length ? this.numbers.length : this.store.getReservedNumber().length;
          this.isLoading = false
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
   */
  onSortChange = async (name) => {
    this.sortActive = name
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    await this.getNumbersAndCount()
  }

  /**
   *
   * @param event
   */
  onChangeFilter = (event: Event) => {
    this.filterName = (event.target as HTMLInputElement).name
    this.filterValue = (event.target as HTMLInputElement).value
  }

  /**
   *
   */
  onSearch = (event) => {
    this.filterAttr = ''
    this.filterValue = event.target.value
    this.getNumbersAndCount()
  }

  /**
   *
   */
  onClickFilter = () => {
    this.filterAttr = ''
    this.getNumbersAndCount()
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
    }

    this.isExporting = true

    try {
      this.api.downloadAllTrackingNumber(filterValue, customerFilter).subscribe(res => {
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

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  onSkip = () => {
    this.showWarn("You should have to setup number.")
    this.router.navigateByUrl(RoutePath.tracking_number.numbers)
  }
}

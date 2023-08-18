import {Component, OnInit, HostListener, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {Location} from '@angular/common';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {CallLog, PhoneBook} from '@app/models/callLog';
import {ApiService} from '@services/api/api.service';
import {DomSanitizer} from '@angular/platform-browser';
import {fromEvent, Subject} from 'rxjs';
// @ts-ignore
import moment from 'moment';
import {StoreService} from '@services/store/store.service';
import {pluck, take} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {
  FilterDate,
  DateOptions,
  AnimationInterval,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY,
  PERMISSION_TYPE_DENY,
  CMSUserType,
  NoPermissionAlertInteral, DISABLED_ALL_DAYS
} from '../../constant';
import {ActivatedRoute, Router} from '@angular/router';
import {getStartAndEndDate, getFilterDateMode, pad} from '../../utils';
import {ConfirmationService, MessageService} from "primeng/api";
import {getUserTimezone} from "@app/helper/utils";
import {Calendar} from "primeng/calendar";
import {RoutePath} from "@app/app.routes";
import {rawTimeZones, getTimeZones} from "@vvo/tzdb";
import {LayoutService} from "@services/app.layout.service";

@Component({
  selector: 'app-call-logs',
  templateUrl: './call-logs.component.html',
  providers: [ConfirmationService],
  styleUrls: ['./call-logs.component.scss'],
  animations: [
  ]
})

export class CallLogsComponent implements OnInit, OnDestroy, AfterViewInit {

  // pagination params
  pageIndex = 1;
  pageSize = 20;

  // filter params
  filterValue = ''
  filterUnit = ''
  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  strStartDate: string = null;
  strEndDate: string = null;


  totalCount = -1;
  totalRecords = -1
  sortActive = 'created';
  sortDirection = 'DESC';
  dateFilter = 'today';
  logs: any[] = [];
  showLogs: any[] = [];
  percentage = 0;

  searchValue = '';
  searchAttr = '';
  filterDateMode = '';
  additionalQuery = '';         // additional query value for call log api. is needed when the page is loading from activity page.

  // audio params
  isPlay = false;
  playId = null;
  content = null;

  // loading
  isLoading = false;
  isCountLoading = false;
  isApiCalling = false;
  isExporting = false;
  isStop = false;

  isAutoLoading = false;
  includeZeroDuration = false;

  // edit
  current = 'contact';
  phonebook: PhoneBook = {
    name: null,
    email: null,
    street: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    note: null,
    contact_number: null,
  };

  log: any = {};

  contactTab: boolean;
  emailTab: boolean = true;
  onEditing: boolean = false;
  editIndex: number = null;

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  editingPanelIndex = 0

  autoLoadTimer = null

  dtOptions = {};
  dtTrigger: Subject<any> = new Subject<any>();


  emailPanelAddress = ""
  emailPanelSubject = ""
  emailPanelContent = ""
  emailPanelIncludeCallRecord = false

  isFirst = true

  activityReportTitle = ""

  blacklist: any[] = []

  cmsUserType = CMSUserType
  filteredCustomer: any = {id: '', companyName: 'All'}
  customerList: any[] = []

  selectedDate!: any;
  selectedPrevDate!: any;

  @ViewChild('calendar') calendar!: Calendar;

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"

  datePickerLocale: any = {
    firstDayOfWeek: 0,
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dayNamesMin: ["Su","Mo","Tu","We","Th","Fr","Sa"],
    monthNames: [ "January","February","March","April","May","June","July","August","September","October","November","December" ],
    monthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
    today: 'Today',
    clear: 'Clear',
    dateFormat: this.datePickerFormat,
    weekHeader: 'Wk'
  }

  isFromActivityReport = false
  isFromOverviewReport = false

  userTimezoneOffset = 0


  constructor(
    public api: ApiService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public store: StoreService,
    public route: ActivatedRoute,
    private router: Router,
    public layoutService: LayoutService,
    private location: Location
  ) {
  }

  isMenuOpened = false
  ngAfterViewInit(): void {
    this.onResize(null)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    let body = document.getElementById("layout_main")
    document.getElementById("top_fixed_panel").style.width = body.clientWidth + "px"
  }

  overlayMenuOpenSubscription: Subscription;

  async ngOnInit() {
    this.overlayMenuOpenSubscription = this.layoutService.stateUpdate$.subscribe((state) => {
      if (state!=null) {
        this.isMenuOpened = !state.staticMenuDesktopInactive
        setTimeout(()=> {
          this.onResize(null)
        }, 50)
      }
    });

    setInterval(()=> {
      this.onResize(null)
    }, 100)

    // this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);

          resolve();
        }
      }, 100);
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      const guiVisibility = this.store.getGuiVisibility();

      this.permission = PERMISSION_TYPE_DENY;
      for (const v of guiVisibility) {
        if (v.GuiSection.name === 'CallLogs') {
          this.permission = v.GuiPermission.name;
          break;
        }
      }

      if (this.permission === PERMISSION_TYPE_DENY) {
        this.showWarn('You have no permission for this page')
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve();
          }, NoPermissionAlertInteral);
        });
        this.location.back();
      }
    } else {
      await this.api.getAllCustomerList().subscribe(res => {
        this.customerList.push({id: '', companyName: 'All'})
        this.customerList = this.customerList.concat(res);
        let cus_id = this.store.getPageFilter("receiving_number_customer")
        this.filteredCustomer = this.customerList.find((item) => item.id==cus_id)
      })
    }

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")
    this.datePickerLocale = {
      firstDayOfWeek: this.uiSettings.weekend,
      dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      dayNamesMin: ["Su","Mo","Tu","We","Th","Fr","Sa"],
      monthNames: [ "January","February","March","April","May","June","July","August","September","October","November","December" ],
      monthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
      today: 'Today',
      clear: 'Clear',
      dateFormat: this.datePickerFormat,
      weekHeader: 'Wk'
    }

    this.strStartDate =  moment(new Date()).format('YYYY-MM-DD') + " 00:00"
    this.strEndDate =  moment(new Date()).format('YYYY-MM-DD') + " 23:59"

    document.querySelector('#layout_wrapper').addEventListener('scroll', this.onScroll);

    await this.getBlackListNumbers()

    this.getParams();

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: this.pageSize,
      processing: true
    };

    this.getFilters();
  }

  ngOnDestroy(): void {
    document.querySelector('#layout_wrapper').removeEventListener('scroll', this.onScroll);
    this.stopAutoLoadTimer();

    if (this.overlayMenuOpenSubscription)
      this.overlayMenuOpenSubscription.unsubscribe();
  }

  startAutoLoadTimer() {
    if (this.autoLoadTimer != null) {
      return;
    }

    this.autoLoadTimer = setInterval(() => {
      if (!this.isAutoLoading) {
        return;
      }

      if (this.filterDateMode !== 'Today') {
        return;
      }

      if (this.isCountLoading) {
        return;
      }

      this.getLogsAndCount(true, false);
    }, 5000);
  }

  stopAutoLoadTimer() {
    clearInterval(this.autoLoadTimer);
    this.autoLoadTimer = null;
  }

  getDateStringOfCallRecord(created) {
    // const createdDate = new Date(created);
    return moment(created).utcOffset(-this.userTimezoneOffset).format('MMM DD, YYYY');
  }

  getTimeStringOfCallRecord(created) {
    // const createdDate = new Date(created);
    return moment(created).utcOffset(-this.userTimezoneOffset).format('HH:mm:ss');
  }

  /**
   *
   */
  getParams = () => {
    this.route.queryParams.subscribe(p => {
      if (p && p.strStartDate != undefined) {
        this.dateMode = p.dateMode;
        this.strStartDate = p.strStartDate + " 00:00";
        this.strEndDate = p.strEndDate + " 23:59";
        this.searchAttr = p.searchAttr;
        this.searchValue = p.searchValue;

        this.includeZeroDuration = true
        this.filterValue = this.searchValue

        if (p.from=='activity')
          this.isFromActivityReport = true
        else if (p.from=='overview')
          this.isFromOverviewReport = true
      }
    });
  }

  /**
   *
   */
  getFilters = () => {
    let sd = new Date(this.strStartDate)
    let ed = new Date(this.strEndDate)
    let days = (new Date(this.strEndDate.substring(0, 10)).getTime()-new Date(this.strStartDate.substring(0, 10)).getTime())/1000/60/60/24+1

    if (days<2) {
      this.selectedDate = [sd, null];
    } else {
      this.selectedDate = [sd, ed];
    }

    this.selectedPrevDate = [...this.selectedDate]

      this.filterDateMode = "" // getFilterDateMode(this.dateMode, this.strStartDate, this.strEndDate)

      // this is the code for getting all result from the server continuously
      // this.getAllResultsFromServer();
    let title1 = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
    if (this.selectedDate[1]!=null) {
      title1 += " ~ " +  moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())
    }

    if (this.selectedDate[1]==null) {
      const today = moment(new Date()).format(this.dateDisplayFormat.toUpperCase())
      const yesterday = moment(moment().subtract(1, "days").toDate()).format(this.dateDisplayFormat.toUpperCase())
      const dt = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())

      if (dt==today) {
        this.activityReportTitle = "Today"
        this.filterDateMode = "Today"
      }
      else if (dt==yesterday)
        this.activityReportTitle = "Yesterday"
      else
        this.activityReportTitle = "" + title1
    }
    else {
      let date = new Date();
      let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() -this.uiSettings.weekend)));
      let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend ) + 6));

      const today = moment(new Date()).format(this.dateDisplayFormat.toUpperCase())
      const stw = moment(startDate).format(this.dateDisplayFormat.toUpperCase())
      const etw = moment(endDate).format(this.dateDisplayFormat.toUpperCase())

      date = new Date();
      startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend )));
      endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend ) + 6));
      const slw = moment(startDate).format(this.dateDisplayFormat.toUpperCase())
      const elw = moment(endDate).format(this.dateDisplayFormat.toUpperCase())

      date = new Date();
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const stm = moment(startDate).format(this.dateDisplayFormat.toUpperCase())
      const etm = moment(endDate).format(this.dateDisplayFormat.toUpperCase())

      date = new Date();
      startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
      endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
      const slm = moment(startDate).format(this.dateDisplayFormat.toUpperCase())
      const elm = moment(endDate).format(this.dateDisplayFormat.toUpperCase())

      const st = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
      const et = moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())

      if (st==stw && (et==etw || et==today))
        this.activityReportTitle = "This Week"
      else if (st==slw && et==elw)
        this.activityReportTitle = "Last Week"
      else if (st==stm && (et==etm || et==today)) {
        this.dateMode = FilterDate.thisMonth
        this.activityReportTitle = "This Month"
      }
      else if (st==slm && et==elm) {
        this.dateMode = FilterDate.lastMonth
        this.activityReportTitle = "Last Month"
      }
      else
        this.activityReportTitle = "" + title1
    }

    this.isAutoLoading = !this.isAutoLoading && this.filterDateMode == 'Today'

    // this is the code for getting only one page result from the server
    this.pageIndex = 1
    this.getLogsAndCount()
  }

  /**
   * this is the function for getting all result from the server continuously
   */
  getAllResultsFromServer = async () => {
    this.logs = [];
    this.showLogs = [];
    this.pageIndex = 1;
    this.percentage = 0;
    this.isLoading = true;
    this.isStop = false;

    await this.getLogsAndCount();

    while (!this.isStop && this.logs.length < this.totalCount) {
      this.pageIndex++;
      await this.getLogsAndCount(false);
    }

    this.isLoading = false;
  }

  /**
   * this is the function for getting only one page.
   */
  getLogsAndCount(needCount = true, rewriteLogs = true): Promise<void> {
    return new Promise(async resolve => {
      this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)
      let offset = this.userTimezoneOffset * 60000;

      // console.log(this.searchValue, this.searchAttr)
      const timeValueForStartDate = new Date(this.strStartDate + ':00.000Z').getTime() + offset;
      const timeValueForEndDate = new Date(this.strEndDate + ':59.999Z').getTime() + offset;
      const d1 = new Date(timeValueForStartDate).toISOString().replace('T', ' ').substring(0, 19)
      const d2 = new Date(timeValueForEndDate).toISOString().replace('T', ' ').substring(0, 19)

      // Check if search value matches regex of numbers
      if (this.searchValue && this.searchValue.length) {
        // This should be number
        if (/^([0-9 ()-]{10,})$/.test(this.searchValue)) {
          this.searchValue = this.searchValue.replace(new RegExp('[()\\- ]', 'g'), '');
        } else {
          this.searchValue = this.searchValue.trim()
        }
      }

      let customConditions = this.includeZeroDuration ? null : {and: [{duration: {neq: null}}, {duration: {neq: 0}}]}

      let filterValue = '';
      if (this.searchAttr !== '') {
        if (this.searchAttr=='OpNumber.TrackingSources.name' && this.searchValue=='Unknown') {
          if (this.includeZeroDuration) {

          } else {

          }
        }
        else
          filterValue = `${this.searchAttr}:"${this.searchValue}"`;

      } else {
        filterValue = this.searchValue;
      }

      let customerFilter = null;
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        customerFilter = {
          customerId: this.store.getUser().customerId
        };
      } else {
        if (this.filteredCustomer.id!="") {
          customerFilter = {
            customerId: this.filteredCustomer.id
          }
        }
      }

      if (needCount) {
        this.totalCount = -1;
        this.isCountLoading = true;
        await this.api.getLogsCount(filterValue, d1, d2, customerFilter, customConditions).subscribe((data) => {
          this.totalCount = parseInt(data.count);
          this.totalRecords = this.totalCount

          this.isCountLoading = false;
        }, e => {
          this.isCountLoading = false;
        });
      }

      this.isApiCalling = true;
      await this.api.getLogs(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, customerFilter, customConditions)
        .subscribe((data) => {
          if (this.pageIndex === 1) {
            this.logs = data.body
          } else {
            // if (rewriteLogs) this.logs = [...this.logs, ...data.data];
            this.logs = [...this.logs, ...data.body];
          }

          this.isApiCalling = false;
          resolve();

        }, (e) => {
      });

      if (this.isFirst) {
        this.isFirst = false
        this.startAutoLoadTimer()
      }
    });
  }

  /**
   *
   */
  onStop = () => {
    this.isStop = true;
  }

  /**
   *
   * @param event
   */
  onChangeSearchValue = (event) => {
    this.searchAttr = '';
    this.searchValue = event.target.value;
  }

  onSearch = (event) => {
    this.searchAttr = '';
    this.searchValue = this.filterValue //event.target.value;
    this.pageIndex = 1;
    this.getLogsAndCount();
  }

  /**
   *
   */
  onClickSearch = () => {
    this.pageIndex = 1;
    this.getLogsAndCount();
  }

  /**
   *
   * @param event
   */
  @HostListener('window:scroll', ['$event'])
  onScroll = () => {
    let wrapper = document.querySelector('#layout_wrapper')
    // console.log(wrapper.scrollTop, wrapper.scrollHeight, window.innerHeight)
    const isLoading = wrapper.scrollHeight - wrapper.scrollTop - 100 <= window.innerHeight

    if (isLoading && !this.isApiCalling && (this.totalCount == -1 || this.logs.length < this.totalCount)) {
      this.pageIndex++;
      this.getLogsAndCount(false);
    }
  }

  /**
   *
   */
  setPageSize = () => {
    const height = window.innerHeight - 48 - 40 - 31;
    const times = height / 90;
    // tslint:disable-next-line: max-line-length
    if (times < 10) {
      this.pageSize = 10;
    } else if (times < 20) {
      this.pageSize = 20;
    } else if (times < 30) {
      this.pageSize = 30;
    } else if (times < 40) {
      this.pageSize = 40;
    } else if (times < 50) {
      this.pageSize = 50;
    }
  }

  /**
   *
   * @param key
   * @param value
   */
  onClickItem = (key: string = null, value: string) => {
    if (key == 'number' && value.includes('+1')) {
      this.searchValue = value.substring(2);
    } else {
      this.searchValue = value;
    }

    this.searchAttr = key;
    this.pageIndex = 1;
    this.filterValue = this.searchValue
    this.getLogsAndCount();
  }

  /**
   *
   * @param id
   * @param isPlay
   */
  onPlayAudio = (id: number, isPlay: boolean) => {
    if (isPlay) {
      try {
        this.api.getCallRecording(id).subscribe(res => {
          this.content = this.getUrl(res.content);
          this.playId = id;
          this.isPlay = isPlay;
        });

      } catch (e) {
      }
    } else {
      this.playId = id;
      this.isPlay = isPlay;
      this.content = null;
    }
  }

  /**
   *
   * @param content
   */
  getUrl = (content: string) => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(content);
  }


  /**
   *
   */
  onExport = () => {
    let startDate_timestamp = this.strStartDate.substring(0, 10)
    let endDate_timestamp = this.strEndDate.substring(0, 10)
    let offset = this.userTimezoneOffset

    this.isExporting = true;
    try {
      this.api.getCallLogExport(startDate_timestamp, endDate_timestamp, offset)
        .subscribe((data) => {
          let content = "Contact,Location,Caller Number,Tracking Source,Tracking Number,Duration,Metrics"
          content += "\n"

          data.result.forEach((item)=> {
            if (item.contact_name==null || item.contact_name=="")
              content += "Not Provided"+","
            else
              content += item.contact_name.replace(/,/g," ")+","

            if (item.state!=null || item.city!=null || item.country!=null) {
              if (item.state!=null)
                content += item.state.replace(/,/g," ") + " "
              if (item.city!=null)
                content += item.city.replace(/,/g," ") + " "
              if (item.country!=null)
                content += item.country.replace(/,/g," ")

              content += ",";
            } else {
              content += "No Location,";
            }

            content += item.caller_number + ","

            if (item.tracking_source!=null)
              content += item.tracking_source.replace(/,/g," ") + ","
            else
              content += "No Source,"

            if (item.tracking_number!=null)
              content += item.tracking_number + ","
            else
              content += "No Number,"

            content += Math.floor(item.duration/60) + ":" + pad(item.duration%60, 2) + ","

            content += moment(item.created).utcOffset(-this.userTimezoneOffset).format('MMM DD, YYYY HH:mm:ss');
            content += "\n"
          })

          /**
           * Generate CSV File By using encodeURI
           */
          const csvContent = 'data:text/csv;charset=utf-8,' + content;
          const url = encodeURI(csvContent);
          let fileName = 'Call_Logs_By_';
          if (this.dateMode === FilterDate.range) {
            const firstDate = moment(this.strStartDate).format('YYYY-MM-DD hh:mm');
            const lastDate = moment(this.strEndDate).format('YYYY-MM-DD hh:mm');
            fileName += 'Range(' + firstDate + ' ~ ' + lastDate + ').csv';

          } else {
            const firstDate = moment(this.strStartDate).format('YYYY-MM-DD');
            const lastDate = moment(this.strEndDate).format('YYYY-MM-DD');
            fileName += this.filterDateMode + '(' + firstDate + ' ~ ' + lastDate + ').csv';
          }

          const tempLink = document.createElement('a');
          tempLink.href = url;
          tempLink.setAttribute('download', fileName);
          tempLink.click();

          this.isExporting = false;
        });
    } catch (e) {
    }
  }

  /**
   *
   * @param section
   */
  onSelect = (section: string) => {
    this.current = section;
  }

  /**
   *
   * @param event
   */
  onChangePhonebook = (event: any) => {
    if (event.target.name === 'contact_number') {
      this.phonebook[event.target.name] = event.target.value.replace(/\D/g, '');
    } else {
      this.phonebook[event.target.name] = event.target.value;
    }
  }

  /**
   *
   * @param isClose
   */
  onSaveChange = async (isClose?: boolean) => {

    this.phonebook.contact_number = this.phonebook.contact_number && this.phonebook.contact_number.replace(/\D/g, '');
    try {
      await this.api.addPhoneBook(this.phonebook).subscribe(async (res) => {
        this.log.Phonebook = res;
        await this.api.saveLogById(this.log).subscribe(res => {
          this.showSuccess('Updating Succeeded')
        });
        isClose && this.onClose();
      });
    } catch (e) {
    }
  }

  sendEmail = () => {

  }

  getRowIndex = (data) => {
    return this.logs.indexOf(data)
  }

  /**
   *
   * @param index
   * @param type
   */
  onEditPanelCollapse = (index, type) => {
    if (!this.onEditing) {
      this.log = this.logs[index];
      this.logs.splice(index + 1, 0, {...this.log, isCollapse: true});
      this.onPhonebookInit(this.log);
      this.onEditing = true;
      this.editIndex = index;

      this.editingPanelIndex = 2;
    } else {
      this.logs = this.logs.filter(log => !log.isCollapse);
      if (this.editIndex === index) {
        this.editingPanelIndex = 0;
        this.onEditing = false;
        this.editIndex = null;
        this.log = null;

      } else {
        const newIndex = index > this.editIndex ? index - 1 : index;
        this.log = this.logs[newIndex];
        this.logs.splice(newIndex + 1, 0, {...this.log, isCollapse: true});
        this.onPhonebookInit(this.log);
        this.editIndex = newIndex;

        this.editingPanelIndex = 2;
      }
    }
  }

  onEditPanelCollapseForEmail = (index) => {
    if (!this.onEditing) {
      this.emailPanelAddress = ""
      this.emailPanelSubject = ""
      this.emailPanelContent = ""
      this.emailPanelIncludeCallRecord = false

      this.log = this.logs[index];
      this.logs.splice(index + 1, 0, {...this.log, isCollapse: true});
      this.onEditing = true;
      this.editIndex = index;

      this.editingPanelIndex = 1;
    } else {
      this.logs = this.logs.filter(log => !log.isCollapse);
      if (this.editIndex === index) {
        this.editingPanelIndex = 0;

        this.onEditing = false;
        this.editIndex = null;
        this.log = null;

      } else {
        this.emailPanelAddress = ""
        this.emailPanelSubject = ""
        this.emailPanelContent = ""
        this.emailPanelIncludeCallRecord = false

        const newIndex = index > this.editIndex ? index - 1 : index;
        this.log = this.logs[newIndex];
        this.logs.splice(newIndex + 1, 0, {...this.log, isCollapse: true});
        this.onPhonebookInit(this.log);
        this.editIndex = newIndex;

        this.editingPanelIndex = 1;
      }
    }
  }

  /**
   *
   * @param data
   */
  onPhonebookInit = (data) => {
    if (data.Phonebook) {
      this.phonebook = data.Phonebook;
      this.emailPanelContent = this.phonebook.note
    } else {
      this.phonebook = {
        name: null,
        email: null,
        street: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        note: null,
        contact_number: null,
      };
      this.emailPanelContent = ""
    }
  }

  /**
   *
   */
  onClose = () => {
    this.logs = this.logs.filter(log => !log.isCollapse);
    this.onEditing = false;
    this.editIndex = null;
  }

  /**
   *
   * @param name
   */
  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';

    // if (this.sortActive === 'source') {
    //   this.logs.sort((a, b) => {
    //     const first = a.OpNumber && a.OpNumber.TrackingSources && a.OpNumber.TrackingSources.name || '';
    //     const second = b.OpNumber && b.OpNumber.TrackingSources && b.OpNumber.TrackingSources.name || '';
    //     if (this.sortDirection === 'ASC') {
    //       return second.localeCompare(first);
    //     } else {
    //       return first.localeCompare(second);
    //     }
    //   });
    //   return

    // }

    this.pageIndex = 1;
    await this.getLogsAndCount(false);
  }

  getSubstring = (v: string) => {
    if(!v)return v;
    return v.substring(0, 10)
  }

  toggleFilterPanel() : void {
    this.filterPanelOpened = !this.filterPanelOpened
  }

  confirmSpam(log) {
    if (log.trackingNumber==null || log.trackingNumber=="")
      return

    let customerId = this.store.getUser().customerId
    const item = this.blacklist.find(item => {
      // TODO - disable it if admin can make same number as spam with different user
      if (item.customerId==1)
        return item.number==log.trackingNumber
      else
        return item.number==log.trackingNumber && item.customerId==log.customerId
    })

    let type = 1
    if (item) {
      if (customerId==1)
        type = 2
      else if (item.customerId==1)
        type = 0;
      else
        type = 2
    }

    if (type==0)
      return

    this.confirmationService.confirm({
      message: "Are you sure to " + (type==1 ? "Mark" : "Unmark") + " Spam?",
      header: 'Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.makeSpam(type==1, log, item)

      },
      reject: () => {
      },
      key: "overallDialog"
    });
  }

  makeSpam = async (isMark, log, blacklist) => {
    if (isMark)
      this.api.addBlacklistNumber({customerId: this.store.getUser().customerId, 'number': log.trackingNumber}).subscribe((data) => {
        this.showSuccess("Successfully marked!")
        this.getBlackListNumbers()
      }, e => {
      });
    else
      this.api.deleteBlacklistNumber(blacklist.id).subscribe((data) => {
        this.showSuccess("Successfully unmarked!")
        this.getBlackListNumbers()
      }, e => {
      });
  }

  getBlackListNumbers = async () => {
    await this.api.getBlacklistNumber(this.store.getUser().customerId).subscribe((data) => {
      this.blacklist = [...data]
    }, e => {
    });
  }

  isInBlacklist(log) {
    let customerId = this.store.getUser().customerId
    const item = this.blacklist.find(item => {
      // TODO - disable it if admin can make same number as spam with different user
      if (item.customerId==1)
        return item.number==log.trackingNumber
      else
        return item.number==log.trackingNumber && item.customerId==log.customerId
    })

    let type = 1
    if (item) {
      if (customerId==1)
        type = 2
      else if (item.customerId==1)
        type = 0;
      else
        type = 2
    }

    return type
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

  paginate = (event) => {
  }


  @HostListener("click", ["$event"])
  public onCalendarOutsideClick(event: any): void
  {
    if (this.isCalendar1Showing && this.calendar.isOutsideClicked(event))
      event.stopPropagation();
  }

  isCalendar1Showing = false
  isCloseByApplying = false
  onShowDateRangePicker = (event: any) => {
    this.isCalendar1Showing = true
  }
  onCloseDateRangePicker = (event: any) => {
    this.isCalendar1Showing = false
    if (this.isCloseByApplying)
      this.isCloseByApplying = false
    else
      this.onClickCancel()
  }


  onClickToday = () => {
    this.selectedDate = [new Date(), new Date()];
    this.dateMode = FilterDate.today;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickYesterday = () => {
    this.selectedDate = [moment().subtract(1, "days").toDate(), moment().subtract(1, "days").toDate()];
    this.dateMode = FilterDate.yesterday;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickLastWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend)));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastWeek;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickLastMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastMonth;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickThisMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisMonth;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickThisWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend)));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisWeek;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickApply = () => {
    if (this.selectedDate[1]==null)
      this.selectedDate[1] = this.selectedDate[0]

    this.isCloseByApplying = true
    this.onFilter();
    this.calendar.hideOverlay()
  }

  onClickCancel = () => {
    if (this.selectedPrevDate)
      this.selectedDate = [...this.selectedPrevDate]
    else
      this.selectedDate = null
    this.calendar.hideOverlay()
  }

  onFilter = async () => {
    // if (this.dateMode == FilterDate.month) {
    //   this.sDate = moment(moment(this.sMonth).format('YYYY-MM').toString() + "-01", 'YYYY-MM-DD').toDate()
    //   this.eDate = moment(moment(this.sMonth).endOf('month').format('YYYY-MM-DD'), 'YYYY-MM-DD').toDate()
    // }
    // if (moment(this.selectedDate[1]).format('YYYY-MM-DD')>moment(new Date()).format('YYYY-MM-DD'))
    //   this.selectedDate[1] = new Date()

    if (moment(this.selectedDate[0]).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD') && moment(this.selectedDate[1]).format('YYYY-MM-DD') ==  moment(new Date()).format('YYYY-MM-DD'))
      this.dateMode = FilterDate.today

    const startDate = moment(this.selectedDate[0]).format('YYYY-MM-DD') + ' 00:00';
    const endDate = moment(this.selectedDate[1]).format('YYYY-MM-DD') + ' 23:59';

    // await this.store.storeFilters({dateMode: this.dateMode, startDate: startDate, endDate: endDate})
    // this.store.setFilter()

    this.strStartDate = startDate
    this.strEndDate = endDate

    this.getFilters()
  }

  goBack() {
    if (this.isFromActivityReport)
      this.router.navigate([RoutePath.reports.activity_reports], {
        queryParams: {
          from: "call_log",
        }
      })

    else if (this.isFromOverviewReport)
      this.router.navigate([RoutePath.reports.overview], {
        queryParams: {
          from: "call_log",
        }
      })
  }

}


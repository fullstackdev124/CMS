import {
  AfterViewInit,
  Component,
  HostListener,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DecimalPipe, Location} from '@angular/common';
import {ApiService} from '@services/api/api.service';
import {
  CHART_COLORS,
  CMSUserType,
  DateOptions,
  FilterDate,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_READONLY
} from '../../constant';
// @ts-ignore
import {ActivatedRoute, Router} from '@angular/router';
import {ReportUnit, ViewItem} from '../enumtypes'
import {StoreService} from '@services/store/store.service';
import {MessageService} from "primeng/api";
import {catchError, tap} from "rxjs/operators";
import {of, Subscription} from "rxjs";
import {AppConfig, LayoutService} from "@services/app.layout.service";
import {getMonday, getMondayMoment, hexToRgbA, pad} from "@app/modules/client/utils";
import {CalcPeriodUniquePercPipe, getUserTimezone, MonthToUSMonth, TimeToUSTime} from "@app/helper/utils";
import moment from "moment";
import {RoutePath} from "@app/app.routes";
import {Calendar} from "primeng/calendar";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {UIChart} from "primeng/chart";

@Component({
  selector: 'app-report-activity',
  templateUrl: './report-activity.component.html',
  styleUrls: ['./report-activity.component.scss'],
  animations: [
  ]
})

export class ReportActivityComponent implements OnInit, OnDestroy, AfterViewInit {

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  filterValue = ''
  filterUnit = 'D'
  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  dateMode1 = ""

  fromValue = null;
  toValue = null;

  fromCompareValue = null
  toCompareValue = null

  isLoading = false


  graphTypes: any[] = [
    { label: 'Hour', value: 'H' },
    { label: 'Day', value: 'D' },
    { label: 'Week', value: 'W' },
    { label: 'Month', value: 'M' }
  ];
  selectedGraphType:string = 'D'
  disabledGraphTypes = [ false, false, false, false, false ]
  chartType: string = 'bar'
  chartTypes: any[] = [
    { icon: 'pi pi-chart-bar', value: 'bar' },
    { icon: 'pi pi-chart-line', value: 'line' },
    // { icon: 'pi pi-sliders-v', value: 'candle' },
  ];

  types : any[] = [
    { key: ViewItem.trackingSource, value: ViewItem.trackingSource },
    { key: ViewItem.compare, value: ViewItem.compare },
    // { key: ViewItem.hour, value: ViewItem.hour },
  ]
  selectedTypes = { key: ViewItem.trackingSource, value: ViewItem.trackingSource }
  selectedType = ViewItem.trackingSource  // viewItem

  isDisabledSelectingChartType = false
  isSingleDataset = false
  singleDataset: any[] = []

  legends : any[] = [
  ]
  selectedLegends: any[] = []
  savedLegends: any[] = []

  @ViewChild('chart', { static: false }) chart: UIChart;
  @ViewChild('compareChart', { static: false }) compareChart: UIChart;

  @ViewChild('calendar1') calendar1!: Calendar;
  @ViewChild('calendar2') calendar2!: Calendar;

  subscription: Subscription;
  config: AppConfig;

  chartData: any
  chartOptions: any
  chartCompareData: any
  chartCompareOptions: any

  isCompareBySource = false

  chartDataLabelPlugin = ChartDataLabels
  chartPlugins = [
    this.chartDataLabelPlugin,
    {
      afterRender: () => {
        this.blockContent = false
      },
    },
  ]

  needReload = true
  needLegendReload = false

  activityReportTitle = ""

  selectedDate!: any;
  selectedPrevDate!: any;
  selectedCompareDate!: any;
  selectedPrevCompareDate!: any;

  mainResult: any = {}
  compareResult: any = {}

  mainData: any = {stats: {}, data:[], list:[], summary: {}}
  compareData: any = {stats: {}, data:[], list:[], summary: {}}

  compareYAxis = 0

  blockContent = false
  includeDataLabel = false
  isStacked = false

  legendLabel = ""
  filterActivityTitle = ""
  filterActivityTitle1 = ""

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

  isFromCallLog = false

  userTimezoneOffset = 0

  isLegend = false
  legendTitle1 = ""
  legendTitle2 = ""

  constructor(public api: ApiService, public router: Router,
              public route: ActivatedRoute,
              private store: StoreService, private messageService: MessageService,
              private location: Location, private layoutService: LayoutService,
              public periodPipe: CalcPeriodUniquePercPipe, public decimalPipe: DecimalPipe) {
    this.initilizeData()
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

  ngOnDestroy(): void {
    if (this.subscription)
      this.subscription.unsubscribe();

    if (this.overlayMenuOpenSubscription)
      this.overlayMenuOpenSubscription.unsubscribe();
  }

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

    // this.router.routeReuseStrategy.shouldReuseRoute = () => true;
    this.includeDataLabel = this.store.getPageFilter("activity_report_datalabel")=="true"
    this.isStacked = this.store.getPageFilter("activity_report_stacked")=="true"

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
        if (v.GuiSection.name == "ActivityReports") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
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

    this.config = this.layoutService.getConfig();
    this.updateChartOptions();

    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.config = config;
      this.updateChartOptions();
    });

    await this.getParams();
    if (this.isFromCallLog) {
      if (this.selectedType=='Compare') {
        if (this.isCompareBySource) {

        } else {
          if (moment(this.selectedCompareDate[1]).format('YYYY-MM-DD')>moment(new Date()).format('YYYY-MM-DD'))
            this.selectedCompareDate[1] = new Date()

          const startDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')// + ' 00:00';
          const endDate = moment(this.selectedCompareDate[1]).format('YYYY-MM-DD')// + ' 23:59';

          let sd = new Date(startDate)
          let ed = new Date(endDate)
          let days_2 = (new Date(endDate.substring(0, 10)).getTime()-new Date(startDate.substring(0, 10)).getTime())/1000/60/60/24+1

          if (days_2<2) {
            this.selectedCompareDate = [sd, null];
          } else {
            this.selectedCompareDate = [sd, ed];
          }

          // this.dateMode = this.dateMode;
          this.fromValue = startDate//.replace('T', ' ');
          this.toValue = endDate//.replace('T', ' ');

        }

        this.selectedTypes = { key: ViewItem.compare, value: ViewItem.compare }
      }

      this.onFilter();
    } else {
      this.selectedDate = [new Date(), new Date()];
      this.dateMode = FilterDate.today;
      this.onFilter();
    }
    // this.getFilters()
  }

  getParams = async () => {
    await this.route.queryParams.subscribe(p => {
      if (p && p.from=="call_log") {
        let page_data = this.store.getPageFilter("activity_report_data")
        if (page_data!="") {
          let data: any = JSON.parse(page_data)

          this.selectedType = data.selectedType
          if (data.selectedDate.length==2)
            this.selectedDate = [ new Date(Date.parse(data.selectedDate[0])), new Date(Date.parse(data.selectedDate[1])) ]
          else
            this.selectedDate = [ new Date(Date.parse(data.selectedDate[0])), new Date(Date.parse(data.selectedDate[0])) ]

          this.savedLegends = data.selectedLegends
          if (this.selectedType=='Compare') {
            this.isCompareBySource =  data.isComparingBySource
            if (this.isCompareBySource) {
            } else {
              if (data.selectedCompareDate.length==2)
                this.selectedCompareDate = [ new Date(Date.parse(data.selectedCompareDate[0])), new Date(Date.parse(data.selectedCompareDate[1])) ]
              else
                this.selectedCompareDate = [ new Date(Date.parse(data.selectedCompareDate[0])), new Date(Date.parse(data.selectedCompareDate[0])) ]
            }
          }

          this.selectedGraphType = data.selectedGraphType
          this.chartType = data.chartType

          this.isFromCallLog = true
        }

        this.store.setPageFilter("activity_report_data", "")
      }
    });
  }

  getFilters = () => {
    let sd = new Date(this.fromValue + " 00:00:00")
    let ed = new Date(this.toValue + " 23:59:59")
    let days = (new Date(this.toValue.substring(0, 10)).getTime()-new Date(this.fromValue.substring(0, 10)).getTime())/1000/60/60/24+1

    if (days<2) {
      this.selectedDate = [sd, null];
    } else {
      this.selectedDate = [sd, ed];
    }

    this.selectedPrevDate = [...this.selectedDate]

    if (this.isFromCallLog) {
      if (days<2) {
        this.disabledGraphTypes = [ false, false, true, true, true ]
      } else if (days==7) {
        this.disabledGraphTypes = [ true, false, false, true, true ]
      } else if (days<15) {
        this.disabledGraphTypes = [ true, false, false, true, true ]
      } else {
        this.disabledGraphTypes = [ true, false, true, false, true ]
      }

      this.filterUnit = this.selectedGraphType

      this.activityReportlist()
      return;
    }

    if (days<2) {
      this.disabledGraphTypes = [ false, false, true, true, true ]
      if (this.selectedGraphType=='W' || this.selectedGraphType=='M') {
        this.onSetFilter('H')
        return
      }
    } else if (days==7) {
      this.disabledGraphTypes = [ true, false, false, true, true ]
      this.onSetFilter('W')

      // } else if (days<8) {
      //   this.disabledGraphTypes = [ true, false, false, true, true ]
      //   if (this.selectedGraphType=='H' || this.selectedGraphType=='W') {
      //     this.onSetFilter('D')
      //     return
      //   }
    } else if (days<15) {
      this.disabledGraphTypes = [ true, false, false, true, true ]
      if (this.selectedGraphType=='H' || this.selectedGraphType=='M') {
        this.onSetFilter('D')
        return
      }

      // } else if (days<21) {
      //   this.disabledGraphTypes = [ true, false, true, true, true ]
      //   if (this.selectedGraphType=='H' || this.selectedGraphType=='W' || this.selectedGraphType=='M') {
      //     this.onSetFilter('D')
      //     return
      //   }
    } else {
      this.disabledGraphTypes = [ true, false, true, false, true ]
      // if (this.selectedGraphType=='H') {
      this.onSetFilter('M')
      return
      // }
    }

    this.activityReportlist();
  }

  onChangeType = (event) => {
    this.selectedType = event.value.key
    if (this.selectedType==ViewItem.hour)
      this.isLegend = false

    this.graphTypes = [
      { label: 'Hour', value: 'H' },
      { label: 'Day', value: 'D' },
      { label: 'Week', value: 'W' },
      { label: 'Month', value: 'M' }
    ]

    this.getFilters()
  }

  onSetFilter = (type) => {
    if (type!=this.filterUnit)
      this.needReload = true
    this.filterUnit = type
    this.selectedGraphType = type

    this.activityReportlist()
  };

  onSetChart = (event) => {
    if (this.selectedType==ViewItem.compare) {
      // if (this.selectedGraphType=='H')
      this.chartType = event.option.value
//       else
      // this.chartType = "line"
      // this.activityReportlist()
    }
    else
      this.chartType = event.option.value
    // this.upgradeChartOptions()
    // this.chartData = { ...this.chartData }
    // if (this.isGraphTypeChanged)
    this.activityReportlist()
  };

  activityReportlist = async () => {
    let userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)
    if (userTimezoneOffset!=this.userTimezoneOffset) {
      this.userTimezoneOffset = userTimezoneOffset
      this.needReload = true
      this.needLegendReload = true
    }

    if (!this.needReload) {
      this.makeChart()
      return
    }

    if (this.selectedType==ViewItem.compare && !this.isCompareBySource && this.selectedCompareDate==null)
      return

    try {
      let viewBy = 2 // this.selectedType==ViewItem.trackingSource ? 2 : 0  // means tracking source
      let interval = ''  // interval for loading
      switch (this.filterUnit) {
        case ReportUnit.hour:
          interval = 'hour'
          break
        case ReportUnit.day:
          interval = 'day'
          break
        case ReportUnit.week:
          interval = 'week'
          break
        case ReportUnit.month:
          interval = 'month'
          break
      }

      let filterValue = this.filterValue.trim()

      let offset = this.userTimezoneOffset// * 60000;

      let startDate_timestamp1 = new Date(this.fromValue + " 00:00:00").getTime()
      let endDate_timestamp1 = new Date(this.toValue + " 23:59:59").getTime()

      this.isLoading = true
      this.activityReportTitle = ""
      this.filterActivityTitle = ""
      this.filterActivityTitle1 = ""
      await this.api.activityReport(this.fromValue, this.toValue, offset)
        .pipe(tap((report_result1: any) => {
          let options_data: any = this.makeGraphData(report_result1.result, startDate_timestamp1, endDate_timestamp1, (-1)*offset , interval, viewBy)
          this.mainResult = options_data

          if (this.selectedType==ViewItem.compare) {
            if (this.isCompareBySource) {
              this.isLoading = false
              this.blockContent = true

              this.needReload = false
              this.makeLegends()
            }
            else {
              const startDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')// + ' 00:00:00';
              let endDate
              if (this.selectedCompareDate[1]==null)
                endDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')// + ' 23:59:59';
              else
                endDate = moment(this.selectedCompareDate[1]).format('YYYY-MM-DD')// + ' 23:59:59';

              this.fromCompareValue = startDate
              this.toCompareValue = endDate

              const startDate_timestamp2 = new Date(startDate + " 00:00:00").getTime()
              const endDate_timestamp2 = new Date(endDate + " 23:59:59").getTime()

              this.api.activityReport(startDate, endDate, offset)
                .pipe(tap((report_result: any) => {
                  this.isLoading = false
                  this.blockContent = true

                  let result2: any = this.makeGraphData(report_result.result, startDate_timestamp2, endDate_timestamp2, (-1)*offset , interval, viewBy)
                  this.compareResult = result2// {graph: result2, result: report_result.result, start: startDate_timestamp, end: endDate_timestamp, offset: (-1)*offset/60000, interval: report_result.req.interval, view_by: report_result.req.view_by}

                  this.needReload = false
                  this.makeLegends()
                }), catchError((_) => {
                  this.isLoading = false;
                  return of(0);
                })).toPromise();
            }
          }
          else {
            this.isLoading = false
            this.blockContent = true

            this.needReload = false
            this.makeLegends()
          }
        }), catchError((_) => {
          this.isLoading = false;
          return of(0);
        })).toPromise();
    } catch (e) {

    }
  }

  makeGraphData(logs, sdate, edate, offset, interval, view_by) {
    let chartOptions: any = {xAxis: {categories: []}, series: []};

    // Build xAxis categories based on interval
    const dates = [];
    let l_sdate = new Date(sdate);
    let l_edate = new Date(edate);
    const m_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build categories interval by Week
    if (interval === '1' || interval === 'hour') {
      for (let i = 0; i <= 23; i++) {
        const actual_hour = pad(i, 2);
        if (!dates.includes(actual_hour)) dates.push(actual_hour);
      }
    }
    else if (interval === '2' || interval === 'week') {
      const from = new Date(l_sdate.getTime())
      const today = new Date().getTime()
      const e_edate = new Date(today-today%86400000+from.getTimezoneOffset()*60*1000)
      if (l_edate>e_edate)
        l_edate = e_edate
      while (l_sdate <= l_edate) {
        // Retrieve counted week first day
        let s_date = getMonday(l_sdate, this.uiSettings.weekend)
        if (s_date.getTime()<from.getTime())
          s_date = new Date(from.getTime())

        let actual_weekday = pad(s_date.getMonth() + 1, 2) + this.dateFormatDelimiter + pad(s_date.getDate(), 2);
        // Just to be sure
        if (!dates.includes(actual_weekday)) dates.push(actual_weekday);
        // Go to next week
        // l_sdate.setTime()
        l_sdate.setDate(l_sdate.getDate() + 1 * 7);
        // Add tailend
        if (l_sdate > l_edate) {
          // Retrieve counted week first day
          s_date = getMonday(l_edate, this.uiSettings.weekend)
          if (s_date.getTime()<from.getTime())
            s_date = new Date(from.getTime())
          actual_weekday = pad(s_date.getMonth() + 1, 2) + this.dateFormatDelimiter + pad(s_date.getDate(), 2);
          // Just to be sure
          if (!dates.includes(actual_weekday)) dates.push(actual_weekday);
        }
      }
      // Build categories interval by Month
    }
    else if (interval === '3' || interval === 'month') {
      const from = new Date(l_sdate.getTime())
      const today = new Date().getTime()
      const e_edate = new Date(today-today%86400000+from.getTimezoneOffset()*60*1000)
      if (l_edate>e_edate)
        l_edate = e_edate

      while (l_sdate <= l_edate) {
        // Retrieve counted month
        let actual_month = m_names[l_sdate.getMonth()] + " " + l_sdate.getFullYear();
        // Just to be sure
        if (!dates.includes(actual_month)) dates.push(actual_month);
        // Go to next month
        l_sdate.setMonth(l_sdate.getMonth() + 1);
        // Add tailend
        if (l_sdate > l_edate) {
          // Retrieve tail end month
          actual_month = m_names[l_edate.getMonth()] + " " + l_edate.getFullYear();
          // Just to be sure
          if (!dates.includes(actual_month)) dates.push(actual_month);
        }
      }
      // Hourly categories interval doesn't seems to be used in original report, reverting default to daily
    }
    else {
      const from = new Date(l_sdate.getTime())
      const today = new Date().getTime()
      const e_edate = new Date(today-today%86400000+from.getTimezoneOffset()*60*1000)
      if (l_edate>e_edate)
        l_edate = e_edate

      while (l_sdate <= l_edate) {
        // Retrieve counted day
        let actual_day = pad(l_sdate.getMonth() + 1, 2) + this.dateFormatDelimiter + pad(l_sdate.getDate(), 2);
        // Just to be sure
        if (!dates.includes(actual_day)) dates.push(actual_day);
        // Go to next month
        l_sdate.setDate(l_sdate.getDate() + 1);
        // Add tailend
        if (l_sdate > l_edate) {
          // Retrieve tail end month
          actual_day = pad(l_edate.getMonth() + 1, 2) + this.dateFormatDelimiter + pad(l_edate.getDate(), 2);
          // Just to be sure
          if (!dates.includes(actual_day)) dates.push(actual_day);
        }
      }
    }

    // Rebuild JSON Object with categories
    if (dates.length > 0) chartOptions.xAxis.categories = dates;

    // Cycly through collected call logs
    let series: any = [];
    let discarded = 0;
    let table_data: any = {globals: {
        total_calls: 0,
        total_time: 0,
        // total_contact: {},
        series_data: new Array(dates.length).fill(0),
        duration_data: new Array(dates.length).fill(0),
        // period_contacts: new Array(dates.length).fill({}),
      }};

    logs = JSON.parse(JSON.stringify(logs));
    let color_index = 0
    for(let i = 0; i < logs.length; i++) {
      let log = logs[i];

      let created = moment(log.at).utcOffset(offset)
      // created.add(offset, 'minutes')

      // Organize by intervals
      let int_step = null;

      // Interval by Hour
      if (interval === '1' || interval === 'hour') int_step = pad(created.hour(), 2);
      // Interval by Week
      else if (interval === '2' || interval === 'week') {
        let dt = getMondayMoment(created, this.uiSettings.weekend)
        int_step = pad(dt.month() + 1, 2) + this.dateFormatDelimiter + pad(dt.date(), 2);
        if (int_step<dates[0])
          int_step = dates[0]
        else if (int_step>dates[dates.length-1])
          int_step = dates[dates.length-1]
      }
      // Interval by Month
      else if (interval === '3' || interval === 'month') {
        int_step = m_names[created.month()] + " " + created.year();
      }
      // Revert by Day - default
      else int_step = pad(created.month() + 1, 2) + this.dateFormatDelimiter + pad(created.date(), 2);

      // Retrieve series name (done by tracking source or hour)
      let series_key = log.na==null ? "Unknown" : log.na;
      if (view_by === 0 || view_by === '0') series_key = pad(created.hour(), 2);

      // Initialize series and table_data object
      // if (!series.hasOwnProperty(series_key)) {
      if(null == series[series_key]) {
        // let random_color = "#" + Math.floor(Math.random()*16777215).toString(16);
        const random_color = CHART_COLORS[color_index]
        series[series_key] = {
          total_calls: 0,
          total_time: 0,
          // total_contact: {},
          name: '',
          color: random_color,
          series_data: new Array(dates.length).fill(0),
          duration_data: new Array(dates.length).fill(0),
          // period_contacts: new Array(dates.length).fill({}),
        };
        color_index++
      }

      // Update Series Main Custom Counter
      series[series_key].total_calls += 1;
      series[series_key].total_time += log.dt;

      // Calculate Top Contacts
      let contact = null;
      // if (log.hasOwnProperty('Phonebook')) {
      // if(log.cn!=null) {
      //   contact = log.cn;
      //   if(null == series[series_key].total_contact[contact])
      //     series[series_key].total_contact[contact] = 0;
      //   series[series_key].total_contact[contact] += 1;
      // }

      // Update Series specific counter
      const s_index = dates.indexOf(int_step);
      if (s_index >= 0) {
        series[series_key].series_data[s_index] += 1;
        series[series_key].duration_data[s_index] += log.dt;

        // Update totals counter
        // if (!table_data.hasOwnProperty('globals'))
        if(null == table_data['globals'])
          table_data['globals'] = {
            total_calls: 0,
            total_time: 0,
            total_contact: {},
            series_data: new Array(dates.length).fill(0),
            duration_data: new Array(dates.length).fill(0),
            period_contacts: new Array(dates.length).fill(0),
          };

        table_data['globals'].total_calls += 1;
        table_data['globals'].total_time += log.dt;
        table_data['globals'].series_data[s_index] = table_data['globals'].series_data[s_index] + 1;
        table_data['globals'].duration_data[s_index] = table_data['globals'].duration_data[s_index] + log.dt;

        // if(log.cn!=null) {
        //   contact = log.cn;
        //   if(null == table_data['globals'].total_contact[contact])
        //     table_data['globals'].total_contact[contact] = 0;
        //   table_data['globals'].total_contact[contact] += 1;
        //
        //   if(null == table_data['globals'].period_contacts[s_index][contact])
        //     table_data['globals'].period_contacts[s_index][contact] = 0;
        //   table_data['globals'].period_contacts[s_index][contact] += 1;
        //
        //   if(null == series[series_key].period_contacts[s_index][contact])
        //     series[series_key].period_contacts[s_index][contact] = 0;
        //   series[series_key].period_contacts[s_index][contact] += 1;
        // }

        // Sort table content by key -- WARN it takes really long
        // table_data = jsonSortByKey(table_data);
      } else {
        discarded++
        // console.log('[EE] Index error:', offset, int_step, log.at, created);
      }
      // }
      // else {
      //   // Only for debugging purpose
      //   // log.discard_message = "Not existent Tracking Source";
      //   // console.log('Not Existent Tracking Source:', JSON.stringify(log));
      //   discarded++;
      // }
    }

    table_data['globals'].total_calls += discarded

    // Attach series to object
    let series_data = [];

    Object.keys(series).forEach(function (key) {
      series[key].name = key;
      series_data.push(series[key]);
    });

    // Rebuild JSON Object with categories
    if (series_data.length > 0) chartOptions.series = series_data;

    // Attach tabular data object
    chartOptions.tabular = JSON.parse(JSON.stringify(table_data));

    return chartOptions
  }

  buildTable(options_data) {
    let overall_period_unique = 0
    let tableData = [];
    let call_max = 0

    let total = [0, 0]

    if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
      call_max = 0;
    } else {
      call_max = options_data.tabular.globals.total_calls;
      if (call_max==null)
        call_max = 0

      for (let i = 0; i < options_data.series.length; i++) {
        let name = options_data.series[i]['name']
        const ds = this.selectedLegends.find(row => row.label==name)
        if (ds==null)
          continue
        const int_call_num = options_data.series[i]['total_calls']

        let percent = call_max==0 ? 0 : int_call_num / call_max
        percent = percent * 100
        percent = this.decimalFormatted(percent, 2)

        // let period_unique = this.calcPeriodUnique(options_data.series[i]['total_contact'])
        // overall_period_unique += period_unique

        // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
        //   name = TimeToUSTime[name]

        tableData.push({
          'name': name,
          'total_calls': options_data.series[i]['total_calls'],
          'total_time': Math.round(options_data.series[i]['total_time'] / 60),
          // 'period_unique': period_unique,
          'avg_time': this.getHour(options_data.series[i]['total_time'], options_data.series[i]['total_calls']),
          'color': options_data.series[i]['color'],
          // 'data': options_data.series[i]['series_data'],
          'percent': percent
        })

        total[0] += options_data.series[i]['total_calls']
        total[1] += options_data.series[i]['total_time']
      }
    }

    let tableDataGeneral = {
      'name': 'Totals',
      'total_calls': total[0], // options_data.tabular.globals['total_calls'],
      'total_time':  Math.round(total[1]/60), // Math.round(options_data.tabular.globals['total_time'] / 60),
      'avg_time': this.getHour(total[1], total[0]), //this.getHour(options_data.tabular.globals['total_time'], options_data.tabular.globals['total_calls']),
      // 'color': options_data.tabular.globals['color'],
      // 'data': options_data.tabular.globals['series_data'],
      // 'overall_period_unique': overall_period_unique
    }

    tableData = tableData.filter(item => item.total_calls>0)
    tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

    const list = [...tableData]
    const summary = {...tableDataGeneral}
    return {stats: tableDataGeneral, summary, data: tableData, list}
  }

  buildTableForSource(options_data, legend) {
    let overall_period_unique = 0
    let tableData = [];
    let call_max = 0

    let total = [0, 0]

    if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
      call_max = 0;
    }
    else {
      call_max = options_data.tabular.globals.total_calls;
      if (call_max==null)
        call_max = 0

      for (let i = 0; i < options_data.series.length; i++) {
        let name = options_data.series[i]['name']
        const int_call_num = options_data.series[i]['total_calls']

        let percent = call_max==0 ? 0 : int_call_num / call_max
        percent = percent * 100
        percent = this.decimalFormatted(percent, 2)

        // let period_unique = this.calcPeriodUnique(options_data.series[i]['total_contact'])
        // overall_period_unique += period_unique

        // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
        //   name = TimeToUSTime[name]

        if (name==legend) {
          tableData.push({
            'name': name,
            'total_calls': options_data.series[i]['total_calls'],
            'total_time': Math.round(options_data.series[i]['total_time'] / 60),
            // 'period_unique': period_unique,
            'avg_time': this.getHour(options_data.series[i]['total_time'], options_data.series[i]['total_calls']),
            'color': options_data.series[i]['color'],
            // 'data': options_data.series[i]['series_data'],
            'percent': percent
          })

          total[0] += options_data.series[i]['total_calls']
          total[1] += options_data.series[i]['total_time']
        }
      }
    }

    let tableDataGeneral = {
      'name': 'Totals',
      'total_calls': total[0], // options_data.tabular.globals['total_calls'],
      'total_time':  Math.round(total[1]/60), // Math.round(options_data.tabular.globals['total_time'] / 60),
      'avg_time': this.getHour(total[1], total[0]), //this.getHour(options_data.tabular.globals['total_time'], options_data.tabular.globals['total_calls']),
      // 'color': options_data.tabular.globals['color'],
      // 'data': options_data.tabular.globals['series_data'],
      // 'overall_period_unique': overall_period_unique
    }

    tableData = tableData.filter(item => item.total_calls>0)
    tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

    const list = [...tableData]
    const summary = {...tableDataGeneral}
    return {stats: tableDataGeneral, summary, data: tableData, list}
  }

  makeLegends() {
    if (this.selectedType==ViewItem.compare) {
      let seriesForSource = []
      let names = []

      let entries_data1 = [...this.mainResult?.series]
      if (!entries_data1 || entries_data1.length === 0) {
        entries_data1 = [
        ];
      } else {
      }

      entries_data1.forEach(element => {
        const temp_entries_data = {}

        temp_entries_data['label'] = element.name
        temp_entries_data['total_calls'] = element.total_calls

        seriesForSource.push(temp_entries_data);
        names.push(element.name)
      });


      if (this.isCompareBySource) {

      }
      else {
        let entries_data2 = [...this.compareResult?.series]
        if (!entries_data2 || entries_data2.length === 0) {
          entries_data2 = [
          ];
        } else {
        }

        entries_data2.forEach(element => {
          const temp_entries_data = {}

          temp_entries_data['label'] = element.name
          temp_entries_data['total_calls'] = element.total_calls

          if (!names.includes(element.name)) {
            seriesForSource.push(temp_entries_data);
            names.push(element.name)
          }
        });
      }

      seriesForSource.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)
      this.legends = [...seriesForSource]

      if (this.isFromCallLog) {
        this.selectedLegends = []
        this.legends.forEach((legend) => {
          const bShow = this.savedLegends.find(row => row.label==legend.label)
          if (bShow)
            this.selectedLegends.push(legend)
        })

        this.isFromCallLog = false
        this.needLegendReload = false
      }
      else {
        let legends = [...this.selectedLegends]
        let existingLegends = []
        for (let legend of legends) {
          const is = this.legends.find(row => row.label==legend.label)
          if (is)
            existingLegends.push(is)
        }

        if (!this.needLegendReload && existingLegends.length>0 && existingLegends.length == legends.length) {  // same tracking source as before
          if (this.isCompareBySource && existingLegends.length>2)
            this.selectedLegends = [existingLegends[0], existingLegends[1]]
          else
            this.selectedLegends = [...existingLegends]
        } else {
          if (this.isCompareBySource) {
            if (this.legends.length>2)
              this.selectedLegends = [ this.legends[0], this.legends[1] ]
            else
              this.selectedLegends = [ ...this.legends ]
          }
          else
            this.selectedLegends = [...this.legends]

          this.needLegendReload = false
        }
      }
    }
    else {
      let options_data = {...this.mainResult}
      let entries_data = options_data.series

      if (!entries_data || entries_data.length === 0) {
        entries_data = [
        ];
      } else {
      }

      let axisXCategory = []
      // populate axisXCategory
      if (!options_data.xAxis || !options_data.xAxis.categories) {
      } else {
        axisXCategory = [...options_data.xAxis.categories];
      }

      let seriesForSource = []

      entries_data.forEach(element => {
        const temp_entries_data = {}
        let name = element.name
        // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
        //   name = TimeToUSTime[name]

        temp_entries_data['label'] = element.name
        temp_entries_data['total_calls'] = element.total_calls

        seriesForSource.push(temp_entries_data);
      });

      seriesForSource = seriesForSource.filter(item=> item.total_calls>0)
      seriesForSource.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

      this.legends = [...seriesForSource]

      if (this.isFromCallLog) {
        this.selectedLegends = []
        this.legends.forEach((legend) => {
          const bShow = this.savedLegends.find(row => row.label==legend.label)
          if (bShow)
            this.selectedLegends.push(legend)
        })

        this.isFromCallLog = false
        this.needLegendReload = false
      }
      else {
        let legends = [...this.selectedLegends]
        let existingLegends = []
        for (let legend of legends) {
          const is = this.legends.find(row => row.label==legend.label)
          if (is)
            existingLegends.push(is)
        }

        if (!this.needLegendReload && existingLegends.length>0 && existingLegends.length == legends.length) {  // same tracking source as before
          this.selectedLegends = [...existingLegends]
        } else {
          this.selectedLegends = [...this.legends]
          this.needLegendReload = false
        }
      }
    }

    this.onChangeLegends('legend')
  }

  makeChart() {
    if (this.selectedType==ViewItem.compare)
      this.makeCompareChartData()
    else
      this.makeSingleChartData()
  }

  makeSingleChartData = async () => {
    this.isLegend = false
    this.blockContent = true

    let names = []
    this.legends.forEach((legend) => {
      const bShow = this.selectedLegends.find(row => row.label == legend.label)
      if (bShow)
        names.push(legend.label)
    })

    let title1 = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
    if (this.selectedDate[1]!=null) {
      title1 += " ~ " +  moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())
    }

    let options_data = {...this.mainResult}
    let entries_data = options_data.series

    let axisXCategory = []
    // populate axisXCategory
    if (!options_data.xAxis || !options_data.xAxis.categories) {
    } else {
      axisXCategory = [...options_data.xAxis.categories];
    }

    if (!entries_data || entries_data.length === 0) {
      entries_data = [
      ];
    } else {
    }

    let seriesForSource = []
    if (this.isStacked) {
      entries_data.forEach((element, index) => {
        let name = element.name
        if (names.includes(name)) {
          const temp_entries_data: any = {}
          temp_entries_data['color'] = element.color
          temp_entries_data['backgroundColor'] = hexToRgbA(element.color, 0.75)
          // temp_entries_data['hoverBackgroundColor'] = element.color
          temp_entries_data['hoverBorderWidth'] = 3
          temp_entries_data['hoverBorderColor'] = '#47C650'

          if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
            name = TimeToUSTime[name]

          temp_entries_data['label'] = name
          temp_entries_data['data'] = element.series_data
          temp_entries_data['total_calls'] = element.total_calls

          temp_entries_data['fill'] = false
          temp_entries_data['borderColor'] = element.color
          temp_entries_data['tension'] = .4
          temp_entries_data['pointRadius'] = 6
          temp_entries_data['pointHitRadius'] = 6

          seriesForSource.push(temp_entries_data);
        }
      })

      seriesForSource.sort((a, b) => a.total_calls < b.total_calls ? -1 : 1)
    } else {
      seriesForSource.push({
        total_calls: 0,
        total_time: 0,
        pointRadius: 6,
        pointHitRadius: 6,
        // period_contacts: {},
        tension: .4,
        color: "#42A5F5",
        borderColor: "#42A5F5",
        fill: false,
        backgroundColor: hexToRgbA("#42A5F5", 0.85),
        hoverBackgroundColor: "#42A5F5",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d=>[]),
        // xAxisID: 'x-axis-1',
      })

      entries_data.forEach((dataset, index) => {
        let name = dataset.name
        if (names.includes(name)) {
          seriesForSource[0].total_calls += dataset.total_calls ? dataset.total_calls : 0
          seriesForSource[0].total_time += dataset.total_time ? dataset.total_time : 0

          dataset.series_data.forEach((item, i) => {
            seriesForSource[0].data[i] += item
            seriesForSource[0].total[i].push({name: dataset.name, count: item})
          })
        }
      })
    }

    // convert axisXCategory to US date time format
    for (let i = 0; i < axisXCategory.length; i++) {
      let mark = axisXCategory[i]
      switch (this.filterUnit) {
        case ReportUnit.hour:
          axisXCategory[i] = TimeToUSTime[mark]
          break

        case ReportUnit.day:
        case ReportUnit.week:
          if (mark!="") {
            let marks = mark.split(this.dateFormatDelimiter)
            axisXCategory[i] = MonthToUSMonth[marks[0]] + " " + marks[1]
          } else {
            axisXCategory[i] = ""
          }
          break

        case ReportUnit.month:
          axisXCategory[i] = mark.replace(this.dateFormatDelimiter, " ")
          break
      }
    }

    if (axisXCategory.length==1) {
      // let graphData: any = {}
      // graphData.labels = []
      // graphData.datasets = [{}]
      // graphData.datasets[0].data = []
      // graphData.datasets[0].backgroundColor = []
      // // graphData.datasets[0].hoverBackgroundColor = []
      // graphData.datasets[0].hoverBorderWidth = 3
      // graphData.datasets[0].hoverBorderColor = '#47C650'
      // seriesForSource.forEach((item: any) => {
      //   graphData.labels.push(item.label)
      //   graphData.datasets[0].data.push(item.total_calls)
      //   graphData.datasets[0].backgroundColor.push(hexToRgbA(item.color, 0.8))
      //   // graphData.datasets[0].hoverBackgroundColor.push(item.color)
      // })

      this.chartType = 'bar'
      this.isDisabledSelectingChartType = true
      // this.chartData = { ...graphData }
    }
    else {
      this.isDisabledSelectingChartType = false
      // if (this.chartType=="pie")
      //   this.chartType= "bar"
    }

    if (seriesForSource.length==0) {
      seriesForSource.push({
        total_calls: 0,
        total_time: 0,
        pointRadius: 6,
        pointHitRadius: 6,
        // period_contacts: {},
        tension: .4,
        color: "#42A5F5",
        borderColor: "#42A5F5",
        fill: false,
        backgroundColor: hexToRgbA("#42A5F5", 0.85),
        hoverBackgroundColor: "#42A5F5",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d=>[]),
        // xAxisID: 'x-axis-1',
      })
    }

    this.chartData.labels = axisXCategory
    this.chartData.datasets = seriesForSource

    this.chartData = { ...this.chartData }

    this.upgradeChartOptions()

    if (this.selectedDate[1]==null) {
      const today = moment(new Date()).format(this.dateDisplayFormat.toUpperCase())
      const yesterday = moment(moment().subtract(1, "days").toDate()).format(this.dateDisplayFormat.toUpperCase())
      const dt = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())

      if (dt==today)
        this.activityReportTitle = "Today"
      else if (dt==yesterday)
        this.activityReportTitle = "Yesterday"
      else
        this.activityReportTitle = "Date Range\n" + title1
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
        this.activityReportTitle = "Date Range\n" + title1
    }

    this.onChangeLegends(null)
  }

  makeCompareChartData() {
    if (this.mainResult.series==null)
      return

    if (!this.isCompareBySource && this.compareResult.series==null)
      return

    let names = [], names2 = []
    this.legends.forEach((legend) => {
      const bShow = this.selectedLegends.find(row=> row.label==legend.label)
      if (bShow)
        names.push(legend.label)
    })

    this.blockContent = true

    this.activityReportTitle = ""

    let title1 = "", title2 = ""
    if (this.isCompareBySource) {
      if (names.length==0)
        title1 = "None"
      else if (names.length>1) {
        title1 = names[0]
        title2 = names[1]
      } else {
        title1 = names[0]
        title2 = "None"
      }
    }
    else {
      title2 = moment(this.selectedCompareDate[0]).format(this.dateDisplayFormat.toUpperCase())
      if (this.selectedCompareDate[1]!=null)
        title2 += " ~ " +  moment(this.selectedCompareDate[1]).format(this.dateDisplayFormat.toUpperCase())
    }

    let title3 = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
    if (this.selectedDate[1]!=null)
      title3 += " ~ " +  moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())

    if (this.isCompareBySource) {
      this.legendTitle1 = title1
    } else {
      this.legendTitle1 = title3
    }

    this.legendTitle2 = title2
    this.isLegend = true

    const result1 = { ...this.mainResult }
    let entries_data1 = result1.series
    let entries_data2 = []
    if (!entries_data1 || entries_data1.length === 0) {
      entries_data1 = [
      ];
    }

    this.isDisabledSelectingChartType = false
    this.isSingleDataset = false
    let seriesForSingleDataset: any = {
      data: [],
      pointRadius: 6,
      pointHitRadius: 6,
      color: [],
      borderColor: [],
      fill: false,
      backgroundColor: [],
      hoverBackgroundColor: [],
      hoverBorderWidth: 3,
      hoverBorderColor: '#47C650',
    }

    let axisXCategory = []
    let isComplexAxis = true

    if (this.isCompareBySource) {
      isComplexAxis = false
      axisXCategory = [...result1.xAxis.categories];

      if (axisXCategory.length==1) {
        this.isDisabledSelectingChartType = true
        this.chartType = "bar"
      }
    }
    else {
      if (this.selectedGraphType=='H') {
        if (this.chartType=="bar") {
          isComplexAxis = false
          axisXCategory = [...result1.xAxis.categories];
        }
      } else {
      }

      const result2 = { ...this.compareResult }
      entries_data2 = result2.series
      if (!entries_data2 || entries_data2.length === 0) {
        entries_data2 = [
        ];
      }

      if (isComplexAxis) {
        if (!result1.xAxis || !result1.xAxis.categories || !result2.xAxis || !result2.xAxis.categories) {
          if (!result1.xAxis || !result1.xAxis.categories) {
            axisXCategory = [...result2.xAxis.categories];
            for (let i=0; i<result2.xAxis.categories.length; i++) {
              axisXCategory[i] = '#' + axisXCategory[i]
            }
          } else {
            axisXCategory = [...result1.xAxis.categories];
            // for (let i=0; i<result1.xAxis.categories.length; i++) {
            //   axisXCategory[i] = axisXCategory[i] + "#"
            // }
          }
        }
        else {
          if (result1.xAxis.categories.length>=result2.xAxis.categories.length) {
            axisXCategory = [...result1.xAxis.categories];
            for (let i=0; i<result2.xAxis.categories.length; i++) {
              axisXCategory[i]+= '#' + result2.xAxis.categories[i]
            }
          } else {
            axisXCategory = [...result2.xAxis.categories];
            for (let i=0; i<result2.xAxis.categories.length; i++) {
              axisXCategory[i] = '#' + axisXCategory[i]
            }
            for (let i=0; i<result1.xAxis.categories.length; i++) {
              axisXCategory[i] = result1.xAxis.categories[i] + axisXCategory[i]
            }
          }
        }

        if (axisXCategory.length==1) {
          this.isDisabledSelectingChartType = true
          this.chartType = "bar"
        }

        if (this.chartType=="bar") {
          this.isSingleDataset = true
          // isComplexAxis = false
          let xAxis = []
          for (let axis of axisXCategory) {
            if (xAxis.length>0)
              xAxis.push("")

            if (axis.indexOf("#")>-1) {
              const xes = axis.split("#")
              xAxis.push(xes[0])
              xAxis.push(xes.length==2 ? xes[1] : "")
            } else {
              xAxis.push(axis)
              xAxis.push("")
            }

            if (seriesForSingleDataset.color.length>0)
              seriesForSingleDataset.color.push("#ffffff00")
            seriesForSingleDataset.color.push("#42A5F5")
            seriesForSingleDataset.color.push("#FFA726")

            if (seriesForSingleDataset.borderColor.length>0)
              seriesForSingleDataset.borderColor.push("#ffffff00")
            seriesForSingleDataset.borderColor.push("#42A5F5")
            seriesForSingleDataset.borderColor.push("#FFA726")

            if (seriesForSingleDataset.backgroundColor.length>0)
              seriesForSingleDataset.backgroundColor.push("#ffffff00")
            seriesForSingleDataset.backgroundColor.push(hexToRgbA("#42A5F5", 0.75))
            seriesForSingleDataset.backgroundColor.push(hexToRgbA("#FFA726", 0.75))

            if (seriesForSingleDataset.hoverBackgroundColor.length>0)
              seriesForSingleDataset.hoverBackgroundColor.push("#ffffff00")
            seriesForSingleDataset.hoverBackgroundColor.push("#42A5F5")
            seriesForSingleDataset.hoverBackgroundColor.push("#FFA726")

            if (seriesForSingleDataset.data.length>0)
              seriesForSingleDataset.data.push(0)
            seriesForSingleDataset.data.push(0)
            seriesForSingleDataset.data.push(0)
          }

          axisXCategory = [...xAxis]
        }
      }
    }

    if (this.isCompareBySource) {
    } else {
    }

    let seriesForSource: any[] = [
      {
        total_calls: 0,
        total_time: 0,
        label: title1,
        pointRadius: 6,
        pointHitRadius: 6,
        color: "#42A5F5",
        borderColor: "#42A5F5",
        fill: false,
        backgroundColor: hexToRgbA("#42A5F5", 0.85),
        hoverBackgroundColor: "#42A5F5",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d=>[]),
        // xAxisID: 'x-axis-1',
      },{
        total_calls: 0,
        total_time: 0,
        label: title2,
        pointRadius: 6,
        pointHitRadius: 6,
        color: "#FFA726",
        borderColor: "#FFA726",
        fill: false,
        backgroundColor: hexToRgbA("#FFA726", 0.85),
        hoverBackgroundColor: "#FFA726",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d=>[]),
        // xAxisID: 'x-axis-2',
      }
    ]
    this.compareYAxis = 0

    entries_data1.forEach((dataset, ind) => {
      let index = 0, is = false
      if (this.isCompareBySource) {
        if (this.legendTitle1 == dataset.name) {
          is = true
        } else if (this.legendTitle2 == dataset.name) {
          is = true
          index = 1
        }
      }
      else
        is = names.includes(dataset.name)

      if (is) {
        seriesForSource[index].total_calls += dataset.total_calls ? dataset.total_calls : 0
        seriesForSource[index].total_time += dataset.total_time ? dataset.total_time : 0

        dataset.series_data.forEach((item, i) => {
          seriesForSource[index].data[i] += item
          seriesForSource[index].total[i].push({name: dataset.name, count: item})

          if (this.compareYAxis<seriesForSource[index].data[i])
            this.compareYAxis = seriesForSource[index].data[i]
        })
      }
    })

    if (this.isCompareBySource) {
    }
    else {
      entries_data2.forEach((dataset) => {
        let index = 1

        if (names.includes(dataset.name)) {
          seriesForSource[index].total_calls += dataset.total_calls ? dataset.total_calls : 0
          seriesForSource[index].total_time += dataset.total_time ? dataset.total_time : 0

          dataset.series_data.forEach((item, i) => {
            seriesForSource[index].data[i] += item
            seriesForSource[index].total[i].push({name: dataset.name, count: item})

            if (this.compareYAxis<seriesForSource[index].data[i])
              this.compareYAxis = seriesForSource[index].data[i]
          })
        }
      })
    }

    if (this.isSingleDataset) {
      entries_data1.forEach((dataset, ind) => {
        if (names.includes(dataset.name)) {
          dataset.series_data.forEach((item, i) => {
            seriesForSingleDataset.data[i*3] += item
          })
        }
      })

      entries_data2.forEach((dataset, ind) => {
        if (names.includes(dataset.name)) {
          dataset.series_data.forEach((item, i) => {
            seriesForSingleDataset.data[i*3+1] += item
          })
        }
      })

      this.singleDataset = [ ...seriesForSource ]
      seriesForSource = [{...seriesForSingleDataset}]
    }

    if (this.chartType=="bar") {

    }
    else {
      seriesForSource[0].xAxisID = 'x-axis-1'
      seriesForSource[1].xAxisID = 'x-axis-2'
    }

    this.chartCompareData.labels = axisXCategory
    this.chartCompareData.datasets = seriesForSource

    this.chartCompareData = { ...this.chartCompareData }

    this.upgradeChartOptions()

    const today = moment(new Date()).format(this.dateDisplayFormat.toUpperCase())
    const yesterday = moment(moment().subtract(1, "days").toDate()).format(this.dateDisplayFormat.toUpperCase())
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() -this.uiSettings.weekend)));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend ) + 6));

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

    this.dateMode1 = ""
    if (this.selectedDate[1]==null) {
      const dt = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())

      if (dt==today)
        this.activityReportTitle = "Today"
      else if (dt==yesterday)
        this.activityReportTitle = "Yesterday"
      else {
        this.dateMode1 = "range"
        this.activityReportTitle = "Date Range\n" + title3
      }
    }
    else {
      const st = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
      const et = moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())

      if (st==stw && (et==etw || et==today))
        this.activityReportTitle = "This Week"
      else if (st==slw && et==elw)
        this.activityReportTitle = "Last Week"
      else if (st==stm && (et==etm || et==today))
        this.activityReportTitle = "This Month"
      else if (st==slm && et==elm)
        this.activityReportTitle = "Last Month"
      else {
        this.dateMode1 = "range"
        this.activityReportTitle = "Date Range\n" + title3
      }
    }

    if (this.isCompareBySource) {
      this.activityReportTitle += "\n"
      this.activityReportTitle += this.legendTitle1 + " - vs - " + this.legendTitle2
    }
    else {
      this.activityReportTitle += " - vs - "

      if (this.selectedCompareDate[1]==null) {
        const dt = moment(this.selectedCompareDate[0]).format(this.dateDisplayFormat.toUpperCase())

        if (dt==today)
          this.activityReportTitle += "Today"
        else if (dt==yesterday)
          this.activityReportTitle += "Yesterday"
        else {
          if (this.dateMode1!="")
            this.activityReportTitle += title2
          else
            this.activityReportTitle = "Date Range\n" + this.activityReportTitle  + title2
        }
      }
      else {
        const st = moment(this.selectedCompareDate[0]).format(this.dateDisplayFormat.toUpperCase())
        const et = moment(this.selectedCompareDate[1]).format(this.dateDisplayFormat.toUpperCase())

        if (st==stw && (et==etw || et==today))
          this.activityReportTitle += "This Week"
        else if (st==slw && et==elw)
          this.activityReportTitle += "Last Week"
        else if (st==stm && (et==etm || et==today))
          this.activityReportTitle += "This Month"
        else if (st==slm && et==elm)
          this.activityReportTitle += "Last Month"
        else {
          if (this.dateMode1!="")
            this.activityReportTitle += title2
          else
            this.activityReportTitle = "Date Range\n" + this.activityReportTitle + title2
        }
      }
    }
  }


  /**
   * convert the float value with decimal place size as param
   * @param value float value
   * @param dp decimal place size
   * @returns
   */
  decimalFormatted(value, dp) {
    return +parseFloat(value).toFixed(dp)
  }

  getHour = (time, count) => {
    if (time==null || count==null || time==0 || count==0)
      return "0:00"

    const exact = time / 60 / count;
    const sec = Math.round((exact - Math.floor(exact)) * 60);
    return Math.floor(exact) + ':' + (sec < 10 ? `0${sec}` : sec);
  }

  calcPeriodUnique = (json) => {
    let count = 0

    for (var prop in json) {
      if (json[prop] == 1) {
        count++
      }
    }

    return count
  }

  storePageData = () => {
    let data: any = {}
    data.selectedType = this.selectedType
    data.selectedLegends = this.selectedLegends

    if (this.selectedDate[1]==null)
      data.selectedDate = [this.selectedDate[0].toISOString(), this.selectedDate[0].toISOString()]
    else
      data.selectedDate = [this.selectedDate[0].toISOString(), this.selectedDate[1].toISOString()]

    if (this.selectedType=='Compare') {
      data.isComparingBySource = this.isCompareBySource

      if (this.isCompareBySource) {
      } else {
        if (this.selectedCompareDate[1]==null)
          data.selectedCompareDate = [this.selectedCompareDate[0].toISOString(), this.selectedCompareDate[0].toISOString()]
        else
          data.selectedCompareDate = [this.selectedCompareDate[0].toISOString(), this.selectedCompareDate[1].toISOString()]
      }
    }

    data.selectedGraphType = this.selectedGraphType
    data.chartType = this.chartType

    this.store.setPageFilter("activity_report_data", JSON.stringify(data))
  }

  onClickData = (name: string) => {
    let searchAttr = "", searchValue = ""
    searchAttr = "OpNumber.TrackingSources.name"
    searchValue = name

    this.storePageData()

    this.router.navigate([RoutePath.callLogs], {
      queryParams: {
        from: 'activity',
        dateMode: this.dateMode,
        strStartDate: this.fromValue,
        strEndDate: this.toValue,
        searchAttr: searchAttr,
        searchValue: searchValue,
      }
    })
  };

  onClickCompareData = (name: string) => {
    let searchAttr = "", searchValue = ""
    searchAttr = "OpNumber.TrackingSources.name"
    searchValue = name

    this.storePageData()

    let startDate, endDate

    if (this.isCompareBySource) {
      startDate = this.fromValue
      endDate = this.toValue

    } else {
      startDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')
      if (this.selectedCompareDate[1]==null)
        endDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')
      else
        endDate = moment(this.selectedCompareDate[1]).format('YYYY-MM-DD')
    }

    this.router.navigate([RoutePath.callLogs], {
      queryParams: {
        from: 'activity',
        dateMode: this.dateMode1,
        strStartDate: startDate,
        strEndDate: endDate,
        searchAttr: searchAttr,
        searchValue: searchValue,
      }
    })
  };

  initilizeData() {
    this.chartData = {
      labels: [],
      datasets: [
      ]
    };

    this.chartCompareData = {
      labels: [],
      datasets: [
      ]
    };
  }

  upgradeChartOptions = async () => {
    if (this.selectedType==ViewItem.compare) {
      const canvas_height = this.compareChart.chart.chartArea.bottom - this.compareChart.chart.chartArea.top
      const canvas_width = this.compareChart.chart.chartArea.right - this.compareChart.chart.chartArea.left

      let isSmallScreen = false
      // let alignments
      // let cell_height = canvas_height / this.compareYAxis

      if (this.chartType=="bar") {
        let count, cells = 2
        if (this.selectedGraphType=='H' || this.isCompareBySource) {
          count = this.chartCompareData.datasets[0].data.length * 2
        }
        else {
          cells = 3
          count = this.chartCompareData.datasets[0].data.length
        }

        let cell_width = canvas_width / count

        const max_label_width = ((""+this.compareYAxis).length+2)*6
        if (max_label_width>=cell_width*cells) {
          isSmallScreen = true
        }
      }

      if (isSmallScreen) {
        this.chartCompareOptions.plugins.datalabels.padding = {
          left: 1, top: 1, right: 1, bottom: 1
        }

        this.chartCompareOptions.plugins.datalabels.font = { size: 8 }
      } else {
        this.chartCompareOptions.plugins.datalabels.padding = {
          left: 4, top: 4, right: 4, bottom: 4
        }

        this.chartCompareOptions.plugins.datalabels.font = { size: 10 }
      }

      this.chartCompareOptions.plugins.datalabels.display =  (context) => {
        if (!this.includeDataLabel)
          return false

        if (this.chartType=="bar") {
          if (this.selectedGraphType=='H')
            return true

          if (this.isCompareBySource)
            return true

          if (context.dataIndex%3==2) // hide datalabel for margin
            return false

          return true
        }
        else {
          const period1 = this.chartCompareData.datasets[0].data[context.dataIndex]
          const period2 = this.chartCompareData.datasets[1].data[context.dataIndex]

          const max = this.compareYAxis // Math.max(this.mainData.summary?.total_calls, this.compareData.summary?.total_calls)
          const diff = Math.abs(period1-period2) * (canvas_height / max)

          // console.log(period1, period2, this.compareYAxis, diff, canvas_height)

          // if overlapped
          if (diff<12) {
            if (context.datasetIndex==0 && period1<period2 && period1==0)
              return false
            else if (context.datasetIndex==1 && period2<period1 && period2==0)
              return false
          }

          return true
        }

        return "auto"
      }

      this.chartCompareOptions.plugins.datalabels.align = (context) => {
        if (this.chartType=="bar") {
          let period1, period2
          let firstIndex=0, secondIndex = 0, w = 0
          if (this.selectedGraphType=='H' || this.isCompareBySource) {
            period1 = this.chartCompareData.datasets[0].data[context.dataIndex]
            period2 = this.chartCompareData.datasets[1].data[context.dataIndex]
            w = canvas_width / Math.max(this.chartCompareData.datasets[0].data.length, this.chartCompareData.datasets[1].data.length)
          }
          else {
            if (context.dataIndex%3==2) {
              return "end"

            } else {
              firstIndex = context.dataIndex
              secondIndex = context.dataIndex
              if (context.dataIndex%3==0)
                secondIndex += 1
              else
                secondIndex -= 1

              period1 = this.chartCompareData.datasets[0].data[firstIndex]
              period2 = this.chartCompareData.datasets[0].data[secondIndex]

              w = canvas_width / this.chartCompareData.datasets[0].data.length
            }
          }

          const max = this.compareYAxis // Math.max(this.mainData.summary?.total_calls, this.compareData.summary?.total_calls)
          const diff = Math.abs(period1-period2) * (canvas_height / max)

          // if overlapped
          if (diff<12) {
            if (this.selectedGraphType=='H' || this.isCompareBySource) {
              if (context.dataIndex == firstIndex && period1 < period2) {
                if (((period1+"").length+2)*6 >= w)
                  return "start"
              }
            } else {
              if (context.datasetIndex == 0 && period1 < period2) {
                if (((period1+"").length+2)*6 >= w)
                  return "start"
              }
              else if (context.datasetIndex == 1 && period2 < period1) {
                if (((period2+"").length+2)*6 >= w)
                  return "start"
              }
            }
          }
        }
        else {
          const period1 = this.chartCompareData.datasets[0].data[context.dataIndex]
          const period2 = this.chartCompareData.datasets[1].data[context.dataIndex]

          const max = this.compareYAxis // Math.max(this.mainData.summary?.total_calls, this.compareData.summary?.total_calls)
          const diff = Math.abs(period1-period2) * (canvas_height / max)

          // console.log(period1, period2, this.compareYAxis, diff, canvas_height)

          // if overlapped
          if (diff<12) {
            if (context.datasetIndex==0 && period1<period2)
              return "start"
            else if (context.datasetIndex==1 && period2<period1)
              return "start"
          }
        }

        return 'end'
      }

      // this.chartCompareOptions.scales.yAxes[0].ticks.max = Math.max(this.mainData.summary?.total_calls, this.compareData.summary?.total_calls)
      this.chartCompareOptions.scales.yAxes[0].ticks.min = 0

      if (this.chartType=="bar") {
        this.chartCompareOptions.tooltips.mode = 'point'

        this.chartCompareOptions.scales.xAxes[0].ticks.fontColor = this.config.colorScheme=='dark'? '#ebedef' : '#495057'
        this.chartCompareOptions.scales.xAxes[0].ticks.display = true
        this.chartCompareOptions.scales.xAxes[1].ticks.display = false
      } else {
        this.chartCompareOptions.tooltips.mode = 'index'

        if (this.isCompareBySource) {
          this.chartCompareOptions.scales.xAxes[0].ticks.fontColor = this.config.colorScheme=='dark'? '#ebedef' : '#495057'
          this.chartCompareOptions.scales.xAxes[0].ticks.display = true
          this.chartCompareOptions.scales.xAxes[1].ticks.display = false
        } else {
          this.chartCompareOptions.scales.xAxes[0].ticks.fontColor = '#42A5F5'
          this.chartCompareOptions.scales.xAxes[0].ticks.display = true
          this.chartCompareOptions.scales.xAxes[1].ticks.display = true
        }
      }

      setTimeout(()=>{
        this.compareChart?.chart?.update()
      }, 300)
    }
    else {
      // this.chartOptions.scales.yAxes[0].ticks.max = this.mainData.summary?.total_calls
      this.chartOptions.scales.yAxes[0].ticks.min = 0
      if (this.isStacked) {
        if (this.chartType=="bar") {
          this.chartOptions.scales.xAxes[0].stacked = true
          this.chartOptions.scales.yAxes[0].stacked = true

          this.chartOptions.plugins.datalabels.display =  (context) => {
            if (!this.includeDataLabel)
              return false

            if (this.chartData.datasets.length==1)
              return true

            let v = this.chartData.datasets[context.datasetIndex].data[context.dataIndex]
            if (v!=0)
              return "auto"

            return false
          }

          this.chartOptions.tooltips = {
            mode: 'index',
            position: 'average',
            axis: 'x',
            intersect: false,
            itemSort: (a,b) => {
              if (a.yLabel>b.yLabel)
                return -1
              return 1
            },
            filter: (item) => {
              const index = item.index
              let total = []
              this.chartData.datasets.forEach((dataset, i) => {
                total.push({index: i, count: dataset.data[index]})
              })
              total.sort((a, b) => a.count > b.count ? -1 : 1)
              const top = total.slice(0, 10)

              let is = top.find(t=> t.index==item.datasetIndex)
              return is && item.yLabel>0
            },
            callbacks: {
              afterTitle: (items, data) => {
                let total = 0
                if (data.datasets) {
                  let index = 0
                  if (items.length>0)
                    index = items[0].index
                  // console.log(items, data.datasets)
                  data.datasets.forEach(row => {
                    total += row.data.length>index ? row.data[index] : 0
                  })
                }
                return "Total: " + total
              }
            }
          }
        }
        else {
          this.chartOptions.scales.xAxes[0].stacked = false
          this.chartOptions.scales.yAxes[0].stacked = false

          this.chartOptions.plugins.datalabels.display = this.includeDataLabel ? 'auto' : false
          this.chartOptions.tooltips = {
            mode: 'x',
            position: 'average',
            intersect: false,
            itemSort: (a,b) => {
              if (a.yLabel>b.yLabel)
                return -1
              return 1
            },
            filter: (item) => {
              const index = item.index
              let total = []
              this.chartData.datasets.forEach((dataset, i) => {
                total.push({index: i, count: dataset.data[index]})
              })
              total.sort((a, b) => a.count > b.count ? -1 : 1)
              const top = total.slice(0, 10)

              let is = top.find(t=> t.index==item.datasetIndex)
              return is && item.yLabel>0
            }
          }
        }
      }
      else {
        this.chartOptions.scales.xAxes[0].stacked = false
        this.chartOptions.scales.yAxes[0].stacked = false

        this.chartOptions.plugins.datalabels.display = this.includeDataLabel ? 'auto' : false
        this.chartOptions.tooltips = {
          mode: 'x',
          position: 'average',
          intersect: false,
          callbacks: {
            label: (item) => {
              let text = "Total " + item.yLabel
              return text
            },
            afterLabel: (item) => {
              const datasetIndex = item.datasetIndex
              const index = item.index

              const dataset = this.chartData.datasets[datasetIndex]
              let total = dataset.total[index]
              total.sort((a, b) => a.count > b.count ? -1 : 1)

              const top = total.slice(0, 10)
              let text = []
              top.forEach(row => {
                if (row.count>0)
                  text.push(row.name + ": " + row.count)
              })

              return text
            }
          }
        }
      }

      setTimeout(()=> {
        this.chart?.chart?.update()
      }, 300)
    }
  }

  updateChartOptions() {
    if (this.config.colorScheme=='dark')
      this.applyDarkTheme();
    else
      this.applyLightTheme();

    this.upgradeChartOptions()
  }

  applyDarkTheme() {
    this.chartOptions = {
      plugins: {
        datalabels: {
          display: false,
          borderRadius: 4,
          anchor: 'end',
          align: 'end',
          offset: 2,
          clip: false,
          color: 'white',
          font: {
            size: 10,
          },
          backgroundColor: function(context) {
            return context.dataset.backgroundColor;
          }
        }
      },
      layout: {
        padding: {
          top: 30, bottom: 0, left: 0, right: 0
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef'
        },
        onClick: function(e, item) {
          // console.log(e, item)
        }
      },
      tooltips: {
        mode: 'point',
        position: 'nearest',
        intersect: false,
      },
      scales: {
        xAxes: [
          {
            stacked: false,
            ticks: {
              fontColor: '#ebedef'
            },
          }
        ],
        yAxes: [
          {
            stacked: false,
            ticks: {
              beginAtZero: true,
              fontColor: '#ebedef'
            },
          }
        ]
      },
    };

    this.chartCompareOptions = {
      plugins: {
        datalabels: {
          display: false,
          borderRadius: 4,
          anchor: 'end',
          align: 'end',
          offset: 2,
          clip: false,
          color: 'white',
          font: {
            size: 10,
          },
          backgroundColor: function(context) {
            return context.dataset.backgroundColor;
          }
        },
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef'
        },
      },
      layout: {
        padding: {
          top: 30, bottom: 0, left: 0, right: 0
        }
      },
      tooltips: {
        intersect: false,
        mode: 'index',
        position: 'average',
        axis: 'x',
        callbacks: {
          title: (item) => {
            // console.log("title", item)
            if (this.chartType=="bar") {
              if (item[0].xLabel==undefined || item[0].xLabel=='')
                return undefined
            }
            else {
            }
          },
          label: (item) => {
            let text = ""
            if (item.xLabel==undefined || item.xLabel=='') {
              if (this.isCompareBySource) {
                text = this.chartCompareData.labels[item.index] + " : " + "Total " + item.yLabel
              } else {
                text = undefined
              }
            }
            else
              text = item.xLabel + " : " + "Total " + item.yLabel

            return text
          },
          afterLabel: (item) => {
            let text = []
            if (this.chartType=="bar" && !this.isCompareBySource && this.selectedGraphType!='H') {
              if (item.index%3==2)
                return undefined

              const index = Math.floor(item.index/3)
              const datasetIndex = item.index%3
              const dataset = this.singleDataset[datasetIndex]
              let total = dataset.total[index]
              total.sort((a, b) => a.count > b.count ? -1 : 1)

              const top = total.slice(0, 5)
              top.forEach(row => {
                if (row.count>0)
                  text.push(row.name + ": " + row.count)
              })
            }
            else {
              const datasetIndex = item.datasetIndex
              const index = item.index

              const dataset = this.chartCompareData.datasets[datasetIndex]
              let total = dataset.total[index]
              total.sort((a, b) => a.count > b.count ? -1 : 1)

              const top = total.slice(0, 5)
              top.forEach(row => {
                if (row.count>0)
                  text.push(row.name + ": " + row.count)
              })

              // console.log("afterLabel", item, text)
            }

            return text
          }
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              autoSkip: false,
              fontColor: '#42A5F5',
              callback: (label) => {
                if (label==null)
                  return undefined
                if (label.indexOf("#")>=0) {
                  label =  label.split("#")[0]
                  if (label=="")
                    label = undefined
                }
                return label
              },
            },
            id: 'x-axis-1',
          },
          {
            ticks: {
              autoSkip: false,
              fontColor: '#FFA726',
              callback:function(label) {
                if (label==null)
                  return undefined

                if (label.indexOf("#")>=0) {
                  label = label.split("#")[1]
                  if (label=="")
                    label = undefined
                  return label
                }

                return undefined
              },
            },
            id: 'x-axis-2'
          }
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              fontColor: '#ebedef'
            }
          }
        ]
      }
    };
  }

  applyLightTheme() {
    this.chartOptions = {
      plugins: {
        datalabels: {
          display: false,
          borderRadius: 4,
          anchor: 'end',
          align: 'end',
          offset: 2,
          clip: false,
          color: 'white',
          font: {
            size: 10,
          },
          backgroundColor: function(context) {
            return context.dataset.backgroundColor;
          }
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057'
        }
      },
      layout: {
        padding: {
          top: 30, bottom: 0, left: 0, right: 0
        }
      },
      tooltips: {
        mode: 'point',
        position: 'nearest',
        intersect: false,
      },
      scales: {
        xAxes: [
          {
            stacked: false,
            ticks: {
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            stacked: false,
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.chartCompareOptions = {
      plugins: {
        datalabels: {
          display: false,
          borderRadius: 4,
          anchor: 'end',
          align: 'end',
          offset: 2,
          clip: false,
          color: 'white',
          font: {
            size: 10,
          },
          backgroundColor: function(context) {
            return context.dataset.backgroundColor;
          }
        },
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057'
        }
      },
      layout: {
        padding: {
          top: 30, bottom: 0, left: 0, right: 0
        }
      },
      tooltips: {
        intersect: false,
        mode: 'index',
        position: 'average',
        axis: 'x',
        callbacks: {
          title: (item) => {
            if (this.chartType=="bar") {
              if (item[0].xLabel==undefined || item[0].xLabel=='')
                return undefined
            } else {
            }
          },
          label: (item) => {
            let text = ""
            if (item.xLabel==undefined || item.xLabel=='')
              text = undefined
            else
              text = item.xLabel + " : " + "Total " + item.yLabel

            return text
          },
          afterLabel: (item) => {
            let text = []
            if (this.chartType=="bar" && !this.isCompareBySource && this.selectedGraphType!='H') {
              if (item.index%3==2)
                return undefined

              const index = Math.floor(item.index/3)
              const datasetIndex = item.index%3
              const dataset = this.singleDataset[datasetIndex]
              let total = dataset.total[index]
              total.sort((a, b) => a.count > b.count ? -1 : 1)

              const top = total.slice(0, 5)
              top.forEach(row => {
                if (row.count>0)
                  text.push(row.name + ": " + row.count)
              })
            } else {
              const datasetIndex = item.datasetIndex
              const index = item.index

              const dataset = this.chartCompareData.datasets[datasetIndex]
              let total = dataset.total[index]
              total.sort((a, b) => a.count > b.count ? -1 : 1)

              const top = total.slice(0, 5)
              top.forEach(row => {
                if (row.count>0)
                  text.push(row.name + ": " + row.count)
              })
            }

            return text
          }
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#42A5F5',
              callback:function(label) {
                if (label==null)
                  return undefined

                if (label.indexOf("#")>=0) {
                  label =  label.split("#")[0]
                  if (label=="")
                    label = undefined
                }

                return label
              }
            },
            id: 'x-axis-1',
          },
          {
            ticks: {
              fontColor: '#FFA726',
              callback:function(label) {
                if (label==null)
                  return undefined

                if (label.indexOf("#")>=0) {
                  label = label.split("#")[1]
                  if (label=="")
                    label = undefined
                  return label
                }

                return undefined
              }
            },
            id: 'x-axis-2'
          }
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ]
      }
    };
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

  onClickGraph(event) {
    this.filterActivityTitle = event.element?._model?.label
    this.filterMainTable(event.element._datasetIndex, event.element._index)
  }

  onClickCompareGraph(event) {
    const index = event.element._index
    if (this.chartType=="bar" && !this.isCompareBySource && this.selectedGraphType!='H') {
      if (index%3==2)
        return

      const label = this.chartCompareData.labels[index]
      if (index%3==0) {
        this.filterActivityTitle = this.chartCompareData.labels[index]
        this.filterActivityTitle1 = this.chartCompareData.labels[index+1]
      } else {
        this.filterActivityTitle = this.chartCompareData.labels[index-1]
        this.filterActivityTitle1 = this.chartCompareData.labels[index]
      }

      this.filterCompareTable(index%3, Math.floor(index/3))
    }
    else {
      if (this.isCompareBySource) {
        const label = this.chartCompareData.labels[index]
        this.filterActivityTitle = label
        this.filterActivityTitle1 = label

      } else {
        const label = this.chartCompareData.labels[index].split("#")
        if (label.length>0)
          this.filterActivityTitle = label[0]
        else
          this.filterActivityTitle = ""
        if (label.length>1)
          this.filterActivityTitle1 = label[1]
        else
          this.filterActivityTitle1 = ""
      }

      this.filterCompareTable(event.element._datasetIndex, event.element._index)
    }
  }

  onRefreshMainData() {
    this.filterActivityTitle = ""
    this.filterActivityTitle1 = ""

    this.mainData.data = [...this.mainData.list]
    this.mainData.stats = { ... this.mainData.summary}

    if (this.selectedType=='Compare') {
      this.compareData.data = [...this.compareData.list]
      this.compareData.stats = { ... this.compareData.summary}
    }
  }
  onRefreshCompareData() {
    this.onRefreshMainData()
  }

  filterMainTable(datasetIndex, index) {
    // console.log("Filter ------------", datasetIndex, index)

    if (this.chartData.labels.length==1){
      this.onRefreshMainData()
      // const ind = this.mainData.list.findIndex((item) => item.name==this.chartData.datasets[datasetIndex].label)
      // if (ind>=0) {
      //   const filtered = [this.mainData.list[ind]]
      //   this.mainData.data = [...filtered]
      // }
    } else {
      let overall_period_unique = 0
      let tableData = [];
      let call_max = 0
      let total = [0, 0]

      let options_data = this.mainResult
      // console.log(options_data)

      if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
        call_max = 0;
      } else {
        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          const ds = this.selectedLegends.find(row => row.label==name)
          if (ds==null)
            continue

          total[0] += options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0
          total[1] += options_data.series[i].duration_data[index]? options_data.series[i].duration_data[index]: 0
        }

        call_max = total[0] // options_data.tabular.globals.series_data[index]//options_data.tabular.globals.total_calls;
        // if (call_max==null)
        //   call_max = 0

        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          const ds = this.selectedLegends.find(row => row.label==name)
          if (ds==null)
            continue

          const int_call_num = options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0

          let percent = call_max==0 ? 0 : int_call_num / call_max
          percent = percent * 100
          percent = this.decimalFormatted(percent, 2)

          // let period_unique = this.calcPeriodUnique(options_data.series[i]['period_contacts'][index])
          // overall_period_unique += period_unique

          // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
          //   name = TimeToUSTime[name]

          tableData.push({
            'name': name,
            'total_calls': options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0, //['total_calls'],
            'total_time': Math.round((options_data.series[i].duration_data[index]? options_data.series[i].duration_data[index]: 0) / 60),
            // 'period_unique': period_unique,
            'avg_time': this.getHour(options_data.series[i].duration_data[index], options_data.series[i].series_data[index]),
            'color': options_data.series[i]['color'],
            'percent': percent
          })
        }
      }

      tableData = tableData.filter(item => item.total_calls>0)
      tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

      let tableDataGeneral = {
        'name': 'Totals',
        'total_calls': total[0], //options_data.tabular.globals.series_data[index]?options_data.tabular.globals.series_data[index]:0, //options_data.tabular.globals['total_calls'],
        'total_time': Math.round(total[1]/60), // Math.round((options_data.tabular.globals.duration_data[index] ? options_data.tabular.globals.duration_data[index] : 0) / 60),
        'avg_time': this.getHour(total[1], total[0]), //this.getHour(options_data.tabular.globals.duration_data[index], options_data.tabular.globals.series_data[index]),
        // 'color': options_data.tabular.globals['color'],
        // 'data': options_data.tabular.globals['series_data'],
        // 'overall_period_unique': overall_period_unique
      }

      this.mainData.stats= {...tableDataGeneral}
      this.mainData.data = [...tableData]
    }
  }

  filterCompareTable(datasetIndex, index) {
    if (this.chartCompareData.labels.length==1){
      this.onRefreshMainData()
      this.onRefreshCompareData()

    } else {
      let overall_period_unique = 0
      let tableData = [];
      let call_max = 0
      let total = [0, 0]

      let options_data = this.mainResult

      if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
        call_max = 0;
      } else {
        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          if (this.isCompareBySource) {
            const ds = this.selectedLegends.length>0 ? this.selectedLegends[0].label : "None"
            if (ds!=name)
              continue
          } else {
            const ds = this.selectedLegends.find(row => row.label == name)
            if (ds == null)
              continue
          }

          total[0] += options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0
          total[1] += options_data.series[i].duration_data[index]? options_data.series[i].duration_data[index]: 0
        }

        call_max = total[0] // options_data.tabular.globals.series_data[index]//options_data.tabular.globals.total_calls;
        // if (call_max==null)
        //   call_max = 0

        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          if (this.isCompareBySource) {
            const ds = this.selectedLegends.length>0 ? this.selectedLegends[0].label : "None"
            if (ds!=name)
              continue
          } else {
            const ds = this.selectedLegends.find(row => row.label == name)
            if (ds == null)
              continue
          }

          const int_call_num = options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0

          let percent = call_max==0 ? 0 : int_call_num / call_max
          percent = percent * 100
          percent = this.decimalFormatted(percent, 2)

          // let period_unique = this.calcPeriodUnique(options_data.series[i]['period_contacts'][index])
          // overall_period_unique += period_unique

          // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
          //   name = TimeToUSTime[name]

          tableData.push({
            'name': name,
            'total_calls': options_data.series[i].series_data[index]? options_data.series[i].series_data[index]: 0, //['total_calls'],
            'total_time': Math.round((options_data.series[i].duration_data[index] ? options_data.series[i].duration_data[index]: 0) / 60),
            // 'period_unique': period_unique,
            'avg_time': this.getHour(options_data.series[i].duration_data[index], options_data.series[i].series_data[index]),
            'color': options_data.series[i]['color'],
            'percent': percent
          })
        }
      }

      tableData = tableData.filter(item => item.total_calls>0)
      tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

      let tableDataGeneral = {
        'name': 'Totals',
        'total_calls': total[0], //options_data.tabular.globals.series_data[index]?options_data.tabular.globals.series_data[index]:0, //options_data.tabular.globals['total_calls'],
        'total_time': Math.round(total[1]/60), // Math.round((options_data.tabular.globals.duration_data[index] ? options_data.tabular.globals.duration_data[index] : 0) / 60),
        'avg_time': this.getHour(total[1], total[0]), //this.getHour(options_data.tabular.globals.duration_data[index], options_data.tabular.globals.series_data[index]),
        // 'color': options_data.tabular.globals['color'],
        // 'data': options_data.tabular.globals['series_data'],
        // 'overall_period_unique': overall_period_unique
      }

      this.mainData.stats= {...tableDataGeneral}
      this.mainData.data = [...tableData]

      overall_period_unique = 0
      tableData = [];
      call_max = 0

      total = [0, 0]

      options_data = this.isCompareBySource ? this.mainResult : this.compareResult
      // console.log(options_data)

      if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
        call_max = 0;
      } else {
        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          if (this.isCompareBySource) {
            const ds = this.selectedLegends.length>1 ? this.selectedLegends[1].label : "None"
            if (ds!=name)
              continue
          } else {
            const ds = this.selectedLegends.find(row => row.label == name)
            if (ds == null)
              continue
          }

          total[0] += options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0
          total[1] += options_data.series[i].duration_data[index]? options_data.series[i].duration_data[index]: 0
        }

        call_max = total[0] // options_data.tabular.globals.series_data[index]//options_data.tabular.globals.total_calls;
        // if (call_max==null)
        //   call_max = 0

        for (let i = 0; i < options_data.series.length; i++) {
          let name = options_data.series[i]['name']
          if (this.isCompareBySource) {
            const ds = this.selectedLegends.length>1 ? this.selectedLegends[1].label : "None"
            if (ds!=name)
              continue
          } else {
            const ds = this.selectedLegends.find(row => row.label == name)
            if (ds == null)
              continue
          }

          const int_call_num = options_data.series[i].series_data[index] ? options_data.series[i].series_data[index] : 0

          let percent = call_max==0 ? 0 : int_call_num / call_max
          percent = percent * 100
          percent = this.decimalFormatted(percent, 2)

          // let period_unique = this.calcPeriodUnique(options_data.series[i]['period_contacts'][index])
          // overall_period_unique += period_unique

          // if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
          //   name = TimeToUSTime[name]

          tableData.push({
            'name': name,
            'total_calls': options_data.series[i].series_data[index]? options_data.series[i].series_data[index]: 0, //['total_calls'],
            'total_time': Math.round((options_data.series[i].duration_data[index] ? options_data.series[i].duration_data[index]: 0) / 60),
            // 'period_unique': period_unique,
            'avg_time': this.getHour(options_data.series[i].duration_data[index], options_data.series[i].series_data[index]),
            'color': options_data.series[i]['color'],
            'percent': percent
          })
        }
      }

      tableData = tableData.filter(item => item.total_calls>0)
      tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

      tableDataGeneral = {
        'name': 'Totals',
        'total_calls': total[0], //options_data.tabular.globals.series_data[index]?options_data.tabular.globals.series_data[index]:0, //options_data.tabular.globals['total_calls'],
        'total_time': Math.round(total[1]/60), // Math.round((options_data.tabular.globals.duration_data[index] ? options_data.tabular.globals.duration_data[index] : 0) / 60),
        'avg_time': this.getHour(total[1], total[0]), //this.getHour(options_data.tabular.globals.duration_data[index], options_data.tabular.globals.series_data[index]),
        // 'color': options_data.tabular.globals['color'],
        // 'data': options_data.tabular.globals['series_data'],
        // 'overall_period_unique': overall_period_unique
      }

      this.compareData.stats= {...tableDataGeneral}
      this.compareData.data = [...tableData]
    }
  }

  @HostListener("click", ["$event"])
  public onCalendarOutsideClick(event: any): void
  {
    if (this.isCalendar1Showing && this.calendar1.isOutsideClicked(event))
      event.stopPropagation();
    if (this.isCalendar2Showing && this.calendar2.isOutsideClicked(event))
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

  isCalendar2Showing = false
  onShowDateRangePicker2 = (event: any) => {
    this.isCalendar2Showing = true
  }
  onCloseDateRangePicker2 = (event: any) => {
    this.isCalendar2Showing = false
    this.isCalendar1Showing = false
    if (this.isCloseByApplying)
      this.isCloseByApplying = false
    else
      this.onClickCompareCancel()
  }


  onClickToday = () => {
    this.selectedDate = [new Date(), new Date()];
    this.dateMode = FilterDate.today;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareToday = () => {
    this.selectedCompareDate = [new Date(), new Date()];
    this.dateMode1 = FilterDate.today;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickYesterday = () => {
    this.selectedDate = [moment().subtract(1, "days").toDate(), moment().subtract(1, "days").toDate()];
    this.dateMode = FilterDate.yesterday;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareYesterday = () => {
    this.selectedCompareDate = [moment().subtract(1, "days").toDate(), moment().subtract(1, "days").toDate()];
    this.dateMode1 = FilterDate.yesterday;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickLastWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend )));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend ) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastWeek;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareLastWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend )));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend ) + 6));
    this.selectedCompareDate = [startDate, endDate];
    this.dateMode1 = FilterDate.lastWeek;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickLastMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastMonth;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareLastMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedCompareDate = [startDate, endDate];
    this.dateMode1 = FilterDate.month;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickThisMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisMonth;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareThisMonth = () => {
    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedCompareDate = [startDate, endDate];
    this.dateMode1 = FilterDate.thisMonth;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickThisWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() -this.uiSettings.weekend)));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend ) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisWeek;
    // this.onFilter();
    // this.calendar1.hideOverlay()
  }

  onClickCompareThisWeek = () => {
    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend )));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend) + 6));
    this.selectedCompareDate = [startDate, endDate];
    this.dateMode1 = FilterDate.thisWeek;
    // this.onCompareFilter();
    // this.calendar2.hideOverlay()
  }

  onClickApply = () => {
    if (this.selectedDate[1]==null)
      this.selectedDate[1] = this.selectedDate[0]

    this.isCloseByApplying = true
    this.onFilter();
    this.calendar1.hideOverlay()
  }

  onClickCancel = () => {
    if (this.selectedPrevDate)
      this.selectedDate = [...this.selectedPrevDate]
    else
      this.selectedDate = [null, null]
    this.calendar1.hideOverlay()
  }

  onClickCompareApply = () => {
    if (this.selectedCompareDate==null)
      return

    if (this.selectedCompareDate[1]==null)
      this.selectedCompareDate[1] = this.selectedCompareDate[0]

    this.isCloseByApplying = true

    this.onCompareFilter();
    this.calendar2.hideOverlay()
  }

  onClickCompareCancel = () => {
    if (this.selectedPrevCompareDate)
      this.selectedCompareDate = [...this.selectedPrevCompareDate]
    else
      this.selectedCompareDate = null

    this.calendar2.hideOverlay()
  }

  onFilter = async () => {
    this.needReload = true
    // if (moment(this.selectedDate[1]).format('YYYY-MM-DD')>moment(new Date()).format('YYYY-MM-DD'))
    //   this.selectedDate[1] = new Date()

    const startDate = moment(this.selectedDate[0]).format('YYYY-MM-DD')// + ' 00:00';
    const endDate = moment(this.selectedDate[1]==null ? this.selectedDate[0] : this.selectedDate[1]).format('YYYY-MM-DD')// + ' 23:59';

    if (startDate!=this.fromValue || endDate!=this.toValue)
      this.needLegendReload = true

    // this.dateMode = this.dateMode;
    this.fromValue = startDate//.replace('T', ' ');
    this.toValue = endDate//.replace('T', ' ');

    this.getFilters()
  }

  onCompareFilter = async () => {
    if (this.selectedCompareDate==null || this.selectedCompareDate.length!=2)
      return

    let days_1 = (new Date(this.toValue.substring(0, 10)).getTime()-new Date(this.fromValue.substring(0, 10)).getTime())/1000/60/60/24+1

    const startDate = moment(this.selectedCompareDate[0]).format('YYYY-MM-DD')// + ' 00:00:00';
    const endDate = moment(this.selectedCompareDate[1]==null ? this.selectedCompareDate[0] : this.selectedCompareDate[1]).format('YYYY-MM-DD')// + ' 23:59:59';

    let sd = new Date(startDate+" 00:00:00")
    let ed = new Date(endDate+" 23:59:59")
    let days_2 = (new Date(endDate.substring(0, 10)).getTime()-new Date(startDate.substring(0, 10)).getTime())/1000/60/60/24+1

    if (days_1<2 && days_2>1) {
      this.selectedCompareDate = null
      this.showWarn("Please select one day to compare!")
      return
    }

    if (days_2<2) {
      this.selectedCompareDate = [sd, null];
    } else {
      this.selectedCompareDate = [sd, ed];
    }

    this.selectedPrevCompareDate = [ ...this.selectedCompareDate ]

    if (startDate!=this.fromCompareValue || endDate!=this.toCompareValue)
      this.needLegendReload = true

    this.compareResult = {}
    this.needReload = true
    this.activityReportlist()
  }


  onExport() {
    let reports = [], compareReport = []

    reports.push({
      'Tracking Source': this.mainData.stats?.name,
      'Period Unique': this.mainData.stats?.period_unique,
      'Average Time': this.mainData.stats?.avg_time,
      'Total Time': this.mainData.stats?.total_time, // this.decimalPipe.transform(item.total_time, '0.0-10'),
      'Total Calls': this.mainData.stats?.total_calls, //this.decimalPipe.transform(item.total_calls, '0.0-10'),
      'Percent': '',
    })
    this.mainData.data.forEach(item => {
      reports.push({
        'Tracking Source': item.name,
        'Period Unique': item.period_unique + "(" + this.periodPipe.transform(item.period_unique, this.mainData.stats?.overall_period_unique)+"%)",
        'Average Time': item.avg_time,
        'Total Time': item.total_time, // this.decimalPipe.transform(item.total_time, '0.0-10'),
        'Total Calls': item.total_calls, //this.decimalPipe.transform(item.total_calls, '0.0-10'),
        'Percent': item.percent,
      })
    })

    if (this.selectedType==ViewItem.compare) {
      compareReport.push({
        'Tracking Source': this.compareData.stats?.name,
        'Period Unique': this.compareData.stats?.period_unique,
        'Average Time': this.compareData.stats?.avg_time,
        'Total Time': this.compareData.stats?.total_time, // this.decimalPipe.transform(item.total_time, '0.0-10'),
        'Total Calls': this.compareData.stats?.total_calls, //this.decimalPipe.transform(item.total_calls, '0.0-10'),
        'Percent': '',
      })
      this.compareData.data.forEach(item => {
        compareReport.push({
          'Tracking Source': item.name,
          'Period Unique': item.period_unique + "(" + this.periodPipe.transform(item.period_unique, this.compareData.stats?.overall_period_unique)+"%)",
          'Average Time': item.avg_time,
          'Total Time': item.total_time, // this.decimalPipe.transform(item.total_time, '0.0-10'),
          'Total Calls': item.total_calls, //this.decimalPipe.transform(item.total_calls, '0.0-10'),
          'Percent': item.percent,
        })
      })
    }

    import("xlsx").then(xlsx => {
      let excelBuffer: any
      if (this.selectedType==ViewItem.compare) {
        const worksheet1 = xlsx.utils.json_to_sheet(reports);
        const worksheet2 = xlsx.utils.json_to_sheet(compareReport);
        const workbook = { Sheets: { 'data': worksheet1, 'data2': worksheet2 }, SheetNames: ['data', 'data2'] };
        excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      } else {
        const worksheet = xlsx.utils.json_to_sheet(reports);
        const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      }

      this.saveAsExcelFile(excelBuffer, "activity_report");
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    import("file-saver").then(FileSaver => {
      let EXCEL_TYPE =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      let EXCEL_EXTENSION = ".xlsx";
      const data: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
      });
      FileSaver.saveAs(
        data,
        fileName + "_" + this.activityReportTitle + EXCEL_EXTENSION
      );
    });
  }

  onChangeLegends = async (event) => {
    if (this.selectedType == ViewItem.compare && this.isCompareBySource) {
      if (this.selectedLegends.length==0)
        this.legendLabel = "None : None"
      else if (this.selectedLegends.length==1)
        this.legendLabel = this.selectedLegends[0].label + ' : ' + 'None'
      else
        this.legendLabel = this.selectedLegends[0].label + ' : ' +  this.selectedLegends[1].label
    } else {
      if (this.legends.length>0 && this.legends.length==this.selectedLegends.length)
        this.legendLabel = "All Tracking Sources"
      else if (this.legends.length==0)
        this.legendLabel = "No Tracking Sources"
      else if (this.selectedLegends.length==1)
        this.legendLabel = this.selectedLegends[0].label
      else if (this.selectedLegends.length==0)
        this.legendLabel = "No Tracking Sources Selected"
      else
        this.legendLabel = this.selectedLegends.length + " of " + this.legends.length +  " Tracking Sources Selected"
    }

    if (event==null)
      return

    if (this.selectedType == ViewItem.compare && this.isCompareBySource) {
      // TODO - consider comparing by Source
      this.filterActivityTitle = ""
      this.filterActivityTitle1 = ""

      // TODO - filter table
      this.mainData = this.buildTableForSource(this.mainResult, this.selectedLegends.length>0 ? this.selectedLegends[0].label : '')
      this.compareData = this.buildTableForSource(this.mainResult, this.selectedLegends.length>1 ? this.selectedLegends[1].label : '')

      setTimeout(()=> {
        this.makeCompareChartData()
      }, 500)
    } else {
      this.mainData = this.buildTable(this.mainResult)

      if (this.selectedType == ViewItem.compare) {
        if (this.compareResult)
          this.compareData = this.buildTable(this.compareResult)

        setTimeout(()=> {
          this.makeCompareChartData()
        }, 500)
      } else {
        setTimeout(()=> {
          this.makeSingleChartData()
        }, 500)
      }
    }
  }

  onChangeCompareMethod = async (event) => {
    if (event.checked) {
      if (this.selectedLegends.length>2)
        this.selectedLegends = [ this.selectedLegends[0], this.selectedLegends[1] ]

      this.onChangeLegends('legend')
    } else {
      this.onChangeLegends('legend')
    }
  }

  onTooltip() {
    this.includeDataLabel = !this.includeDataLabel
    this.store.setPageFilter("activity_report_datalabel", this.includeDataLabel)
    this.updateChartOptions()
  }

  onStacked() {
    this.isStacked = !this.isStacked
    this.store.setPageFilter("activity_report_stacked", this.isStacked)
    this.makeSingleChartData()
  }

}

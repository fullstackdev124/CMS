import {AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  overviewOptions, getDateByUTC, scrollToTop, overviewHourOption, pieOption1, findDuplicates, getApexPieChartOption,
  colors, weeks, getUserTimezone,
} from '@app/helper/utils';
import moment from 'moment';
import {Location} from '@angular/common';
import {GetSources} from '@app/models/tracking_numbers';
import {LightLog} from '@app/models/callLog';
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {of, Subscription, throwError} from 'rxjs';
import {
  FilterDate,
  DateOptions,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY,
  NoPermissionAlertInteral,
  CHART_COLORS, DISABLED_ALL_DAYS
} from '../../constant';
import {ReportUnit, ViewItem} from '../enumtypes'
import { AnimationInterval } from '../../constant';

import {catchError, pluck, take, tap} from 'rxjs/operators';
import {StoreService} from '@services/store/store.service';
import {
  createRandomColor,
  getFilterDateMode,
  getMonday,
  getMondayMoment,
  getStartAndEndDate,
  hexToRgbA,
  pad
} from '../../utils';
import {MessageService} from "primeng/api";
import {AppConfig, LayoutService} from "@services/app.layout.service";
import {Calendar} from "primeng/calendar";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-report-overview',
  templateUrl: './report-overview.component.html',
  styleUrls: ['./report-overview.component.scss'],
  animations: [
  ]
})
export class ReportOverviewComponent implements OnInit, OnDestroy, AfterViewInit {

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  reportUnit = ReportUnit
  filter = ReportUnit.day.toString()
  filterValue = ''

  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  fromValue = null;
  toValue = null;

  isLoading = false;
  showSpinner = false;

  graphTypes = [
      { name: 'Hour', value: 'H' },
      { name: 'Day', value: 'D' },
      { name: 'Week', value: 'W' },
      { name: 'Month', value: 'M' }
    ];
  selectedGraphType = 'D'
  disabledGraphTypes = [ false, false, false, false ]
  chartType = "bar"
  chartTypes: any[] = [
    { icon: 'pi pi-chart-bar', value: 'bar' },
    { icon: 'pi pi-chart-line', value: 'line' },
  ];

  top = { total: -1, contact: 0, avgTime: '0', source: '', day: '', hour: '' };

  subscription: Subscription;
  config: AppConfig;

  totalData: any
  totalOptions: any

  totalCallersData: any
  totalCallersOption: any
  totalCallersTable: any[] = []

  averageDurationCallData: any
  averageDurationCallOption: any
  averageDurationCallTable: any[] = []

  activityReportTitle = ""

  callStatusGraphData: any
  callStatusGraphOption: any
  callStatusTable: any[] = []

  repeatVsNewCallGraphData: any
  repeatVsNewCallGraphOption: any
  repeatVsNewCallTableData: any[] = [0]
  repeat_call_count = 0
  new_call_count = 0

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

  userTimezoneOffset = 0

  isFromCallLog = false

  showingMinutesOptions = {
    title: 'Average Duration of Call by Tracking Source',
    button: 'Call Duration Threshold by Tracking Source',
    is: false,
  }

  constructor(public api: ApiService,
              private router: Router, public route: ActivatedRoute,
              private store: StoreService,
              private messageService: MessageService,
              private location: Location,
              private layoutService: LayoutService) {
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
        if (v.GuiSection.name == "Overview") {
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

    await this.getParams()
    if (this.isFromCallLog) {
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
        let page_data = this.store.getPageFilter("overview_report_data")
        if (page_data!="") {
          let data: any = JSON.parse(page_data)
          // console.log(data)

          if (data.selectedDate.length==2)
            this.selectedDate = [ new Date(Date.parse(data.selectedDate[0])), new Date(Date.parse(data.selectedDate[1])) ]
          else
            this.selectedDate = [ new Date(Date.parse(data.selectedDate[0])), new Date(Date.parse(data.selectedDate[0])) ]

          this.selectedGraphType = data.selectedGraphType
          this.chartType = data.chartType
          this.filter = data.selectedGraphType

          this.isFromCallLog = true
        }

        this.store.setPageFilter("overview_report_data", "")
      }
    });
  }


  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();

    if (this.overlayMenuOpenSubscription)
      this.overlayMenuOpenSubscription.unsubscribe();
  }

  initilizeData() {
    this.totalData = {
      labels: [],
      datasets: [
        {
          label: 'Total Calls',
          data: [],
          fill: false,
          borderColor: '#42A5F5',
          hoverBackgroundColor: '#42A5F5',
          backgroundColor: hexToRgbA('#42a5f5', 0.6),
          hoverBorderWidth: 3,
          hoverBorderColor: 'green',
          tension: .4
        },
        {
          label: 'Unique Contacts',
          data: [],
          fill: false,
          borderColor: '#FFA726',
          hoverBackgroundColor: '#FFA726',
          backgroundColor: hexToRgbA('#FFA726', 0.6),
          hoverBorderWidth: 3,
          hoverBorderColor: 'green',
          tension: .4
        }
      ]
    };

    this.totalCallersData = {
      labels: [],
      datasets: [
        {
          data: [],
          borderWidth: 0,
          hoverBorderWidth: 1,
          hoverBorderColor: 'green',
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };

    this.averageDurationCallData = {
      labels: [],
      datasets: [
        {
          data: [],
          borderWidth: 0,
          hoverBorderWidth: 1,
          hoverBorderColor: 'green',
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };

    this.callStatusGraphData = {
      labels: [],
      datasets: [
        {
          data: [],
          borderWidth: 0,
          hoverBorderWidth: 1,
          hoverBorderColor: 'green',
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };

    this.repeatVsNewCallGraphData = {
      labels: [],
      datasets: [
        {
          data: [],
          borderWidth: 0,
          hoverBorderWidth: 1,
          hoverBorderColor: 'green',
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };
  }

  getFilters = () => {
    const filters = this.store.getFilters()
    this.dateMode = filters.dateMode;
    this.fromValue = filters.startDate//.replace('T', ' ');
    this.toValue = filters.endDate//.replace('T', ' ');

    let sd = new Date(this.fromValue + " 00:00:00")
    let ed = new Date(this.toValue + " 23:59:59")
    let days = (new Date(this.toValue.substring(0, 10)).getTime()-new Date(this.fromValue.substring(0, 10)).getTime())/1000/60/60/24+1

    if (days<2) {
      this.selectedDate = [sd, null];
    } else {
      this.selectedDate = [sd, ed];
    }

    this.selectedPrevDate = [...this.selectedDate]

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

    this.getData();
  }

  makeGraphData(logs, sdate, edate, offset, interval) {
    // Prepare report datastructure
    let report: any = {};

    // Build Start HighCharts JSON Object
    let chartOptions: any = {xAxis: {categories: []}, series: []};

    // Build xAxis categories based on interval
    let dates = [];
    let l_sdate = new Date(sdate);
    let l_edate = new Date(edate);
    let m_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

    // Just name json object and initialize it
    const series_data: any = {
      activity_data: new Array(dates.length).fill(0),
      contacts_data: new Array(dates.length).fill(0),
      contacts_step: {},
    };

    // if (!report.hasOwnProperty(report_index)) {
    // if(report[report_index]==null) {
      // let random_color = "#" + Math.floor(Math.random()*16777215).toString(16);
      const random_color = createRandomColor();
      // report[report_index] = { total_calls: Object.keys(callogs).length, total_time: 0, total_contacts: 0, average_time: 0, color: random_color, timeline_chart: chartOptions, contacts: { max: { name: "", value: 0}}, hour_steps: { max: { name: "", value: 0 }}, day_steps: { max: { name: "", value: 0 }}, tsources: { max: { name: "", value: 0 }}};
      report = {
        total_calls: Object.keys(logs).length,
        total_time: 0,
        total_contacts: 0,
        average_time: 0,
        color: random_color,
        timeline_chart: chartOptions,
        hour_steps: {max: {name: '', value: 0}},
        day_steps: {max: {name: '', value: 0}},
        contacts_global: {max: {name: '', value: 0}},
        tsources: {max: {name: '', value: 0}},
      };
    // }

    this.callStatusTable = []
    this.new_call_count = 0
    this.repeat_call_count = 0

    let new_calls: string[] = []
    // Iterate through call logs
    logs = JSON.parse(JSON.stringify(logs));
    for(let i = 0; i < logs.length; i++) {
      let log = logs[i];

      // if (log.on==null)
      //   continue;

      // if (log.OpNumber.hasOwnProperty('TrackingSources')) {
      // if(log.na!=null) {
        // call status
        const cs_index = this.callStatusTable.findIndex((item) => item.status==log.cs)
        if (cs_index>=0)
          this.callStatusTable[cs_index].count++
        else
          this.callStatusTable.push({status: log.cs, count: 1})

        // repeat vs new call
        let nn = log.on+log.cn
        if (new_calls.includes(nn))
          this.repeat_call_count++
        else {
          new_calls.push(nn)
          this.new_call_count++
        }

        // Add every call log duration to total call time
        report.total_time += log.dt;

        let created = moment(log.at).utcOffset(offset)

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

        const hour_step = created.hour();
        const day_step = pad(created.month() + 1, 2) + this.dateFormatDelimiter + pad(created.date(), 2);

        if (!report.hour_steps.hasOwnProperty(hour_step)) {
          report.hour_steps[hour_step] = 0;
        }

        if (!report.day_steps.hasOwnProperty(day_step)) {
          report.day_steps[day_step] = 0;
        }

        report.hour_steps[hour_step] += 1;
        report.day_steps[day_step] += 1;

        if (report.hour_steps[hour_step] >= report.hour_steps.max.value) {
          report.hour_steps.max.value = report.hour_steps[hour_step];
          report.hour_steps.max.name = hour_step;
        }

        if (report.day_steps[day_step] >= report.day_steps.max.value) {
          report.day_steps.max.value = report.day_steps[day_step];
          report.day_steps.max.name = day_step;
        }

        // Add structure for uniqueness of contacts
        if (!series_data.contacts_step.hasOwnProperty(int_step))
          series_data.contacts_step[int_step] = {
            total_count: 0,
            max: {name: '', value: 0},
          };

        // Calculate Top Contacts
        let contact = null;
        if(log.cn!=null) {
          contact = log.cn;
          if (!report.contacts_global.hasOwnProperty(contact)) {
            report.contacts_global[contact] = 0;
          }

          if (!series_data.contacts_step[int_step].hasOwnProperty(contact)) {
            series_data.contacts_step[int_step][contact] = 0;
            series_data.contacts_step[int_step].total_count += 1;
          }

          report.contacts_global[contact] += 1;
          series_data.contacts_step[int_step][contact] += 1;

          // Set top contact
          if (series_data.contacts_step[int_step][contact] >= series_data.contacts_step[int_step].max.value) {
            series_data.contacts_step[int_step].max.value = series_data.contacts_step[int_step][contact];
            series_data.contacts_step[int_step].max.name = contact;
          }

          if (report.contacts_global[contact] >= report.contacts_global.max.value) {
            report.contacts_global.max.value = report.contacts_global[contact];
            report.contacts_global.max.name = contact;
          }
        }

        // Calculate Top Tracking Source
        const tsource_key = log.na==null ? "Unknown" : log.na;
        if (!report.tsources.hasOwnProperty(tsource_key)) {
          report.tsources[tsource_key] = {
            total_calls: 0,
            total_duration: 0,
            total_contacts: 0,
            min_0: 0,
            min_3: 0,
            min_5: 0,
            min_15: 0,
            contacts: {},
            color: createRandomColor(),
          };
        }

        if (log.dt<180)
          report.tsources[tsource_key].min_0++
        else if (log.dt<300)
          report.tsources[tsource_key].min_3++
        else if (log.dt<900)
          report.tsources[tsource_key].min_5++
        else
          report.tsources[tsource_key].min_15++

        report.tsources[tsource_key].total_calls += 1;
        report.tsources[tsource_key].total_duration += log.dt;
        if (contact != null)
          report.tsources[tsource_key].total_contacts += 1;

        if (!report.tsources[tsource_key].contacts.hasOwnProperty(contact)) {
          report.tsources[tsource_key].contacts[contact] = 0;
        }

        report.tsources[tsource_key].contacts[contact] += 1;

        if (report.tsources[tsource_key].total_calls >= report.tsources.max.value) {
          report.tsources.max.value = report.tsources[tsource_key].total_calls;
          report.tsources.max.name = tsource_key;
        }

        // Add top series object counting
        if (!series_data.contacts_step.hasOwnProperty(int_step))
          series_data.top[int_step] = {total_count: 0, max: {name: '', value: 0}};

        // Update Series specific counter
        const s_index = dates.indexOf(int_step);
        if (s_index >= 0) {
          series_data.activity_data[s_index] += 1;

          if (series_data.contacts_step.hasOwnProperty(int_step)) series_data.contacts_data[s_index] = series_data.contacts_step[int_step].total_count;
        } else {
          // console.log('[EE] Index error:', 'Step:', int_step);
        }
      // }
    }

    report.timeline_chart.series = series_data;
    report.total_contacts = Object.keys(report.contacts_global).length - 1;
    report.average_time += report.total_calls==0 ? report.total_time / report.total_calls : 0;

    const total_cs = this.callStatusTable.reduce((pv, cv)=>pv+cv.count, 0)
    this.callStatusTable.map((item: any) => {
      item.percent = total_cs==0 ? "0" : (item.count / total_cs * 100).toFixed(2)
      item.color = createRandomColor()
    })
    this.callStatusTable.sort((a: any, b: any) => b.count-a .count)

    // Reply with report data structure
    return report;
  }

  getData = async () => {
    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    try {
      let interval = ''  // interval for loading
      switch (this.filter) {
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

      let offset = this.userTimezoneOffset// * 60000;

      let startDate_timestamp = new Date(this.fromValue + " 00:00:00").getTime()
      let endDate_timestamp = new Date(this.toValue + " 23:59:59").getTime()

      setTimeout(()=> {
        this.isLoading = true
        this.showSpinner = true
      }, 100)
      this.activityReportTitle = ""

      await this.api.overviewReport(this.fromValue, this.toValue, offset)
        .pipe(tap(async (res: any) => {
          // Debug
          let options_data: any = this.makeGraphData(res.result, startDate_timestamp, endDate_timestamp, (-1)*offset, interval)

          await this.makeChartData(options_data)

          setTimeout(()=> {
            this.isLoading = false
            this.showSpinner = false
          }, 300)
        }), catchError((_) => {
          this.isLoading = false
          return of(0);
        })).toPromise().catch((err)=> {
          this.isLoading = false
        });
    } catch (e) {
      this.isLoading = false
    }
  }

  makeChartData = async (options_data: any) => {
    if (Object.keys(options_data).length === 0) {
      options_data = {
        total_calls: 0,
        total_time: 0,
        total_contacts: 0,
        average_time: 0,
        color: '#1416D2',
        timeline_chart: {
          xAxis: {
            categories: []
          },
          series: {
            activity_data: [
              0
            ],
            contacts_data: [
              0
            ],
            contacts_step: {}
          }
        },
        hour_steps: {
          max: {
            name: null
          }
        },
        day_steps: {
          max: {
            name: null
          },
        },
        contacts_global: {},
        tsources: {
          max: {
            name: null
          }
        }
      };
    }

    const data: any = options_data
    this.top.contact = data['total_contacts'];
    this.top.total = data['total_calls'];
    this.top.avgTime = Math.floor(data['average_time'] / 60) + ':' + Math.round((data['average_time'] / 60 - Math.floor(data['average_time'] / 60)) * 60);
    this.top.source = data['tsources'].max.name;
    this.top.day = data.day_steps.max.name;
    this.top.hour = data.hour_steps.max.name;

    this.totalData.datasets[0].data = data.timeline_chart.series.activity_data
    this.totalData.datasets[1].data = data.timeline_chart.series.contacts_data

    this.totalData.labels = data.timeline_chart.xAxis.categories

    if (data.timeline_chart.xAxis.categories.length==1) {
      this.totalData.labels.unshift("")
      this.totalData.labels.push("")

      this.totalData.datasets[0].data.unshift(undefined)
      this.totalData.datasets[0].data.push(undefined)

      this.totalData.datasets[1].data.unshift(undefined)
      this.totalData.datasets[1].data.push(undefined)
    }

    // if (((parseInt(day[1]) - parseInt(day[0])) < 3600 * 24) && this.filter === 'D') {
    //   this.totalData.labels.push(moment(new Date(parseInt(day[0]) * 1000)).format('MM-DD'));
    //
    //   this.totalData.datasets[0].data.unshift(0)
    //   this.totalData.datasets[1].data.unshift(0)
    // }
    this.upgradeChartOptions()

    this.totalData = { ...this.totalData }

    delete data.tsources.max;
    this.totalCallersData.labels = []
    this.totalCallersData.datasets[0].data = []
    this.totalCallersData.datasets[0].backgroundColor = []
    this.totalCallersData.datasets[0].hoverBackgroundColor = []
    this.totalCallersTable = []

    this.averageDurationCallData.labels = []
    this.averageDurationCallData.datasets[0].data = []
    this.averageDurationCallData.datasets[0].backgroundColor = []
    this.averageDurationCallData.datasets[0].hoverBackgroundColor = []
    this.averageDurationCallTable = []

    let index = 0
    Object.keys(data.tsources).forEach(k => {
      data.tsources[k].color = CHART_COLORS[index]

      this.totalCallersTable.push({
        color: data.tsources[k].color,
        'source': k,
        'activity': data.tsources[k].total_calls,
        'contact': data.tsources[k].total_contacts,
        'percent': (data.tsources[k].total_calls * 1.0 / data.total_calls * 100).toFixed(2)
      })

      this.averageDurationCallTable.push({
        color: data.tsources[k].color,
        'source': k,
        'duration': data.tsources[k].total_duration,
        min_0: data.tsources[k].min_0,
        min_3: data.tsources[k].min_3,
        min_5: data.tsources[k].min_5,
        min_15: data.tsources[k].min_15,
        'percent': (data.tsources[k].total_duration * 1.0 / data.total_time * 100).toFixed(2)
      })

      index ++
    });

    this.totalCallersTable.sort((a,b) => a.activity>b.activity ? -1 : 1)
    this.averageDurationCallTable.sort((a,b) => a.duration>b.duration ? -1 : 1)

    let sources_count = this.totalCallersTable.length>10 ? 10 : this.totalCallersTable.length
    for (let i=0; i<sources_count; i++) {
      const k = this.totalCallersTable[i].source
      this.totalCallersData.labels.push(k)
      this.totalCallersData.datasets[0].data.push(data.tsources[k].total_calls)
      this.totalCallersData.datasets[0].backgroundColor.push(hexToRgbA(data.tsources[k].color, 0.6))
      this.totalCallersData.datasets[0].hoverBackgroundColor.push(data.tsources[k].color)
    }

    sources_count = this.averageDurationCallTable.length>10 ? 10 : this.averageDurationCallTable.length
    for (let i=0; i<sources_count; i++) {
      const k = this.averageDurationCallTable[i].source
      this.averageDurationCallData.labels.push(k)
      this.averageDurationCallData.datasets[0].data.push(data.tsources[k].total_duration)
      this.averageDurationCallData.datasets[0].backgroundColor.push(hexToRgbA(data.tsources[k].color, 0.6))
      this.averageDurationCallData.datasets[0].hoverBackgroundColor.push(data.tsources[k].color)
    }

    this.callStatusGraphData.labels = []
    this.callStatusGraphData.datasets[0].data = []
    this.callStatusGraphData.datasets[0].backgroundColor = []
    this.callStatusGraphData.datasets[0].hoverBackgroundColor = []
    this.callStatusTable.forEach((item: any, ind) => {
      this.callStatusGraphData.labels.push(item.status)
      this.callStatusGraphData.datasets[0].data.push(item.count)
      this.callStatusGraphData.datasets[0].backgroundColor.push(hexToRgbA(CHART_COLORS[index+ind], 0.6))
      this.callStatusGraphData.datasets[0].hoverBackgroundColor.push(CHART_COLORS[index+ind])
    })

    this.repeatVsNewCallGraphData.labels = ["Repeat", "New"]
    this.repeatVsNewCallGraphData.datasets[0].data = [this.repeat_call_count, this.new_call_count]
    this.repeatVsNewCallGraphData.datasets[0].backgroundColor = [hexToRgbA(CHART_COLORS[index+20], 0.6), hexToRgbA(CHART_COLORS[index+21], 0.6)]
    this.repeatVsNewCallGraphData.datasets[0].hoverBackgroundColor = [ CHART_COLORS[index+20], CHART_COLORS[index+21] ]

    this.totalCallersData = { ...this.totalCallersData }
    this.averageDurationCallData = { ...this.averageDurationCallData }
    this.callStatusGraphData = { ... this.callStatusGraphData }
    this.repeatVsNewCallGraphData = { ... this.repeatVsNewCallGraphData }

    let title1 = moment(this.selectedDate[0]).format(this.dateDisplayFormat.toUpperCase())
    if (this.selectedDate[1]!=null) {
      title1 += " ~ " +  moment(this.selectedDate[1]).format(this.dateDisplayFormat.toUpperCase())
    }

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
  }

  toggleMinutes = () => {
    this.showingMinutesOptions.is = !this.showingMinutesOptions.is
    if (this.showingMinutesOptions.is) {
      this.showingMinutesOptions.title = "Call Duration Threshold by Tracking Source"
      this.showingMinutesOptions.button = "Average Duration of Call by Tracking Source"
    } else {
      this.showingMinutesOptions.title = "Average Duration of Call by Tracking Source"
      this.showingMinutesOptions.button = "Call Duration Threshold by Tracking Source"
    }
  }

  onClickData = (name: string) => {
    let searchAttr = "", searchValue = ""
    searchAttr = "OpNumber.TrackingSources.name"
    searchValue = name

    this.storePageData()

    this.router.navigate([RoutePath.callLogs], {
      queryParams: {
        from: 'overview',
        dateMode: this.dateMode,
        strStartDate: this.fromValue,
        strEndDate: this.toValue,
        searchAttr: searchAttr,
        searchValue: searchValue,
      }
    })
  };

  storePageData = () => {
    let data: any = {}
    if (this.selectedDate[1]==null)
      data.selectedDate = [this.selectedDate[0].toISOString(), this.selectedDate[0].toISOString()]
    else
      data.selectedDate = [this.selectedDate[0].toISOString(), this.selectedDate[1].toISOString()]

    data.selectedGraphType = this.selectedGraphType
    data.chartType = this.chartType

    this.store.setPageFilter("overview_report_data", JSON.stringify(data))
  }

  upgradeChartOptions() {
    if (this.chartType=='bar') {
      // this.totalOptions.scales.xAxes = [{stacked: true}]
      // this.totalOptions.scales.yAxes = [{ticks: {suggestedMin: 50}}]
    } else {
      // this.totalOptions.scales.yAxes = [{ticks: {suggestedMin: 50}}]
      // this.chartOptions.scales.yAxes = [{stacked: false}]
    }

      this.totalOptions.tooltips = {
        // mode: 'index',
        intersect: false,
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
    this.totalOptions = {
      legend: {
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 8,
          boxWidth: 20,
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#ebedef'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              suggestedMin: 50,
              fontColor: '#ebedef'
            }
          },
        ]
      }
    };

    this.totalCallersOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#ebedef'
        }
      }
    };

    this.averageDurationCallOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#ebedef'
        }
      }
    };

    this.callStatusGraphOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#ebedef'
        }
      }
    };

    this.repeatVsNewCallGraphOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#ebedef'
        }
      }
    };
  }

  applyLightTheme() {
    this.totalOptions = {
      legend: {
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 8,
          boxWidth: 20,
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              suggestedMin: 50,
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.totalCallersOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#495057'
        }
      }
    };

    this.averageDurationCallOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#495057'
        }
      }
    };

    this.callStatusGraphOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#495057'
        }
      }
    };

    this.repeatVsNewCallGraphOption = {
      legend: {
        display: false,
        labels: {
          fontSize: 10,
          boxWidth: 20,
          padding: 4,
          usePointStyle: false,
          fontColor: '#495057'
        }
      }
    };
  }

  onSearch(event) {
    this.getData()
  }

  onSetFilter = (type) => {
    this.filter = type
    this.selectedGraphType = type
    this.getData();
  };

  onSetChart = (event) => {
    this.chartType = event.option.value
    // this.upgradeChartOptions()
    // this.chartData = { ...this.chartData }
    this.getData()
  };

  toggleFilterPanel() : void {
    this.filterPanelOpened = !this.filterPanelOpened
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
    // this.disabledDays = DISABLED_ALL_DAYS;
    this.selectedDate = [new Date(), new Date()];
    this.dateMode = FilterDate.today;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickYesterday = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;
    this.selectedDate = [moment().subtract(1, "days").toDate(), moment().subtract(1, "days").toDate()];
    this.dateMode = FilterDate.yesterday;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickLastWeek = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend )));
    let endDate = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay()-this.uiSettings.weekend ) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastWeek;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickThisWeek = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend )));
    let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay()-this.uiSettings.weekend ) + 6));
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisWeek;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickLastMonth = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(date.getFullYear(), (date.getMonth() - 1), 1);
    let endDate = new Date(date.getFullYear(), (date.getMonth() - 1) + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.lastMonth;
    // this.onFilter();
    // this.calendar.hideOverlay()
  }

  onClickThisMonth = () => {
    // this.disabledDays = DISABLED_ALL_DAYS;

    let date = new Date();
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.selectedDate = [startDate, endDate];
    this.dateMode = FilterDate.thisMonth;
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

    const startDate = moment(this.selectedDate[0]).format('YYYY-MM-DD')// + ' 00:00';
    const endDate = moment(this.selectedDate[1]==null ? this.selectedDate[0] : this.selectedDate[1]).format('YYYY-MM-DD')// + ' 23:59';

    await this.store.storeFilters({dateMode: this.dateMode, startDate: startDate, endDate: endDate})
    this.store.setFilter()

    this.getFilters()
  }
}


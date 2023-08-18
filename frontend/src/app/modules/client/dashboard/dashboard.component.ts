import { LogsCount } from 'src/app/models/callLog';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { catchError, map, mergeMap, pluck, take, tap } from 'rxjs/operators';
import { StoreService } from '@services/store/store.service';
import { trigger, transition, query, style, animate } from '@angular/animations'
import {
  AnimationInterval,
  FilterDate,
  DateOptions,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY,
  CMSUserType,
  CHART_COLORS
} from '../constant';
import {
  getStartAndEndDate,
  getFilterDateMode,
  createRandomColor,
  hexToRgbA,
  pad,
  getMonday,
  getMondayMoment
} from '../utils';
import { ApiService } from '../../../services/api/api.service';
import { ActivityData, CallLog, LightLog } from '../../../models/callLog';
import { ViewItem, ReportUnit } from '../reports/enumtypes';
import { Observable, of, Subscription } from 'rxjs';
import {
  initOption,
  USTimeToTime,
  TimeToUSTime,
  MonthToUSMonth,
  USMonthToMonth,
  DaysOfMonth,
  colors,
  getDateByUTC,
  scrollToTop,
  CeilWithMinimumPipe,
  CalcPeriodUniquePercPipe,
  SecondsToMinutesPipe,
  getUserTimezone
} from '@app/helper/utils';
import { Router } from '@angular/router';

import { Location } from '@angular/common';
import * as _ from 'lodash';

// @ts-ignore
import moment, { utc } from 'moment';
import { MessageService } from "primeng/api";
import { AppConfig, LayoutService } from "@services/app.layout.service";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { UIChart } from "primeng/chart";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
  ]
})

export class DashboardComponent implements OnInit, OnDestroy {

  fullname: string = "";

  logsCounts = {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  }

  private filterSubscription: Subscription
  ReportUnit = ReportUnit
  ViewItem = ViewItem

  optionsForSource: any               // options for tracking source
  optionsForHour: any                 // options for hour
  optionsForCompare: any              // options for compare

  filterUnit = ReportUnit.day         // report unit filter
  axisXCategory: string[]             // x-axis categores

  seriesForSource = []                // series for tracking source
  seriesForHour = []                  // series for hour
  seriesForCompare = []               // series for compare
  isLoading = false                   // the flag that presents if the data is loading from backend

  isBar = false                       // the flag tha presents if the chart type is bar, true: bar, false: not bar(line)
  viewItem = ViewItem.trackingSource  // view item(Tracking Source, Hour, Compare)

  startDate_timestamp = null          // time stamp value for start date
  endDate_timestamp = null            // time stamp value for end date
  firstDate = null
  secDate = null

  isHour = false
  isHourDate = null

  options_data: ActivityData = {}      // options data
  isEmptyData = false                  // the flag that checks if the data is empty

  table_contain = []
  timerange_min = [];
  timerange_max = [];

  public table_data = [];               // table data to show on the chart
  public table_data_general = [];       // general table data

  call_max = null
  first = null
  second = null
  overall_period_unique = 0

  // filter params
  dateOptions = DateOptions             // date mode options
  filterValue = ''                      // search value
  dateModeString = ''                   // filter date mode string
  dateMode = FilterDate.today.toString(); // filter date mode like today, yesterady, last 7 days....
  strStartDate: string = null;          // start date string
  strEndDate: string = null;            // end date string
  toggleFilterPanel = false;            // the variable to toggle filter panel

  selSeriesIndex = -1                   // selected series index
  selCategoryIndex = -1                 // selected x-axis category index

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  chartType = "bar"
  chartTypes: any[] = [
    { icon: 'pi pi-chart-bar', value: 'bar' },
    { icon: 'pi pi-chart-line', value: 'line' },
  ];

  ceilWithMinimum = CeilWithMinimumPipe
  calcPeriodUniquePerc = CalcPeriodUniquePercPipe
  secondsToMinutes = SecondsToMinutesPipe

  totalData: any
  totalOptions: any

  subscription: Subscription;
  config: AppConfig;

  rangeType = 'default'

  activityReportTitle = "for Today"

  cmsUserType = CMSUserType

  colors = ['#47C650', '#E6A91D', '#2f51f3', '#6a12dd', '#9b115d', '#42A5F5']


  chartDataLabelPlugin = ChartDataLabels
  chartPlugins = [
    this.chartDataLabelPlugin,
  ]
  chartPluginsEnd = [
    this.chartDataLabelPlugin,
    {
      afterRender: () => {
        // this.blockContent = false
      }
    },
  ]
  chartPlugins1 = [
    this.chartDataLabelPlugin,
    {
      afterRender: () => {
        // this.blockContent1 = false
      }
    },
  ]

  topCustomersByTotalCallData: any
  topCustomersByTotalCallOptions: any

  topCustomersByAvgDurationData: any
  topCustomersByAvgDurationOptions: any

  topSourcesByTotalCallData: any
  topSourcesByTotalCallOptions: any

  topSourcesByAvgDurationData: any
  topSourcesByAvgDurationOptions: any

  maxTop4Value = [0, 0, 0, 0]

  @ViewChild('compareChart', { static: false }) compareChart: UIChart;

  legends: any[] = [
  ]
  selectedLegends: any[] = []
  legendLabel = ""

  mainResult: any = {}
  compareResult: any = {}

  chartCompareData: any
  chartCompareOptions: any
  maxTotalCall = 0

  uiSettings: any
  dateFormatDelimiter = "-"
  datePickerFormat = "mm/dd/yy"
  dateDisplayFormat = "mm/dd/yyyy"

  activityResult: any[] = []
  topHoursData: any
  topHoursOptions: any

  userTimezoneOffset = 0

  compareOptions = {
    title: 'This Week vs Last Week',
    button: 'Today vs Yesterday',
    isWeek: true,

    weekData: { main: null, compare: null },
    dayData: { main: null, compare: null },
  }

  constructor(public api: ApiService, private router: Router, public store: StoreService, private messageService: MessageService, private location: Location, private layoutService: LayoutService) {
    this.initilizeData()
  }

  async ngOnInit() {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    });

    this.store.state$.subscribe(state => {
      if (state.user) {
        this.fullname = (state.user.firstName ? state.user.firstName : '') + ' ' + (state.user.lastName ? state.user.lastName : '');
        if (this.fullname != "")
          this.fullname += "!"
      }
    });

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

    this.uiSettings = this.store.getDateAndWeekendFormat()
    this.dateFormatDelimiter = this.uiSettings.date.includes("-") ? "-" : "/"
    this.dateDisplayFormat = this.uiSettings.date
    this.datePickerFormat = this.uiSettings.date.replace("yyyy", "yy")

    this.isLoading = true
    try {
      this.getCallLogsCountOb().subscribe(counters => {
        if (counters != null) {
          let result = JSON.parse(JSON.stringify(counters));
          if (result && result[0][0]) {
            counters = result[0][0]

            this.logsCounts.today = counters.today;
            this.logsCounts.yesterday = counters.yesterday;
            this.logsCounts.thisWeek = counters.current_week;
            this.logsCounts.lastWeek = counters.past_week;
            this.logsCounts.thisMonth = counters.current_month;
            this.logsCounts.lastMonth = counters.past_month;

            this.makeTotalCallsReport()
          }

          try {
            let offset = this.userTimezoneOffset * 60000;

            let date = new Date();
            let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const startDate1 = moment(startDate).format('YYYY-MM-DD') + ' 00:00';
            const endDate1 = moment(endDate).format('YYYY-MM-DD') + ' 23:59';

            let timeValueForStartDate = new Date(startDate1 + ':00.000Z').getTime() + offset;
            let timeValueForEndDate = new Date(endDate1 + ':59.999Z').getTime() + offset;
            let d1 = new Date(timeValueForStartDate).toISOString().replace('T', ' ').substring(0, 19);
            let d2 = new Date(timeValueForEndDate).toISOString().replace('T', ' ').substring(0, 19);

            this.getStatistics(d1, d2).subscribe(stats => {
              if (stats != null) {
                let res = JSON.parse(JSON.stringify(stats));

                this.makeTopCustomersByTotalCalls(res.customersByTotalCall)
                this.makeTopCustomersByAvgDuration(res.customersByAvgDuration)

                this.makeTopSourcesByTotalCalls(res.trackingSourcesByTotalCall)
                this.makeTopSourcesByAvgDuration(res.trackingSourcesByAvgDuration)
              }

              this.activityReportlist()
            }, err => {

            }, () => {
            })
          } catch (err) {
            this.isLoading = false
          }
        } else {
          this.isLoading = false
        }
      }, err => {
      }, () => {
      })
    } catch (err) {
      this.isLoading = false
    }

    this.config = this.layoutService.getConfig();
    this.updateChartOptions();

    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.config = config;
      this.updateChartOptions();
    });
  }

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  initilizeData() {
    this.totalData = {
      labels: [],
      datasets: [
      ]
    };

    this.topCustomersByTotalCallData = {
      labels: [],
      datasets: [
      ]
    };
    this.topCustomersByAvgDurationData = {
      labels: [],
      datasets: [
      ]
    };

    this.topSourcesByTotalCallData = {
      labels: [],
      datasets: [
      ]
    };

    this.topSourcesByAvgDurationData = {
      labels: [],
      datasets: [
      ]
    };

    this.chartCompareData = {
      labels: [],
      datasets: [
      ]
    };

    this.topHoursData = {
      labels: [],
      datasets: [
      ]
    };
  }


  changeRangeType(type) {
    this.rangeType = type;
    // this.activityReportlist()
  }

  getHour = (time, count) => {
    if (time == null || count == null || time == 0 || count == 0)
      return "0:00"

    const exact = time / 60 / count;
    const sec = Math.round((exact - Math.floor(exact)) * 60);
    return Math.floor(exact) + ':' + (sec < 10 ? `0${sec}` : sec);
  }

  getDuration = (time) => {
    if (time == null || time == 0)
      return "0:00"

    const exact = time / 60
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

  decimalFormatted(value, dp) {
    return +parseFloat(value).toFixed(dp)
  }



  updateChartOptions() {
    if (this.config.colorScheme == 'dark')
      this.applyDarkTheme();
    else
      this.applyLightTheme();

    this.upgradeChartOptions()
  }

  applyDarkTheme() {
    this.totalOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'center',
          align: 'top',
          clip: true,
          offset: 0,
          color: 'white',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        mode: 'point',
        position: 'nearest',
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
              beginAtZero: true,
              fontColor: '#ebedef'
            }
          }
        ]
      },
    };

    this.topCustomersByTotalCallOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          clip: false,
          offset: -64,
          color: 'white',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              fontColor: '#ebedef',
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#ebedef',
            }
          }
        ]
      },
    };

    this.topCustomersByAvgDurationOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          clip: false,
          offset: -64,
          color: 'white',
          font: {
            weight: 'bold'
          },
          formatter: (value, context) => {
            return this.getDuration(value)
          }
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              fontColor: '#ebedef',
              beginAtZero: true,
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#ebedef',
            }
          }
        ]
      },
    };

    this.topSourcesByTotalCallOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          offset: -64,
          clip: false,
          color: 'white',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              fontColor: '#ebedef',
              beginAtZero: true,
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#ebedef',
            }
          }
        ]
      },
    };

    this.topSourcesByAvgDurationOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          clip: false,
          offset: -64,
          color: 'white',
          font: {
            weight: 'bold'
          },
          formatter: (value, context) => {
            return this.getDuration(value)
          }
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              fontColor: '#ebedef',
              beginAtZero: true,
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#ebedef',
            }
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
            weight: 'bold'
          },
          backgroundColor: function (context) {
            return context.dataset.backgroundColor;
          }
        },
      },
      legend: {
        display: true,
        labels: {
          fontColor: '#ebedef'
        },
      },
      tooltips: {
        intersect: false,
        mode: 'index',
        position: 'average',
        axis: 'x',
        callbacks: {
          title: (item) => {
            if (this.chartType == "bar") {
              const index = item[0].index
              const datasetIndex = item[0].datasetIndex
              const label = this.chartCompareData.labels[index].split("#")
              if (label.length > datasetIndex)
                return label[datasetIndex]
            } else {
            }
          },
          label: (item) => {
            let text = ""
            if (this.chartType == "bar") {
              text = "Total: " + item.yLabel
            } else {
              if (item.xLabel == undefined)
                text = ""
              else
                text = item.xLabel + " : " + "Total " + item.yLabel
            }

            return text
          },
          afterLabel: (item) => {
            const datasetIndex = item.datasetIndex
            const index = item.index

            const dataset = this.chartCompareData.datasets[datasetIndex]
            let total = dataset.total[index]
            total.sort((a, b) => a.count > b.count ? -1 : 1)

            const top = total.slice(0, 5)
            let text = []
            top.forEach(row => {
              if (row.count > 0)
                text.push(row.name + ": " + row.count)
            })

            return text
          }
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#42A5F5',
              callback: function (label) {
                if (label == null)
                  return undefined

                if (label.indexOf("#") >= 0) {
                  label = label.split("#")[0]
                  if (label == "")
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
              callback: function (label) {
                if (label == null)
                  return undefined

                if (label.indexOf("#") >= 0) {
                  label = label.split("#")[1]
                  if (label == "")
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
              fontColor: '#ebedef'
            }
          }
        ]
      }
    };

    this.topHoursOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'center',
          align: 'top',
          clip: true,
          offset: 0,
          color: 'white',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: true,
        labels: {
          fontColor: '#ebedef',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        mode: 'point',
        position: 'nearest',
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
              beginAtZero: true,
              fontColor: '#ebedef'
            }
          }
        ]
      },
    };
  }

  applyLightTheme() {
    this.totalOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'center',
          align: 'top',
          clip: false,
          offset: 0,
          color: 'black',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
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
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.topCustomersByTotalCallOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          offset: -64,
          clip: false,
          color: 'black',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.topCustomersByAvgDurationOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          clip: false,
          offset: -64,
          color: 'black',
          font: {
            weight: 'bold'
          },
          formatter: (value, context) => {
            return this.getDuration(value)
          }
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.topSourcesByTotalCallOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          offset: -64,
          clip: false,
          color: 'black',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#495057'
            }
          }
        ]
      }
    };

    this.topSourcesByAvgDurationOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'end',
          align: 'start',
          clip: false,
          offset: -64,
          color: 'black',
          font: {
            weight: 'bold'
          },
          formatter: (value, context) => {
            return this.getDuration(value)
          }
        }
      },
      legend: {
        display: false,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
          boxWidth: 20,
        }
      },
      tooltips: {
        enabled: true,
      },
      scales: {
        xAxes: [
          {
            display: false,
            position: 'top',
            ticks: {
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ],
        yAxes: [
          {
            ticks: {
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
          color: 'black',
          font: {
            weight: 'bold'
          },
          backgroundColor: function (context) {
            return context.dataset.backgroundColor;
          }
        },
      },
      legend: {
        display: true,
        labels: {
          fontColor: '#495057'
        }
      },
      tooltips: {
        intersect: false,
        mode: 'index',
        position: 'average',
        axis: 'x',
        callbacks: {
          title: (item) => {
            if (this.chartType == "bar") {
              const index = item[0].index
              const datasetIndex = item[0].datasetIndex
              const label = this.chartCompareData.labels[index].split("#")
              if (label.length > datasetIndex)
                return label[datasetIndex]
            } else {

            }
          },
          label: (item) => {
            let text = ""
            if (this.chartType == "bar") {
              text = "Total: " + item.yLabel
            } else {
              if (item.xLabel == undefined)
                text = ""
              else
                text = item.xLabel + " : " + "Total " + item.yLabel
            }

            return text
          },
          afterLabel: (item) => {
            const datasetIndex = item.datasetIndex
            const index = item.index

            const dataset = this.chartCompareData.datasets[datasetIndex]
            let total = dataset.total[index]
            total.sort((a, b) => a.count > b.count ? -1 : 1)

            const top = total.slice(0, 5)
            let text = []
            top.forEach(row => {
              if (row.count > 0)
                text.push(row.name + ": " + row.count)
            })

            return text
          }
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#42A5F5',
              callback: function (label) {
                if (label == null)
                  return undefined

                if (label.indexOf("#") >= 0) {
                  label = label.split("#")[0]
                  if (label == "")
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
              callback: function (label) {
                if (label == null)
                  return undefined

                if (label.indexOf("#") >= 0) {
                  label = label.split("#")[1]
                  if (label == "")
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

    this.topHoursOptions = {
      plugins: {
        datalabels: {
          display: true,
          borderRadius: 4,
          anchor: 'center',
          align: 'top',
          clip: false,
          offset: 0,
          color: 'black',
          font: {
            weight: 'bold'
          },
        }
      },
      legend: {
        display: true,
        labels: {
          fontColor: '#495057',
          fontSize: 11,
          padding: 4,
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
              beginAtZero: true,
              fontColor: '#495057'
            }
          }
        ]
      }
    };
  }

  upgradeChartOptions = async () => {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.compareChart && this.compareChart.chart) {
          clearInterval(mainUserInterval)
          resolve()
        }
      }, 100)
    })

    this.chartCompareOptions.plugins.datalabels.display = (context) => {
      const period1 = this.chartCompareData.datasets[0].data[context.dataIndex]
      const period2 = this.chartCompareData.datasets[1].data[context.dataIndex]
      const max = this.maxTotalCall
      const diff = Math.abs(period1 - period2) / max * 100

      if (diff < 3) {
        if (context.datasetIndex == 0 && period1 < period2)
          return false
        else if (context.datasetIndex == 1 && period2 < period1)
          return false
      }

      return true
    }

    // this.chartCompareOptions.scales.yAxes[0].ticks.max = Math.max(this.mainData.stats?.total_calls, this.compareData.stats?.total_calls)

    this.chartCompareOptions.tooltips.mode = 'index'
    this.chartCompareOptions.scales.xAxes[0].ticks.display = true
    this.chartCompareOptions.scales.xAxes[1].ticks.display = true

    setTimeout(() => {
      this.compareChart.chart.update()
    }, 100)
  }


  getCallLogsCountOb(): Observable<any> {
    let offset = this.userTimezoneOffset;

    return this.api.getDashLogsCount(offset * (1), this.uiSettings.weekend).pipe(map(result => {
      return result;
    }), catchError((_) => {
      this.isLoading = false
      return of(0);
    }));
  }

  getStatistics(startDate: string, endDate: string): Observable<any> {
    return this.api.getDashStatistics(startDate, endDate).pipe(map(result => {
      return result;
    }), catchError((_) => {
      this.isLoading = false
      return of(0);
    }));
  }

  makeTotalCallsReport() {
    this.totalData = {
      labels: ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month"],
      datasets: [
        {
          label: 'Total Calls',
          backgroundColor: this.colors,
          data: [this.logsCounts.today, this.logsCounts.yesterday, this.logsCounts.thisWeek, this.logsCounts.lastWeek, this.logsCounts.thisMonth, this.logsCounts.lastMonth],
          fill: this.chartType == 'bar'
        }
      ]
    }
  }

  selectData(evt) {
    console.log(evt)
  }


  makeTopCustomersByTotalCalls(customers) {
    let labels = [], colors = [], borderColors = [], data = []

    // let customers = [...this.topCustomersByTotalCall]//.filter(item => item.calls>0)
    this.maxTop4Value[0] = 0
    customers.forEach((item, index) => {
      labels.push(item.companyName)
      colors.push(hexToRgbA(CHART_COLORS[index], 0.35))
      borderColors.push(CHART_COLORS[index])
      data.push(item.calls)

      if (item.calls > this.maxTop4Value[0])
        this.maxTop4Value[0] = item.calls
    })

    this.topCustomersByTotalCallOptions.scales.xAxes[0].ticks.max = this.maxTop4Value[0] * 1.5

    let dataset = {
      label: 'Top Customers by Total Calls',
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: borderColors,
      data: data,
      fill: true,
    }

    this.topCustomersByTotalCallData = {
      labels: labels,
      datasets: [
        dataset
      ]
    }
  }

  makeTopCustomersByAvgDuration(customers) {
    let labels = [], colors = [], borderColors = [], data = []

    // let customers = [...this.topCustomersByAvgDuration]//.filter(item => item.calls>0)
    this.maxTop4Value[1] = 0
    customers.forEach((item, index) => {
      labels.push(item.companyName)
      colors.push(hexToRgbA(CHART_COLORS[index], 0.35))
      borderColors.push(CHART_COLORS[index])
      data.push(item.duration)
      if (item.duration > this.maxTop4Value[1])
        this.maxTop4Value[1] = item.duration
    })

    this.topCustomersByAvgDurationOptions.scales.xAxes[0].ticks.max = this.maxTop4Value[1] * 1.5

    let dataset = {
      label: 'Top Customers by Average Duration',
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: borderColors,
      data: data,
      fill: true,
    }

    this.topCustomersByAvgDurationData = {
      labels: labels,
      datasets: [
        dataset
      ]
    }
  }

  makeTopSourcesByTotalCalls(customers) {
    let labels = [], colors = [], borderColors = [], data = []

    // let customers = [...this.topSourcesByTotalCall]//.filter(item => item.calls>0)
    this.maxTop4Value[2] = 0
    customers.forEach((item, index) => {
      if (item.name == null)
        item.name = "Unknown"
      labels.push(item.name)
      colors.push(hexToRgbA(CHART_COLORS[index], 0.35))
      borderColors.push(CHART_COLORS[index])
      data.push(item.calls)
      if (item.calls > this.maxTop4Value[2])
        this.maxTop4Value[2] = item.calls
    })

    let dataset = {
      label: 'Top Tracking Sources by Total Calls',
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: borderColors,
      data: data,
      fill: true,
    }

    this.topSourcesByTotalCallOptions.scales.xAxes[0].ticks.max = this.maxTop4Value[2] * 1.5

    this.topSourcesByTotalCallData = {
      labels: labels,
      datasets: [
        dataset
      ]
    }
  }

  makeTopSourcesByAvgDuration(customers) {
    let labels = [], colors = [], borderColors = [], data = []

    // let customers = [...this.topSourcesByAvgDuration]//.filter(item => item.calls>0)
    this.maxTop4Value[3] = 0
    customers.forEach((item, index) => {
      if (item.name == null)
        item.name = "Unknown"
      labels.push(item.name)
      colors.push(hexToRgbA(CHART_COLORS[index], 0.35))
      borderColors.push(CHART_COLORS[index])
      data.push(item.duration)
      if (item.duration > this.maxTop4Value[3])
        this.maxTop4Value[3] = item.duration
    })

    this.topSourcesByAvgDurationOptions.scales.xAxes[0].ticks.max = this.maxTop4Value[3] * 1.5

    let dataset = {
      label: 'Top Tracking Sources by Average Duration',
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: borderColors,
      data: data,
      fill: true,
    }

    this.topSourcesByAvgDurationData = {
      labels: labels,
      datasets: [
        dataset
      ]
    }
  }

  activityReportlist = async () => {
    try {
      let viewBy = 2 // this.selectedType==ViewItem.trackingSource ? 2 : 0  // means tracking source
      let interval = 'day'  // interval for loading

      let offset = this.userTimezoneOffset

      let date = new Date();
      let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() - this.uiSettings.weekend)));
      let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() - this.uiSettings.weekend) + 6));
      const startDate1 = moment(startDate).format('YYYY-MM-DD');
      const endDate1 = moment(endDate).format('YYYY-MM-DD');
      let startDate2 = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay() - this.uiSettings.weekend)));
      let endDate2 = new Date(new Date().setDate((date.getDate() - 7) - (date.getDay() - this.uiSettings.weekend) + 6));

      let startDate_timestamp1 = new Date(startDate1 + " 00:00:00").getTime()
      let endDate_timestamp1 = new Date(endDate1 + " 23:59:59").getTime()

      await this.api.activityReport(startDate1, endDate1, offset)
        .pipe(tap((report_result1: any) => {
          const startDate = moment(startDate2).format('YYYY-MM-DD')
          let endDate = moment(endDate2).format('YYYY-MM-DD')

          const startDate_timestamp2 = new Date(startDate + " 00:00:00").getTime()
          const endDate_timestamp2 = new Date(endDate + " 23:59:59").getTime()

          this.api.activityReport(startDate, endDate, offset)
            .pipe(tap((report_result: any) => {
              let options_data: any = this.makeGraphData(report_result1.result, startDate_timestamp1, endDate_timestamp1, (-1) * offset, interval, viewBy)
              this.mainResult = options_data

              let result2: any = this.makeGraphData(report_result.result, startDate_timestamp2, endDate_timestamp2, (-1) * offset, interval, viewBy)
              this.compareResult = result2// {graph: result2, result: report_result.result, start: startDate_timestamp, end: endDate_timestamp, offset: (-1)*offset/60000, interval: report_result.req.interval, view_by: report_result.req.view_by}

              this.compareOptions.weekData.main = { ...this.mainResult }
              this.compareOptions.weekData.compare = { ...this.compareResult }

              this.activityResult = [...report_result1.result] //, ...report_result.result
              this.hoursReport()

              this.makeLegends()
            }), catchError((_) => {
              this.isLoading = false;
              return of(0);
            })).toPromise();
        }), catchError((_) => {
          this.isLoading = false;
          return of(0);
        })).toPromise();
    } catch (e) {
      this.isLoading = false
    }
  }

  activityReportlistDay = async () => {
    try {
      let viewBy = 2 // this.selectedType==ViewItem.trackingSource ? 2 : 0  // means tracking source
      let interval = 'hour'  // interval for loading

      let offset = this.userTimezoneOffset;

      let date = new Date();
      let startDate = new Date();
      let endDate = new Date();
      const startDate1 = moment(startDate).format('YYYY-MM-DD')// + ' 00:00';
      const endDate1 = moment(endDate).format('YYYY-MM-DD')// + ' 23:59';
      let startDate2 = moment().subtract(1, "days").toDate()
      let endDate2 = moment().subtract(1, "days").toDate()

      let startDate_timestamp1 = new Date(startDate1 + " 00:00:00").getTime();
      let endDate_timestamp1 = new Date(endDate1 + " 23:59:59").getTime();

      await this.api.activityReport(startDate1, endDate1, offset)
        .pipe(tap((report_result1: any) => {
          const startDate = moment(startDate2).format('YYYY-MM-DD');
          let endDate = moment(endDate2).format('YYYY-MM-DD');

          const startDate_timestamp2 = new Date(startDate + ' 00:00:00').getTime()
          const endDate_timestamp2 = new Date(endDate + ' 23:59:59').getTime()

          this.api.activityReport(startDate, endDate, offset)
            .pipe(tap((report_result: any) => {
              let options_data: any = this.makeGraphData(report_result1.result, startDate_timestamp1, endDate_timestamp1, (-1) * offset, interval, viewBy)
              this.mainResult = options_data

              let result2: any = this.makeGraphData(report_result.result, startDate_timestamp2, endDate_timestamp2, (-1) * offset, interval, viewBy)
              this.compareResult = result2// {graph: result2, result: report_result.result, start: startDate_timestamp, end: endDate_timestamp, offset: (-1)*offset/60000, interval: report_result.req.interval, view_by: report_result.req.view_by}

              this.compareOptions.dayData.main = { ...this.mainResult }
              this.compareOptions.dayData.compare = { ...this.compareResult }

              this.makeLegends()
            }), catchError((_) => {
              this.isLoading = false;
              return of(0);
            })).toPromise();
        }), catchError((_) => {
          this.isLoading = false;
          return of(0);
        })).toPromise();
    } catch (e) {
      this.isLoading = false
    }
  }

  makeGraphData(logs, sdate, edate, offset, interval, view_by) {
    let chartOptions: any = { xAxis: { categories: [] }, series: [] };

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
      const e_edate = new Date(today - today % 86400000 + from.getTimezoneOffset() * 60 * 1000)
      if (l_edate > e_edate)
        l_edate = e_edate
      while (l_sdate <= l_edate) {
        // Retrieve counted week first day
        let s_date = getMonday(l_sdate, this.uiSettings.weekend)
        if (s_date.getTime() < from.getTime())
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
          if (s_date.getTime() < from.getTime())
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
      const e_edate = new Date(today - today % 86400000 + from.getTimezoneOffset() * 60 * 1000)
      if (l_edate > e_edate)
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
      const e_edate = new Date(today - today % 86400000 + from.getTimezoneOffset() * 60 * 1000)
      if (l_edate > e_edate)
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
    let table_data: any = {
      globals: {
        total_calls: 0,
        total_time: 0,
        // total_contact: {},
        series_data: new Array(dates.length).fill(0),
        duration_data: new Array(dates.length).fill(0),
        // period_contacts: new Array(dates.length).fill({}),
      }
    };

    logs = JSON.parse(JSON.stringify(logs));
    let color_index = 0
    for (let i = 0; i < logs.length; i++) {
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
        if (int_step < dates[0])
          int_step = dates[0]
        else if (int_step > dates[dates.length - 1])
          int_step = dates[dates.length - 1]
      }
      // Interval by Month
      else if (interval === '3' || interval === 'month') {
        int_step = m_names[created.month()] + " " + created.year();
      }
      // Revert by Day - default
      else int_step = pad(created.month() + 1, 2) + this.dateFormatDelimiter + pad(created.date(), 2);

      // Retrieve series name (done by tracking source or hour)
      let series_key = log.na == null ? "Unknown" : log.na;
      if (view_by === 0 || view_by === '0') series_key = pad(created.hour(), 2);

      // Initialize series and table_data object
      // if (!series.hasOwnProperty(series_key)) {
      if (null == series[series_key]) {
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
        if (null == table_data['globals'])
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

  makeLegends() {
    let entries_data1 = [...this.mainResult?.series]
    if (!entries_data1 || entries_data1.length === 0) {
      entries_data1 = [
      ];
    } else {
    }

    let entries_data2 = [...this.compareResult?.series]
    if (!entries_data2 || entries_data2.length === 0) {
      entries_data2 = [
      ];
    } else {
    }

    let seriesForSource = []
    let names = []

    entries_data1.forEach(element => {
      const temp_entries_data = {}

      temp_entries_data['label'] = element.name
      temp_entries_data['total_calls'] = element.total_calls

      seriesForSource.push(temp_entries_data);
      names.push(element.name)
    });

    entries_data2.forEach(element => {
      const temp_entries_data = {}

      temp_entries_data['label'] = element.name
      temp_entries_data['total_calls'] = element.total_calls

      if (!names.includes(element.name)) {
        seriesForSource.push(temp_entries_data);
        names.push(element.name)
      }
    });

    seriesForSource.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)
    this.legends = [...seriesForSource]
    this.selectedLegends = [...this.legends]

    if (this.legends.length == 0)
      this.legendLabel = "No Tracking Sources"
    else
      this.legendLabel = "All Tracking Sources"

    this.makeCompareChartData()
  }

  makeCompareChartData() {
    if (this.mainResult.series == null || this.compareResult.series == null)
      return

    let names = []
    this.legends.forEach((legend) => {
      const bShow = this.selectedLegends.includes(legend)
      if (bShow)
        names.push(legend.label)
    })

    const result1 = { ...this.mainResult }
    const result2 = { ...this.compareResult }

    let entries_data1 = result1.series
    if (!entries_data1 || entries_data1.length === 0) {
      entries_data1 = [
      ];
    }

    let entries_data2 = result2.series
    if (!entries_data2 || entries_data2.length === 0) {
      entries_data2 = [
      ];
    }

    let axisXCategory = []
    if (!result1.xAxis || !result1.xAxis.categories || !result2.xAxis || !result2.xAxis.categories) {
      if (!result1.xAxis || !result1.xAxis.categories) {
        axisXCategory = [...result2.xAxis.categories];
        for (let i = 0; i < result2.xAxis.categories.length; i++) {
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
      if (result1.xAxis.categories.length >= result2.xAxis.categories.length) {
        axisXCategory = [...result1.xAxis.categories];
        for (let i = 0; i < result2.xAxis.categories.length; i++) {
          axisXCategory[i] += '#' + result2.xAxis.categories[i]
        }
      } else {
        axisXCategory = [...result2.xAxis.categories];
        for (let i = 0; i < result2.xAxis.categories.length; i++) {
          axisXCategory[i] = '#' + axisXCategory[i]
        }
        for (let i = 0; i < result1.xAxis.categories.length; i++) {
          axisXCategory[i] = result1.xAxis.categories[i] + axisXCategory[i]
        }
      }
    }

    let seriesForSource: any[] = [
      {
        total_calls: 0,
        total_time: 0,
        label: this.compareOptions.isWeek ? "This Week" : "Today",
        pointRadius: 6,
        pointHitRadius: 6,
        period_contacts: {},
        color: "#42A5F5",
        borderColor: "#42A5F5",
        fill: false,
        backgroundColor: hexToRgbA("#42A5F5", 0.85),
        hoverBackgroundColor: "#42A5F5",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d => []),
        // xAxisID: 'x-axis-1',
      }, {
        total_calls: 0,
        total_time: 0,
        label: this.compareOptions.isWeek ? "Last Week" : "Yesterday",
        pointRadius: 6,
        pointHitRadius: 6,
        period_contacts: {},
        color: "#FFA726",
        borderColor: "#FFA726",
        fill: false,
        backgroundColor: hexToRgbA("#FFA726", 0.85),
        hoverBackgroundColor: "#FFA726",
        hoverBorderWidth: 3,
        hoverBorderColor: '#47C650',
        data: new Array(axisXCategory.length).fill(0),
        total: new Array(axisXCategory.length).fill(0).map(d => []),
        // xAxisID: 'x-axis-2',
      }
    ]

    this.maxTotalCall = 0
    entries_data1.forEach((dataset, ind) => {
      let index = 0

      if (names.includes(dataset.name)) {
        seriesForSource[index].total_calls += dataset.total_calls ? dataset.total_calls : 0
        seriesForSource[index].total_time += dataset.total_time ? dataset.total_time : 0

        if (dataset.total_calls && dataset.total_calls > this.maxTotalCall)
          this.maxTotalCall = dataset.total_calls

        dataset.series_data.forEach((item, i) => {
          seriesForSource[index].data[i] += item
          seriesForSource[index].total[i].push({ name: dataset.name, count: item })
        })
      }
    })

    entries_data2.forEach((dataset) => {
      let index = 1

      if (names.includes(dataset.name)) {
        seriesForSource[index].total_calls += dataset.total_calls ? dataset.total_calls : 0
        seriesForSource[index].total_time += dataset.total_time ? dataset.total_time : 0

        if (dataset.total_calls && dataset.total_calls > this.maxTotalCall)
          this.maxTotalCall = dataset.total_calls

        dataset.series_data.forEach((item, i) => {
          seriesForSource[index].data[i] += item
          seriesForSource[index].total[i].push({ name: dataset.name, count: item })
        })
      }
    })

    seriesForSource[0].xAxisID = 'x-axis-1'
    seriesForSource[1].xAxisID = 'x-axis-2'

    this.chartCompareData.labels = axisXCategory
    this.chartCompareData.datasets = seriesForSource

    this.chartCompareData = { ...this.chartCompareData }

    this.isLoading = false
    this.upgradeChartOptions()
  }

  onChangeLegends = async (event) => {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.compareChart && this.compareChart.chart) {
          clearInterval(mainUserInterval)
          resolve()
        }
      }, 100)
    })

    if (this.legends.length > 0 && this.legends.length == this.selectedLegends.length)
      this.legendLabel = "All Tracking Sources"
    else if (this.legends.length == 0)
      this.legendLabel = "No Tracking Sources"
    else if (this.selectedLegends.length == 1)
      this.legendLabel = this.selectedLegends[0].label
    else if (this.selectedLegends.length == 0)
      this.legendLabel = "No Tracking Sources Selected"
    else
      this.legendLabel = this.selectedLegends.length + " of " + this.legends.length + " Tracking Sources Selected"

    this.makeCompareChartData()
  }

  hoursReport = async () => {
    try {
      let viewBy = 0 // this.selectedType==ViewItem.trackingSource ? 2 : 0  // means tracking source
      let interval = 'hour'  // interval for loading

      let offset = this.userTimezoneOffset * 60000;

      let date = new Date();
      let startDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() - this.uiSettings.weekend)));
      let endDate = new Date(new Date().setDate((date.getDate()) - (date.getDay() - this.uiSettings.weekend) + 6));

      const startDate1 = moment(startDate).format('YYYY-MM-DD') + ' 00:00';
      const endDate1 = moment(endDate).format('YYYY-MM-DD') + ' 23:59';
      let startDate_timestamp1 = new Date(startDate1).getTime() / 1000;
      let endDate_timestamp1 = new Date(endDate1).getTime() / 1000;

      let timeValueForStartDate = new Date(startDate1 + ':00.000Z').getTime() + offset;
      let timeValueForEndDate = new Date(endDate1 + ':59.999Z').getTime() + offset;

      let d1 = new Date(timeValueForStartDate).toISOString().replace('T', ' ').substring(0, 19);
      let d2 = new Date(timeValueForEndDate).toISOString().replace('T', ' ').substring(0, 19);

      let options_data: any = this.makeGraphData(this.activityResult, startDate_timestamp1, endDate_timestamp1, (-1) * offset / 60000, interval, viewBy)

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

      let seriesForSource: any[] = [
        {
          total_calls: 0,
          total_time: 0,
          label: "Total Calls",
          pointRadius: 6,
          pointHitRadius: 6,
          period_contacts: {},
          color: "#42A5F5",
          borderColor: "#42A5F5",
          fill: false,
          backgroundColor: hexToRgbA("#42A5F5", 0.85),
          hoverBackgroundColor: "#42A5F5",
          hoverBorderWidth: 3,
          hoverBorderColor: '#47C650',
          data: new Array(axisXCategory.length).fill(0),
          total: new Array(axisXCategory.length).fill(0).map(d => []),
          // xAxisID: 'x-axis-1',
        },
        // {
        //   total_calls: 0,
        //   total_time: 0,
        //   label: "Total Hours",
        //   pointRadius: 6,
        //   pointHitRadius: 6,
        //   period_contacts: {},
        //   color: "#FFA726",
        //   borderColor: "#FFA726",
        //   fill: false,
        //   backgroundColor: hexToRgbA("#FFA726", 0.85),
        //   hoverBackgroundColor: "#FFA726",
        //   hoverBorderWidth: 3,
        //   hoverBorderColor: '#47C650',
        //   data: new Array(axisXCategory.length).fill(0),
        //   total: new Array(axisXCategory.length).fill(0).map(d=>[]),
        //   // xAxisID: 'x-axis-2',
        // }
      ]

      entries_data.forEach((element, index) => {
        // remove last element
        seriesForSource[0].data[index] = element.total_calls
        // seriesForSource[1].data[index] = element.total_time
      })

      // seriesForSource.sort((a, b) => a.total_calls < b.total_calls ? -1 : 1)

      // convert axisXCategory to US date time format
      for (let i = 0; i < axisXCategory.length; i++) {
        let mark = axisXCategory[i]
        axisXCategory[i] = TimeToUSTime[mark]
      }

      this.topHoursData.labels = axisXCategory
      this.topHoursData.datasets = seriesForSource

      this.topHoursData = { ...this.topHoursData }
    } catch (e) {

    }
  }

  changeVSGraph = async () => {
    this.compareOptions.isWeek = !this.compareOptions.isWeek

    if (this.compareOptions.isWeek) {
      this.compareOptions.title = "This Week vs Last Week"
      this.compareOptions.button = "Today vs Yesterday"

      this.mainResult = { ...this.compareOptions.weekData.main }
      this.compareResult = { ...this.compareOptions.weekData.compare }

      this.makeLegends()
    } else {
      this.compareOptions.title = "Today vs Yesterday"
      this.compareOptions.button = "This Week vs Last Week"

      if (this.compareOptions.dayData.main == null) {
        await this.activityReportlistDay()
      } else {
        this.mainResult = { ...this.compareOptions.dayData.main }
        this.compareResult = { ...this.compareOptions.dayData.compare }

        this.makeLegends()
      }
    }
  }
}

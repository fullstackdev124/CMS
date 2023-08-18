import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core'
import { FilterDate, DateOptions, DateButtonOptions } from '../constant'
import {StoreService} from '@services/store/store.service'
import {ApiService} from '@services/api/api.service'
import moment, {utc} from 'moment'
import {MessageService} from "primeng/api";

@Component({
  selector: 'filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent implements OnInit {

  // filter params
  dateOptions = DateOptions             // date mode options
  dateButtonOptions = DateButtonOptions

  @Input()
  dateMode = FilterDate.today.toString() // filter date mode

  filterDate = FilterDate

  @Input()
  strStartDate = ''                       // start date string

  @Input()
  strEndDate = ''                         // end date string

  activated = false;

  filterMode = 'filter_options';

  sDate: Date
  eDate: Date

  sMonth: Date
  eMonth: Date

  @Output('toggle')
  toggleEvent: EventEmitter<any> = new EventEmitter();

  constructor(public api: ApiService, private store: StoreService, private messageService: MessageService) { }

  ngOnInit(): void {
    if (this.dateMode==FilterDate.range) {
      if (this.strStartDate!='') {
        this.sDate = moment(this.strStartDate, 'YYYY-MM-DD').toDate()
      }

      if (this.strEndDate!='') {
        this.eDate = moment(this.strEndDate, 'YYYY-MM-DD').toDate()
      }
    } else if (this.dateMode == FilterDate.month) {
      if (this.strStartDate!='') {
        this.sMonth = moment(this.strStartDate, 'YYYY-MM-DD').toDate()
      }
    }

    this.selectDate(this.dateMode)
  }

  ngOnChanges(changes): void {

    if (changes.toggle != undefined && changes.toggle.previousValue != undefined)
      this.toggleFilterMenu()
  }

  /**
   * Set start and end date from filtering Option
   * @param dateMode
   * @param sDate
   * @param eDate
   */
  selectDate = (dateMode, sDate = null, eDate = null) => {
    if (this.dateMode!=dateMode) {
      if (dateMode == FilterDate.month) {
        this.sMonth = this.sDate
      } else {
        this.sDate = this.sMonth
        this.eDate = this.sMonth
      }
    }

    if (!(!!sDate && !!eDate)) {
      this.dateMode = dateMode
    }

    const today = new Date()
    const now = moment(today).format('YYYY-MM-DD').toString()
    let startDate = sDate, endDate = eDate

    let strStartDate = moment(this.sDate).format('YYYY-MM-DD').toString(), strEndDate = moment(this.eDate).format('YYYY-MM-DD').toString()
    switch (dateMode) {
      case FilterDate.today:
        {
          strStartDate = now
          strEndDate = now
        }
        break

      case FilterDate.yesterday:
        {
          const yesterday = moment(new Date(today.setDate(today.getDate() - 1))).format('YYYY-MM-DD').toString()
          strStartDate = yesterday
          strEndDate = yesterday
        }
        break

      case FilterDate.thisMonth:
        {
          strStartDate = moment().startOf('month').format('YYYY-MM-DD')
          strEndDate = moment().endOf('month').format('YYYY-MM-DD')
        }
        break

      case FilterDate.lastMonth:
        {
          strStartDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD')
          strEndDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD')
        }
        break

      case FilterDate.thisWeek:
        {
          strStartDate = moment().startOf('week').format('YYYY-MM-DD')
          strEndDate = moment().endOf('week').format('YYYY-MM-DD')
        }
        break

      case FilterDate.lastWeek:
        {
          strStartDate = moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD')
          strEndDate = moment().subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD')
        }
        break

      case FilterDate.last7:
        {
          strStartDate = moment(new Date(today.setDate(today.getDate() - 6))).format('YYYY-MM-DD')
          strEndDate = now
        }
        break

      case FilterDate.last30:
        {
          strStartDate = moment(new Date(today.setDate(today.getDate() - 29))).format('YYYY-MM-DD')
          strEndDate = now
        }
        break

      case FilterDate.last60:
      {
        strStartDate = moment(new Date(today.setDate(today.getDate() - 59))).format('YYYY-MM-DD')
        strEndDate = now
      }
        break

      case FilterDate.month:
        {
          strStartDate = moment(this.sMonth).format('YYYY-MM').toString() + "-01"
          strEndDate = moment(this.sMonth).endOf('month').format('YYYY-MM-DD')
        }
        break
    }

    this.strStartDate = strStartDate
    this.strEndDate = strEndDate

    if (startDate && endDate) {
      // const tzoffset = new Date().getTimezoneOffset() * 60000
      // // @ts-ignore
      // this.strStartDate = new Date(startDate - tzoffset).toISOString().substring(0, 10)
      // // @ts-ignore
      // this.strEndDate = new Date(endDate - tzoffset).toISOString().substr(0, 10)
    }

    this.sDate = moment(this.strStartDate, 'YYYY-MM-DD').toDate()
    this.eDate = moment(this.strEndDate, 'YYYY-MM-DD').toDate()

    this.sMonth = this.sDate
  }

  toggleFilterMenu = () => {
    this.toggleEvent.emit()
  }

  onFilter = async () => {
    // if (this.strStartDate=="" || this.strEndDate=="") {
    //   this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: "Please select date" });
    //   return
    // }
    if (this.dateMode == FilterDate.month) {
      this.sDate = moment(moment(this.sMonth).format('YYYY-MM').toString() + "-01", 'YYYY-MM-DD').toDate()
      this.eDate = moment(moment(this.sMonth).endOf('month').format('YYYY-MM-DD'), 'YYYY-MM-DD').toDate()
    }

    const startDate = moment(this.sDate).format('YYYY-MM-DD') + ' 00:00';
    const endDate = moment(this.eDate).format('YYYY-MM-DD') + ' 23:59';

    await this.store.storeFilters({dateMode: this.dateMode, startDate: startDate, endDate: endDate})
    this.store.setFilter()

    this.toggleFilterMenu()
  }
}

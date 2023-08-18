import {FilterObj} from '@app/models/callLog';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { Pipe, PipeTransform } from '@angular/core';
import {getTimeZones, rawTimeZones} from "@vvo/tzdb";

export const getKey = (key: string) => {
  if (key === 'name' || key === 'city' || key === 'state' || key === 'country') {
    return 'Phonebook.' + key

  } else if (key === 'source') {
    return 'trackingSourceName'

  } else if (key === 'op_tracking_number') {
    return 'OpNumber.tracking_number'

  } else if (key === 'number') {
    return 'callerNumber'

  } else if (key === 'routing') {
    return 'SipGateways.address'

  } else if (key === 'receiving_number') {
    return 'ReceivingNumber.number'

  } else if (key === 'tracking_source') {
    return 'TrackingSources.name'

  } else if (key === 'companyId') {
    return 'Customer.companyId'

  } else if (key === 'created') {
    return 'metrics'
  }

  return key
}

export const callLogKeys = [
  'Phonebook.name',
  'Phonebook.city',
  'Phonebook.state',
  'Phonebook.country',
  'OpNumber.TrackingSources.name',
  'OpNumber.SipGateways.address',
  'OpNumber.ReceivingNumber.number',
  'callerNumber',
  'trackingNumber',
  'metrics',
]

export const callLogKeysForSupport = [
  'phonebookName',
  'PhonebookCity',
  'PhonebookState',
  'PhonebookCountry',
  'trackingSourceName',
  'routingAddress',
  'receivingNumber',
  'callerNumber',
  'trackingNumber',
  'metrics',
]

// export const callLogKeysForHadoop = [
//   'callerNumber',
//   'trackingNumber',
//   'trackingSourceName',
//   'routingAddress',
//   'receivingNumber',
//   'metrics',
// ]

export const receivingNumberKeys = [
  'number',
  'description',
  'Customer.companyId',
  "OpNumber.tracking_number",
  'totalCalls'
]

export const sipGatewayKeys = [
  'name',
  'address',
  'port',
  'digitsStrip',
  'description',
]

export const trackingKeys = [
  'tracking_number',
  'description',
  'TrackingSources.name',
  'Customer.companyId',
  'ReceivingNumber.number',
  'SipGateways.address'
]

export const trackingSourceKeys = [
  'name',
  'description',
  'Customer.companyId',
  'type'
]

export const userKeys = [
  'username',
  'email',
  'customerId',
  'id'
]

export const roleKeys = [
  'name',
  'description',
]

export const customerKeys = [
  'firstName',
  'lastName',
  'vatNumber',
  'companyName',
  'companyId',
  'billingEmail',
]

export const getTimeSearchValue = (value) => {
  if (value.charAt(0) === '0') {
    value = value.substr(1)
  }

  if (USTimeToTime[value] != undefined) {
    let hourValue = parseInt(USTimeToTime[value])
    hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

    if (hourValue < 10)
      value = ' 0' + hourValue + ":"
    else
      value = ' ' + String(hourValue) + ":"
  }
  return value
}

export const getParamsForFilter = (filterValue: string) => {

  let created = ""
  let fields = ""
  let searchValue = ""
  let isValidFormat = false

  if (filterValue) {
    /*if (filterValue.includes(",")) {
      let filterBlocks = filterValue.split(",")
      for (let filter of filterBlocks) {
        if (filter.includes(':')) {   // like Source:"DIP",created:"1am"
          const values = filter.split(':"')

          let key = values[0]
          let rKey = getKey(key)
          let value = values[1].replace('"', '')
          if (key === 'created') {
            created = getTimeSearchValue(value)

          } else {
            fields = fields == '' ? rKey : fields + "," + rKey
            searchValue = value
          }

          isValidFormat = true

        } else {  // like    Source:"DIP", 1 am  or  DIP,1 am   and so on
          if (isValidFormat)
            isValidFormat = false
        }
      }

    } else*/ if (filterValue.includes(':')) {
      const values = filterValue.split(':"')

      let key = values[0]
      let rKey = getKey(key)
      let value = values[1].replace('"', '')
      if (key === 'created') {
        created = getTimeSearchValue(value)

      } else {
        fields = rKey
        searchValue = value
      }

      isValidFormat = true

    } else {

      if (USTimeToTime[filterValue.toUpperCase()] != undefined) {
        created = getTimeSearchValue(filterValue.toUpperCase())
        isValidFormat = true

      }
    }
  }

  if (!isValidFormat)
    searchValue = filterValue

  return {
    fields: fields,
    search: searchValue,
    created: created
  }
}

export const getCountWhere = (filterValue: string, date1: string, date2: string, keys: string[], customerFilter?: any, numberFields?: string, customCondition?: any) => {
  let obj: FilterObj = {
  }
  let sobj = {}
  let rkeys = []
  let created = {}

  // date filtering option
  if (date1 && date2) {
    created = {
      'created': { between: [date1, date2] }
    }
    obj = {...obj, 'where': created}
  }


  // filtering by keyword
  if (filterValue) {
    if (filterValue.includes(",")) {
      let filterBlocks = filterValue.split(",")
      for (let filter of filterBlocks) {
        const values = filter.split(':"')

        let key = values[0]
        let rkey = ''
        let value = values[1].replace('"', '')
        rkey = getKey(key)
        if (key === 'created') {
          if (value.charAt(0) === '0') {
            value = value.substr(1)
          }

          if (USTimeToTime[value] != undefined) {
            let hourValue = parseInt(USTimeToTime[value])
            hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

            if (hourValue < 10)
              value = ' 0' + hourValue + ":"
            else
              value = ' ' + String(hourValue) + ":"
          }

          const v = { like: `%${value}%` }
          rkeys.push({ metrics: v })

        } else {
          sobj[rkey] = value
        }
      }
      // sobj['and'] = rkeys
      let where = {
        'and': [created, sobj]
      }

      if (customerFilter)
        where.and = where.and.concat(customerFilter)

      where.and = where.and.concat(rkeys)
      if (customCondition)
        where.and.push(customCondition)
      obj = { ...obj, 'where': where }

    }
    else if (filterValue.includes(':')) {
      const values = filterValue.split(':"')

      let key = values[0]
      let rkey = ''
      let value = values[1].replace('"', '')
      rkey = getKey(key)
      if (key === 'created') {
        if (value.charAt(0) === '0') {
          value = value.substr(1)
        }

        if (USTimeToTime[value] != undefined) {
          let hourValue = parseInt(USTimeToTime[value])
          hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

          if (hourValue < 10)
            value = ' 0' + hourValue + ":"
          else
            value = ' ' + String(hourValue) + ":"
        }

        const v = { like: `%${value}%` }
        sobj = { metrics: v }
      } else {
        sobj[rkey] = value
      }
      let where = {
        'and': [created, sobj]
      }

      if (customerFilter)
        where.and = where.and.concat(customerFilter)
      if (customCondition)
        where.and.push(customCondition)

      obj = { ...obj, 'where': where }
    }
    else {
      if (USTimeToTime[filterValue.toUpperCase()] != undefined) {
        let hourValue = parseInt(USTimeToTime[filterValue.toUpperCase()])
        hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

        let value = ''
        if (hourValue < 10)
          value = ' 0' + hourValue + ":"
        else
          value = ' ' + String(hourValue) + ":"

        const v = { like: `%${value}%` }
        sobj = { metrics: v }
      }
      else {
        for (let i = 0; i < keys.length; i++) {
          let like = {}
          if (numberFields!=null && numberFields.includes(keys[i])) {
            let fValue = filterValue.replace(/\D/g, '')
            if (fValue!="")
              like[keys[i]] = { like: `%${fValue}%` }
          }
          else
            like[keys[i]] = { like: `%${filterValue}%` }
          rkeys.push(like)
        }
        sobj['or'] = rkeys
      }

      let where = {
        'and': [created, sobj]
      }

      if (customerFilter)
        where.and = where.and.concat(customerFilter)
      if (customCondition)
        where.and.push(customCondition)

      obj = { ...obj, 'where': where }
    }
  }
  else if (customerFilter) {
    if (obj.where) {
      if (obj.where.and) {
        // if it's where.and and it's already array, just concat
        obj.where = obj.where.and.concat(customerFilter);
      } else {
        // just like {created : ...}, then convert into array of {key:value}
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value})).concat(customerFilter)}};
      }

      if (customCondition)
        obj.where.and.push(customCondition)
    } else {
      obj = {...obj, 'where': customerFilter }

      if (customCondition) {
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value}))}};
        obj.where.and.push(customCondition)
      }
    }
  }
  else if (customCondition) {
    if (obj.where) {
      if (obj.where.and) {
        // if it's where.and and it's already array, just concat
        obj.where.and.push(customCondition)
      } else {
        // just like {created : ...}, then convert into array of {key:value}
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value}))}};
        obj.where.and.push(customCondition)
      }
    } else {
      obj = {...obj, 'where': customCondition }
    }
  }


  // sort filtering option
  if (obj.where == undefined) {
    let where = {}
    return encodeURIComponent(JSON.stringify(where))
  }

  return encodeURIComponent(JSON.stringify(obj.where))
}

export const getFilter = (active: string, direction: string, size: number, page: number, filterValue: string, date1: string, date2: string, keys: string[], val?: string, customerFilter?: any, numberFields?: string, customCondition?: any) => {
  let filter = 'filter='
  let obj: FilterObj = {
    limit: size,
    skip: (page - 1) * size
  }
  let sobj = {}
  let rkeys = []
  let created = {}

  // date filtering option
  if (date1 && date2) {
    created = {
      'created': { between: [date1, date2] }
    }
    obj = { ...obj, 'where': created }
  }

  // filtering by keyword
  if (filterValue) {
    if (filterValue.includes(",")) {
      let filterBlocks = filterValue.split(",")
      for (let filter of filterBlocks) {
        const values = filter.split(':"')

        let key = values[0]
        let rkey = ''
        let value = values[1].replace('"', '')
        rkey = getKey(key)
        if (key === 'created') {
          if (value.charAt(0) === '0') {
            value = value.substr(1)
          }

          if (USTimeToTime[value] != undefined) {
            let hourValue = parseInt(USTimeToTime[value])
            hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

            if (hourValue < 10)
              value = ' 0' + hourValue + ":"
            else
              value = ' ' + String(hourValue) + ":"
          }

          const v = { like: `%${value}%` }
          rkeys.push({ metrics: v })

        } else {
          sobj[rkey] = value
        }
      }
      // sobj['and'] = rkeys
      let where = {
        'and': [created, sobj]
      }
      where.and = where.and.concat(rkeys)

      if (customerFilter)
        where.and = where.and.concat(customerFilter)
      if (customCondition)
        where.and.push(customCondition)

      obj = { ...obj, 'where': where }

    }
    else if (filterValue.includes(':')) {
      if (val && val.length > 0) {
        // for (let i = 0; i < keys.length; i++) {
        //   let like = {}
        //   like[keys[i]] = { like: `%${val}%` }
        //   rkeys.push(like)
        // }

        // sobj['or'] = rkeys
        // const values = filterValue.split(':"')
        // let key = values[0]
        // let rkey = ''
        // const value = values[1].replace('"', '')
        // rkey = getKey(key)
        // const and = {}
        // and[rkey] = value
        // sobj['and'] = [and]
        // let where = {
        //   'and': [created, sobj]
        // }
        // if (customerFilter)
        //   where.and = where.and.concat(customerFilter)
        // obj = { ...obj, 'where': where }
      }
      else {
        const values = filterValue.split(':"')

        let key = values[0]
        let rkey = ''
        let value = values[1].replace('"', '')
        rkey = getKey(key)
        if (key === 'created') {
          if (value.charAt(0) === '0') {
            value = value.substr(1)
          }

          if (USTimeToTime[value] != undefined) {
            let hourValue = parseInt(USTimeToTime[value])
            hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

            if (hourValue < 10)
              value = ' 0' + hourValue + ":"
            else
              value = ' ' + String(hourValue) + ":"
          }

          const v = { like: `%${value}%` }
          sobj = { metrics: v }
        } else {
          sobj[rkey] = value
        }

        let where = {
          'and': [created, sobj]
        }
        if (customerFilter)
          where.and = where.and.concat(customerFilter)
        if (customCondition)
          where.and.push(customCondition)

        obj = { ...obj, 'where': where }
      }
    }
    else {
      if (USTimeToTime[filterValue.toUpperCase()] != undefined) {
        let hourValue = parseInt(USTimeToTime[filterValue.toUpperCase()])
        hourValue = (24 + hourValue + new Date().getTimezoneOffset() / 60) % 24

        let value = ''
        if (hourValue < 10)
          value = ' 0' + hourValue + ":"
        else
          value = ' ' + String(hourValue) + ":"

        const v = { like: `%${value}%` }
        sobj = { metrics: v }
      }
      else {
        for (let i = 0; i < keys.length; i++) {
          let like = {}
          if (numberFields!=null && numberFields.includes(keys[i])) {
            let fValue = filterValue.replace(/\D/g, '')
            if (fValue!="")
              like[keys[i]] = { like: `%${fValue}%` }
          }
          else
            like[keys[i]] = { like: `%${filterValue}%` }
          rkeys.push(like)
        }
        sobj['or'] = rkeys
      }
      let where = {
        'and': [created, sobj]
      }

      if (customerFilter)
        where.and = where.and.concat(customerFilter)
      if (customCondition)
        where.and.push(customCondition)

      obj = { ...obj, 'where': where }
    }
  }
  else if (customerFilter) {
    if (obj.where) {
      if (obj.where.and) {
        // if it's where.and and it's already array, just concat
        obj.where = obj.where.and.concat(customerFilter);
      } else {
        // just like {created : ...}, then convert into array of {key:value}
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value})).concat(customerFilter)}};
      }

      if (customCondition)
        obj.where.and.push(customCondition)
    } else {
      obj = {...obj, 'where': customerFilter}

      if (customCondition) {
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value}))}};
        obj.where.and.push(customCondition)
      }
    }
  }
  else if (customCondition) {
    if (obj.where) {
      if (obj.where.and) {
        // if it's where.and and it's already array, just concat
        obj.where.and.push(customCondition)
      } else {
        // just like {created : ...}, then convert into array of {key:value}
        obj = { ...obj, 'where': {and: _.map(obj.where, (value, key) => ({[key]: value}))}};
        obj.where.and.push(customCondition)
      }
    } else {
      obj = {...obj, 'where': customCondition }
    }
  }

  // sort filtering option
  if (active && direction) {
    obj = {...obj, 'order': `${active} ${direction}`}
  }

  filter += encodeURIComponent(JSON.stringify(obj))
  return filter
}

export const initOption = (isBar: boolean, category: string[], series: any) => {
  if (isBar) {
    return {
      chart: {
        height: 400,
        type: 'bar',
        backgroundColor: '#424242',
        plotBorderColor: '#606063',
        width: window.innerWidth - 145
      },
      // title: {
      //   text: null
      // },
      // global: {
      //   useUTC: false
      // },
      // colors: colors,
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xAxis: {
        gridLineColor: '#505053',
        type: 'category',
        categories: category,
        labels: {format: '{value:%b %e}'}
      },
      // tooltip: {
      //   format: '<span style="color:{point.color}">●</span> <span style="font-weight: bold">{series.name}</span> : <b>{point.y}</b><br/>',
      //   shared: false,
      //   followPointer: true
      // },
      yAxis: {
        gridLineColor: '#505053',
        min: 0,
        // stackLabels: {
        //   enabled: true,
        //   style: {
        //     fontWeight: 'regular',
        //     color: '#fff'
        //   }
        // },
        title: {
          text: 'Calls/forms/texts'
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        bar: {
          horizontal: false,
        },
        series: {
          stacking: 'normal'
        },
        column: {
          borderWidth: 1,
          borderColor: '#505053'
        }
      },
      dataLabels: {
        enabled: false
      },
      series: series,
      // credits: {
      //   enabled: false
      // }
    }

  } else {
    return {
      chart: {
        type: 'area',
        backgroundColor: '#424242',
        plotBorderColor: '#606063',
        width: window.innerWidth - 100
      },
      title: {
        text: null
      },
      colors: colors,
      xAxis: {
        gridLineColor: '#505053',
        type: 'category',
        categories: category,
        labels: {format: '{value:%b %e}'}
      },
      tooltip: {
        format: '<span style="color:{point.color}">●</span> <span style="font-weight: bold">{series.name}</span>: <b>{point.y}</b><br/>',
        shared: true,
        followPointer: true
      },
      yAxis: {
        gridLineColor: '#505053',
        min: 0,
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'regular',
            color: '#fff'
          }
        },
        title: {
          text: 'Calls/forms/texts'
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        area: {
          fillOpacity: 0.5
        }
      },
      series: series,
      credits: {
        enabled: false
      }
    }
  }
}

export const TimeToUSTime = {
  '00': '12 AM',
  '01': '1 AM',
  '02': '2 AM',
  '03': '3 AM',
  '04': '4 AM',
  '05': '5 AM',
  '06': '6 AM',
  '07': '7 AM',
  '08': '8 AM',
  '09': '9 AM',
  '10': '10 AM',
  '11': '11 AM',
  '12': '12 PM',
  '13': '1 PM',
  '14': '2 PM',
  '15': '3 PM',
  '16': '4 PM',
  '17': '5 PM',
  '18': '6 PM',
  '19': '7 PM',
  '20': '8 PM',
  '21': '9 PM',
  '22': '10 PM',
  '23': '11 PM',
}

export const USTimeToTime = {
  '12 AM': '00',
  '1 AM': '01',
  '2 AM': '02',
  '3 AM': '03',
  '4 AM': '04',
  '5 AM': '05',
  '6 AM': '06',
  '7 AM': '07',
  '8 AM': '08',
  '9 AM': '09',
  '10 AM': '10',
  '11 AM': '11',
  '12 PM': '12',
  '1 PM': '13',
  '2 PM': '14',
  '3 PM': '15',
  '4 PM': '16',
  '5 PM': '17',
  '6 PM': '18',
  '7 PM': '19',
  '8 PM': '20',
  '9 PM': '21',
  '10 PM': '22',
  '11 PM': '23',
}

export const USMonthToMonth = {
  'Jan': '01',
  'Feb': '02',
  'Mar': '03',
  'Apr': '04',
  'May': '05',
  'Jun': '06',
  'Jul': '07',
  'Aug': '08',
  'Sep': '09',
  'Oct': '10',
  'Nov': '11',
  'Dec': '12',
}

export const MonthToUSMonth = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
}

export const colors = [
  '#57CC5A', '#5bbcd2', '#ffc959', '#E45B5B',
  '#C79E76', '#FF663C', '#BE5CBA', '#ffb3b3',
  '#5B6BC3', '#FF5793', '#007B6B', '#D1005C',
  '#8655C6', '#00ACF8', '#7BC53B', '#FFD700',
  '#FF8600', '#88db44', '#db44a7', '#058DC7',
  '#61767a', '#007348', '#756453', '#903242',
  '#456562', '#987734', '#A64644', '#456542',
  '#643627', '#A87635', '#564523', '#135797',
  '#456787', '#123543', '#123456', '#234514',
  '#F23465', '#F96745', '#FF2945', '#465782',
  '#789543', '#481664', '#784523', '#765465',
  '#798742', '#551375', '#156489', '#798423'
]

export const getDateByUTC = (date: Date) => {
  return date && new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())).toISOString()
}

export const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = error => reject(error)
})

export const scrollToTop = () => {
  document.body.scrollTop = document.documentElement.scrollTop = 0
}

export const overviewOptions = (data, category) => {
  return {
    colors: colors,
    title: {
      text: null
    },
    chart: {
      type: 'line',
      backgroundColor: '#424242',
      plotBorderColor: '#606063',
      width: window.innerWidth - 100,
      height: 400,
      inverted: false
    },
    series: data,
    xAxis: {
      type: 'category',
      categories: category,
      labels: {format: '{value:%b %e}'}
    },
    tooltip: {
      format: '<span style="color:{point.color}">●</span> <span style="font-weight: bold">{series.name}</span> : <b>{point.y}</b><br/>',
      shared: true,
      followPointer: true
    },
    yAxis: {
      gridLineColor: '#505053',
      min: 0,
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'regular',
          color: '#fff'
        }
      },
      title: {
        text: null
      }
    },
    plotOptions: {
      series: {
        dataLabels: {
          color: '#F0F0F3',
          style: {
            fontSize: '13px'
          }
        },
        marker: {
          lineColor: '#333'
        }
      },
      boxplot: {
        fillColor: '#505053'
      },
      candlestick: {
        lineColor: 'white'
      },
      errorbar: {
        color: 'white'
      }
    },
    legend: {
      backgroundColor: '#424242',
      itemStyle: {
        color: '#E0E0E3'
      },
      itemHoverStyle: {
        color: '#FFF'
      },
      itemHiddenStyle: {
        color: '#606063'
      },
      title: {
        style: {
          color: '#C0C0C0'
        }
      }
    },
    credits: {
      enabled: false
    },
    labels: {
      style: {
        color: '#707073'
      }
    },
    drilldown: {
      activeAxisLabelStyle: {
        color: '#F0F0F3'
      },
      activeDataLabelStyle: {
        color: '#F0F0F3'
      }
    },
    navigation: {
      buttonOptions: {
        symbolStroke: '#DDDDDD',
        theme: {
          fill: '#505053'
        }
      }
    },
    // scroll charts
    rangeSelector: {
      buttonTheme: {
        fill: '#505053',
        stroke: '#000000',
        style: {
          color: '#CCC'
        },
        states: {
          hover: {
            fill: '#707073',
            stroke: '#000000',
            style: {
              color: 'white'
            }
          },
          select: {
            fill: '#000003',
            stroke: '#000000',
            style: {
              color: 'white'
            }
          }
        }
      },
      inputBoxBorderColor: '#505053',
      inputStyle: {
        backgroundColor: '#333',
        color: 'silver'
      },
      labelStyle: {
        color: 'silver'
      }
    },
    navigator: {
      handles: {
        backgroundColor: '#666',
        borderColor: '#AAA'
      },
      outlineColor: '#CCC',
      maskFill: 'rgba(255,255,255,0.1)',
      series: {
        color: '#7798BF',
        lineColor: '#A6C7ED'
      },
      xAxis: {
        gridLineColor: '#505053'
      }
    },
  }
}

export const overviewHourOption = (data, category) => {
  return {
    colors: colors,
    title: {
      text: null
    },
    chart: {
      type: 'line',
      backgroundColor: '#424242',
      plotBorderColor: '#606063',
      width: window.innerWidth - 100,
      height: 400,
      inverted: false
    },
    series: data,
    xAxis: {
      type: 'category',
      categories: category,
      labels: {
        step: 24,
        formatter: function() {
          return this.value.split('  ')[0]
        }
      }
    },
    tooltip: {
      format: '<span style="color:{point.color}">●</span> <span style="font-weight: bold">{series.name}</span> : <b>{point.y}</b><br/>',
      shared: true,
      followPointer: true
    },
    yAxis: {
      gridLineColor: '#505053',
      min: 0,
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'regular',
          color: '#fff'
        }
      },
      title: {
        text: null
      }
    },
    plotOptions: {
      series: {
        dataLabels: {
          color: '#F0F0F3',
          style: {
            fontSize: '13px'
          }
        },
        marker: {
          lineColor: '#333'
        }
      },
      boxplot: {
        fillColor: '#505053'
      },
      candlestick: {
        lineColor: 'white'
      },
      errorbar: {
        color: 'white'
      }
    },
    legend: {
      backgroundColor: '#424242',
      itemStyle: {
        color: '#E0E0E3'
      },
      itemHoverStyle: {
        color: '#FFF'
      },
      itemHiddenStyle: {
        color: '#606063'
      },
      title: {
        style: {
          color: '#C0C0C0'
        }
      }
    },
    credits: {
      enabled: false
    },
    labels: {
      style: {
        color: '#707073'
      }
    },
    drilldown: {
      activeAxisLabelStyle: {
        color: '#F0F0F3'
      },
      activeDataLabelStyle: {
        color: '#F0F0F3'
      }
    },
    navigation: {
      buttonOptions: {
        symbolStroke: '#DDDDDD',
        theme: {
          fill: '#505053'
        }
      }
    },
    // scroll charts
    rangeSelector: {
      buttonTheme: {
        fill: '#505053',
        stroke: '#000000',
        style: {
          color: '#CCC'
        },
        states: {
          hover: {
            fill: '#707073',
            stroke: '#000000',
            style: {
              color: 'white'
            }
          },
          select: {
            fill: '#000003',
            stroke: '#000000',
            style: {
              color: 'white'
            }
          }
        }
      },
      inputBoxBorderColor: '#505053',
      inputStyle: {
        backgroundColor: '#333',
        color: 'silver'
      },
      labelStyle: {
        color: 'silver'
      }
    },
    navigator: {
      handles: {
        backgroundColor: '#666',
        borderColor: '#AAA'
      },
      outlineColor: '#CCC',
      maskFill: 'rgba(255,255,255,0.1)',
      series: {
        color: '#7798BF',
        lineColor: '#A6C7ED'
      },
      xAxis: {
        gridLineColor: '#505053'
      }
    },
  }
}

export const weeks = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

export const pieOption1 = (series, title) => {
  return {
    credits: {
      enabled: false
    },
    chart: {
      type: 'pie',
      backgroundColor: '#424242',
      plotBorderColor: '#606063',
      width: 250,
      height: 350,
    },
    title: {
      text: null
    },
    accessibility: {
      announceNewData: {
        enabled: true
      },
      point: {
        valueSuffix: '%'
      }
    },

    plotOptions: {
      pie: {
        borderWidth: 0
      },
      series: {
        dataLabels: {
          enabled: false,
          format: '{point.name}: {point.y:.1f}%'
        }
      }
    },

    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
    },
    series: [
      {
        name: title,
        colorByPoint: true,
        data: series
      }
    ]
  }
}

export const getApexPieChartOption = (series, lables, colors): any => {
  colors.map((m, index) => {
    const length = m.length;
    if (length < 7) {
      for (let i = 1; i <= 7 - length; i++) {
        colors[index] = colors[index].concat('0');
      }
    }
  });
  return {
    series,
    chart: {
      width: 380,
      type: 'pie'
    },
    labels: lables,
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    colors
  };
}

export const findDuplicates = (arr) => {
  const data = _.groupBy(arr, 'caller_contactId');
  const values = Object.values(data);
  const newCount = values.filter((v: any[]) => v.length === 1).length;
  const dup = values.filter((v: any[]) => v.length !== 1);
  return {repeat: values.length - newCount, newCount, reLogs: dup}
}

export const tzs = [
  {name: '(GMT-11:00) American Samoa', value: -11},
  {name: '(GMT-11:00) International Date Line West', value: -11},
  {name: '(GMT-11:00) Midway island', value: -11},
  {name: '(GMT-10:00) Hawaii', value: -10},
  {name: '(GMT-09:00) Alaska', value: -9},
  {name: '(GMT-08:00) America/Los_Angeles', value: -8},
  {name: '(GMT-08:00) Pacific Time (US & Canada)', value: -8},
  {name: '(GMT-08:00) Tijuana', value: -8},
  {name: '(GMT-07:00) America/Denver', value: -7},
  {name: '(GMT-07:00) America/Phoenix', value: -7},
  {name: '(GMT-07:00) Arizona', value: -7},
  {name: '(GMT-07:00) Chihuahua', value: -7},
  {name: '(GMT-07:00) Mazatlan', value: -7},
  {name: '(GMT-07:00) Mountain Time (US & Canada)', value: -7},
  {name: '(GMT-06:00) America/Chicago', value: -6},
  {name: '(GMT-06:00) Central America', value: -6},
  {name: '(GMT-06:00) Central Time (US & Canada)', value: -6},
  {name: '(GMT-06:00) Guadalajara', value: -6},
  {name: '(GMT-06:00) Mexico City', value: -6},
  {name: '(GMT-06:00) Monterrey', value: -6},
  {name: '(GMT-06:00) Saskatchewan', value: -6},
  {name: '(GMT-05:00) America/New_York', value: -5},
  {name: '(GMT-05:00) America/Toronto', value: -5},
  {name: '(GMT-05:00) Bogota', value: -5},
  {name: '(GMT-05:00) Eastern Time (US & Canada)', value: -5},
  {name: '(GMT-05:00) Indiana (East)', value: -5},
  {name: '(GMT-05:00) Lima', value: -5},
  {name: '(GMT-05:00) Quito', value: -5},
  {name: '(GMT-04:00) Atlantic Time (Canada)', value: -4},
  {name: '(GMT-04:00) Caracas', value: -4},
  {name: '(GMT-04:00) Georgetown', value: -4},
  {name: '(GMT-04:00) La Paz', value: -4},
  {name: '(GMT-04:00) Santiago', value: -4},
  {name: '(GMT-03:30) Newfoundland', value: -3.5},
  {name: '(GMT-03:00) America/Sao_Paulo', value: -3},
  {name: '(GMT-03:00) Brasilia', value: -3},
  {name: '(GMT-03:00) Buenos Aires', value: -3},
  {name: '(GMT-03:00) Greenland', value: -3},
  {name: '(GMT-03:00) Montevideo', value: -3},
  {name: '(GMT-02:00) Mid-Atlantic', value: -2},
  {name: '(GMT-01:00) Azores', value: -1},
  {name: '(GMT-01:00) Cape Verde Is.', value: -1},
  {name: '(GMT+00:00) Edinburgh', value: 0},
  {name: '(GMT+00:00) Europe/London', value: 0},
  {name: '(GMT+00:00) Lisbon', value: 0},
  {name: '(GMT+00:00) London', value: 0},
  {name: '(GMT+00:00) Monrovia', value: 0},
  {name: '(GMT+00:00) UTC', value: 0},
  {name: '(GMT+01:00) Amsterdam', value: 1},
  {name: '(GMT+01:00) Belgrade', value: 1},
  {name: '(GMT+01:00) Berlin', value: 1},
  {name: '(GMT+01:00) Bern', value: 1},
  {name: '(GMT+01:00) Bratislava', value: 1},
  {name: '(GMT+01:00) Brussels', value: 1},
  {name: '(GMT+01:00) Budapest', value: 1},
  {name: '(GMT+01:00) Casablanca', value: 1},
  {name: '(GMT+01:00) Copenhagen', value: 1},
  {name: '(GMT+01:00) Dublin', value: 1},
  {name: '(GMT+01:00) Ljubljana', value: 1},
  {name: '(GMT+01:00) Madrid', value: 1},
  {name: '(GMT+01:00) Paris', value: 1},
  {name: '(GMT+01:00) Prague', value: 1},
  {name: '(GMT+01:00) Rome', value: 1},
  {name: '(GMT+01:00) Sarajevo', value: 1},
  {name: '(GMT+01:00) Skopje', value: 1},
  {name: '(GMT+01:00) Stockholm', value: 1},
  {name: '(GMT+01:00) Vienna', value: 1},
  {name: '(GMT+01:00) Warsaw', value: 1},
  {name: '(GMT+01:00) West Central Africa', value: 1},
  {name: '(GMT+01:00) Zagreb', value: 1},
  {name: '(GMT+02:00) Athens', value: 2},
  {name: '(GMT+02:00) Bucharest', value: 2},
  {name: '(GMT+02:00) Cairo', value: 2},
  {name: '(GMT+02:00) Europe/Bucharest', value: 2},
  {name: '(GMT+02:00) Europe/Helsinki', value: 2},
  {name: '(GMT+02:00) Harare', value: 2},
  {name: '(GMT+02:00) Helsinki', value: 2},
  {name: '(GMT+02:00) Jerusalem', value: 2},
  {name: '(GMT+02:00) Kaliningrad', value: 2},
  {name: '(GMT+02:00) Kyiv', value: 2},
  {name: '(GMT+02:00) Pretoria', value: 2},
  {name: '(GMT+02:00) Riga', value: 2},
  {name: '(GMT+02:00) Sofia', value: 2},
  {name: '(GMT+02:00) Tallinn', value: 2},
  {name: '(GMT+02:00) Vilnius', value: 2},
  {name: '(GMT+03:00) Baghdad', value: 3},
  {name: '(GMT+03:00) Istanbul', value: 3},
  {name: '(GMT+03:00) Kuwait', value: 3},
  {name: '(GMT+03:00) Minsk', value: 3},
  {name: '(GMT+03:00) Moscow', value: 3},
  {name: '(GMT+03:00) Nairobi', value: 3},
  {name: '(GMT+03:00) Riyadh', value: 3},
  {name: '(GMT+03:00) St. Petersburg', value: 3},
  {name: '(GMT+03:30) Tehran', value: 3.5},
  {name: '(GMT+04:00) Abu Dhabi', value: 4},
  {name: '(GMT+04:00) Baku', value: 4},
  {name: '(GMT+04:00) Muscat', value: 4},
  {name: '(GMT+04:00) Samara', value: 4},
  {name: '(GMT+04:00) Tbilisi', value: 4},
  {name: '(GMT+04:00) Volgograd', value: 4},
  {name: '(GMT+04:00) Yerevan', value: 4},
  {name: '(GMT+04:30) Kabul', value: 4.5},
  {name: '(GMT+05:00) Ekaterinburg', value: 5},
  {name: '(GMT+05:00) Islamabad', value: 5},
  {name: '(GMT+05:00) Karachi', value: 5},
  {name: '(GMT+05:00) Tashkent', value: 5},
  {name: '(GMT+05:30) Chennai', value: 5.5},
  {name: '(GMT+05:30) Kolkata', value: 5.5},
  {name: '(GMT+05:30) Mumbai', value: 5.5},
  {name: '(GMT+05:30) New Delhi', value: 5.5},
  {name: '(GMT+05:30) Sri Jayawardenepura', value: 5.5},
  {name: '(GMT+05:45) Kathmandu', value: 5.75},
  {name: '(GMT+06:00) Almaty', value: 6},
  {name: '(GMT+06:00) Astana', value: 6},
  {name: '(GMT+06:00) Dhaka', value: 6},
  {name: '(GMT+06:00) Urumqi', value: 6},
  {name: '(GMT+06:30) Rangoon', value: 6.5},
  {name: '(GMT+07:00) Bangkok', value: 7},
  {name: '(GMT+07:00) Hanoi', value: 7},
  {name: '(GMT+07:00) Jakarta', value: 7},
  {name: '(GMT+07:00) Krasnoyarsk', value: 7},
  {name: '(GMT+07:00) Novosibirsk', value: 7},
  {name: '(GMT+08:00) Beijing', value: 8},
  {name: '(GMT+08:00) Chongqing', value: 8},
  {name: '(GMT+08:00) Hong Kong', value: 8},
  {name: '(GMT+08:00) Irkutsk', value: 8},
  {name: '(GMT+08:00) Kuala Lumpur', value: 8},
  {name: '(GMT+08:00) Perth', value: 8},
  {name: '(GMT+08:00) Singapore', value: 8},
  {name: '(GMT+08:00) Taipei', value: 8},
  {name: '(GMT+08:00) Ulaanbaatar', value: 8},
  {name: '(GMT+09:00) Osaka', value: 9},
  {name: '(GMT+09:00) Sapporo', value: 9},
  {name: '(GMT+09:00) Seoul', value: 9},
  {name: '(GMT+09:00) Tokyo', value: 9},
  {name: '(GMT+09:00) Yakutsk', value: 9},
  {name: '(GMT+09:30) Adelaide', value: 9.5},
  {name: '(GMT+09:30) Darwin', value: 9.5},
  {name: '(GMT+10:00) Brisbane', value: 10},
  {name: '(GMT+10:00) Canberra', value: 10},
  {name: '(GMT+10:00) Guam', value: 10},
  {name: '(GMT+10:00) Hobart', value: 10},
  {name: '(GMT+10:00) Melbourne', value: 10},
  {name: '(GMT+10:00) Port Moresby', value: 10},
  {name: '(GMT+10:00) Sydney', value: 10},
  {name: '(GMT+10:00) Vladivostok', value: 10},
  {name: '(GMT+11:00) Magadan', value: 11},
  {name: '(GMT+11:00) New Caledonia', value: 11},
  {name: '(GMT+11:00) Solomon Is.', value: 11},
  {name: '(GMT+11:00) Srednekolymsk', value: 11},
  {name: '(GMT+12:00) Auckland', value: 12},
  {name: '(GMT+12:00) Fiji', value: 12},
  {name: '(GMT+12:00) Kamchatka', value: 12},
  {name: '(GMT+12:00) Marshall Is.', value: 12},
  {name: '(GMT+12:00) Wellington', value: 12},
  {name: '(GMT+12:45) Chatham Is.', value: 12.75},
  {name: '(GMT+13:00) Nuku\'alofa', value: 13},
  {name: '(GMT+13:00) Samoa', value: 13},
  {name: '(GMT+13:00) Tokelau Is.', value: 13},
]

export const DaysOfMonth = {
  '01': 31,
  '02': 38,
  '03': 31,
  '04': 30,
  '05': 31,
  '06': 30,
  '07': 31,
  '08': 31,
  '09': 30,
  '10': 31,
  '11': 30,
  '12': 31,
  1: 31,
  2: 38,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
}

@Pipe({name: 'ceilWithMinimum'})
export class CeilWithMinimumPipe implements PipeTransform {
  transform(value: number, minimum?: number): number {
    return (Math.ceil(value) < 1) ? minimum : Math.ceil(value);
  }
}

@Pipe({name: 'calcPeriodUniquePerc'})
export class CalcPeriodUniquePercPipe implements PipeTransform {
  transform(value: number, reference?: number): any {
    let percent = ((value / reference) * 100);
    return parseFloat(percent.toString()).toFixed(2);
  }
}

@Pipe({name: 'secondsToMinutes'})
export class SecondsToMinutesPipe implements PipeTransform {
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return minutes + ':' + (value - minutes * 60);
  }
}

export const getUserTimezone = (timezone: string) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZonesWithUtc = getTimeZones({ includeUtc: true });
  let localZone = timeZonesWithUtc.find( ({name}) => name === tz );
  if (timezone==null || timezone=="" || timezone=="-00:00")
    return localZone ? localZone.currentTimeOffsetInMinutes * -1  : new Date().getTimezoneOffset()

  if (timezone.length>=6) {
    // const prefix = timezone.substring(0, 1)
    // const hour = parseInt(timezone.substring(1,3))
    // const minute = parseInt(timezone.substring(4,6))
    // return (hour * 60 + minute) * (prefix=="-" ? 1 : -1)
    return localZone ? localZone.currentTimeOffsetInMinutes * -1  : new Date().getTimezoneOffset()
  } else {
    return Number(timezone)*60 * (-1)
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fixedTime'
})
export class FixedTimePipe implements PipeTransform {

  transform(value: string): any {
    if (value==null || value=="" || value=="NaN:NaN")
      return "0:00"

    if (value.includes(':')) {
      let min = parseInt(value.split(':')[0])
      let sec = parseInt(value.split(':')[1]);
      let fixedMin = null
      let fixedSec = null
      if (sec < 10) {
        fixedSec = "0" + sec;
      } else {
        fixedSec = sec
      }
      if (min < 10) {
        fixedMin = '0' + min;
      } else {
        fixedMin = min;
      }
      return fixedMin + ':' + fixedSec;
    }
  }

}

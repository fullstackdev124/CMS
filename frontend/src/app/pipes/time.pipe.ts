import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import moment from 'moment';

@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {

  transform(value: string): any {
    const date = new Date(value).getTime() - 3600000 * new Date().getTimezoneOffset() / 60;
    return moment(date).format('HH:mm:ss');
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fixed'
})
export class FixedPipe implements PipeTransform {
  transform(value: string): any {
    return value && value.substr(value.length - 10);
  }
}

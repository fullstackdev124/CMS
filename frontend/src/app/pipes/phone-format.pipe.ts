import { Pipe, PipeTransform } from '@angular/core';
import * as PhoneNumberLibrary from 'google-libphonenumber'

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {
  phoneUtil = PhoneNumberLibrary.PhoneNumberUtil.getInstance()

  transform(num: any) {
    if (num==null)
      return ""

    if (num.substring(0,1)=="+")
      num = num
    else if (num.length==10)
      num = "+1" + num
    else
      num = "+" + num

    try {
      const number = this.phoneUtil.parseAndKeepRawInput(num)
      if (!number || !this.phoneUtil.isValidNumber(number)) {
        return num
      }

      return this.phoneUtil.formatOutOfCountryCallingNumber(number)
    } catch (ex){}

    return num
  }

}

import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

const addressRegExp = /((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.) {3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(\D*\.[a-z]{3}))(:\d+)?$/

export const sipGatewayFormValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {


  const name = control.get("name")
  const nameValid = name != undefined && name.value != ''

  // const customerId = control.get("customerId")
  // const customerIdValid = customerId != undefined && customerId.value != ''
  //
  // const address = control.get("address")
  // const addressValid = addressRegExp.test(address.value)
  //
  // const port = control.get("port")
  // const portValid = 5060 <= parseInt(port.value) && parseInt(port.value) <= 65536
  //
  // const digitsStrip = control.get("digitsStrip")
  // const digitsStripValid = digitsStrip.value == null || digitsStrip.value == '' || (0 <= parseInt(digitsStrip.value) && parseInt(digitsStrip.value) <= 10)
  //
  // const description = control.get("description")
  // const descriptionValid = description != undefined && description.value != ''

  return {
    nameInvalid: !nameValid,
    // addressInvalid: !addressValid,
    // portInvalid: !portValid,
    // digitsStripInvalid: !digitsStripValid,
    // descriptionInvalid: !descriptionValid,
    // customerIdInvalid: !customerIdValid
  }
}

@Directive({
  selector: '[sipGatewayFormValidateDirective]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: SipGatewayFormValidateDirective,
    multi: true
  }]
})
export class SipGatewayFormValidateDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {

    return sipGatewayFormValidator(control)
  }
}

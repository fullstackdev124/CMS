import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

const sipUriRegExp = /^sip:([A-Za-z][A-Za-z0-9]*@)?((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.) {3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(\D*\.[a-z]{3}))(:\d+)?$/
const numberRegExp = /^1\d{10}$/
export const actionFormValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {


  const sipUri = control.get("sipUri")
  const sipUriValid = sipUri.value != undefined && sipUri.value != null

  const remapNumber = control.get("remapNumber")
  const remapNumberValid = numberRegExp.test(remapNumber.value)



  return { sipUriInvalid: !sipUriValid, remapNumberInvalid: !remapNumberValid }
}

@Directive({
  selector: '[actionFormValidateDirective]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: ActionFormValidateDirective,
    multi: true
  }]
})
export class ActionFormValidateDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {

    return actionFormValidator(control)
  }
}

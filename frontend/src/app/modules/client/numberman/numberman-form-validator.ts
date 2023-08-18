import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

export const NumberManFormValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {


  const name = control.get("name")
  const nameValid = name != undefined && name.value != ''

  return {
    nameInvalid: !nameValid,
  }
}

@Directive({
  selector: '[NumberManFormValidateDirective]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: NumberManFormValidateDirective,
    multi: true
  }]
})

export class NumberManFormValidateDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {

    return NumberManFormValidator(control)
  }
}

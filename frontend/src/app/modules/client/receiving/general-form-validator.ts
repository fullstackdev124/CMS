import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

const numberRegExp = /^1?\d{10}$/

export const generalFormValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const number = control.get("number")


  if (!numberRegExp.test(number.value)) {
    console.log("failed to test number reg")
    return { numberInvalid: true }
  }
  return null
};

@Directive({
  selector: '[generalFormValidateDirective]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: GeneralFormValidateDirective,
    multi: true
  }]
})
export class GeneralFormValidateDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {

    return generalFormValidator(control)
  }
}

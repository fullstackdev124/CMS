import { FormGroup } from '@angular/forms';

export function ConfirmedValidator(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];
    if (matchingControl.errors && !matchingControl.errors.confirmedValidator) {
      return;
    }
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ confirmedValidator: true });
    } else {
      matchingControl.setErrors(null);
    }
  }
}

export function validateExpiry(controlName: string) {

  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    let ch = false;
    // ensure basic format is correct
    if (control.value.match(/^(0\d|1[0-2])\/\d{2}$/)) {
      const {0: month, 1: year} = control.value.split("/");

      // get midnight of first day of the next month
      let yd = parseInt("20"+year);
      let md = parseInt(month);
      const expiry = new Date(yd, md);
      const current = new Date();

      ch = expiry.getTime() > current.getTime();

    }
    if (!ch) {
      control.setErrors({ validateExpiry: true });
    } else {
      control.setErrors(null);
    }
  }
}

import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "primeng/api";
import {luhnValidator} from "@app/helper/luhn.validators";
import {getValidationConfigFromCardNo} from "@app/helper/card.helper";
import Countries from "../../../../../assets/data/countries.json";
import {
  CMSUserType,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_DENY
} from "@app/modules/client/constant";
import {ApiService} from "@services/api/api.service";
import {StripeCardComponent, StripeCardNumberComponent, StripeService} from "ngx-stripe";
import {StoreService} from "@services/store/store.service";
import {Location} from "@angular/common";
import {StripeCardElementOptions} from "@stripe/stripe-js";
import {ActivatedRoute, Router} from "@angular/router";
import {LayoutService} from "@services/app.layout.service";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-billing-payment-add',
  templateUrl: './billing-payment-add.component.html',
  styleUrls: ['./billing-payment-add.component.scss']
})
export class BillingPaymentAddComponent implements OnInit {

  @ViewChild(StripeCardComponent, { static: false}) card: StripeCardComponent;
  cardOptions: StripeCardElementOptions

  elementsOptions = {
    locale: 'en'
  };
  cardForm: FormGroup;
  cardErrorMessage = ''

  countries : any[]
  selectedCountry : any

  userId: number = 0;
  customerId: number = 0;
  user: any = {};
  balance = 0
  permission = PERMISSION_TYPE_ALL;
  permissionTypeDeny = PERMISSION_TYPE_DENY;

  resTokenId = ''

  blockContent = false
  goingFrom = -1

  constructor(public api: ApiService,
              private messageService: MessageService,
              private stripeService: StripeService,
              public store: StoreService,
              private fb: FormBuilder,
              private router: Router,
              public route: ActivatedRoute,
              private location: Location,
              private layoutService: LayoutService) {

    this.applyTheme()
    layoutService.configUpdate$.subscribe(config => {
      this.applyTheme()
    })
  }

  async ngOnInit()  {
    if (this.route.snapshot.queryParamMap.get('from')) {
      this.goingFrom = parseInt(this.route.snapshot.queryParamMap.get('from'));
    }

    this.cardForm = this.fb.group({
      'firstname': new FormControl('', Validators.required),
      'lastname': new FormControl('', Validators.required),
      'country': [null],
    });

    this.countries = Countries.map(item => ({"label": item.name, "value": item.code.toLowerCase()}))
    this.selectedCountry = { "label": "United States", "value": "us" }

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    this.initUser()
  }

  applyTheme() {
    if (this.layoutService.getConfig().colorScheme==='dark') {
      this.cardOptions = {
        style: {
          base: {
            lineHeight: '3rem',
            iconColor: '#fff',
            color: '#fff',
            '::placeholder': {
              color: '#7d8490',
            },
          },
        },
      };
    } else {
      this.cardOptions = {
        style: {
          base: {
            lineHeight: '3rem',
            iconColor: '#000',
            color: '#000',
            '::placeholder': {
              color: '#333',
            },
          },
        },
      };
    }
  }

  initUser() {
    let _user = this.store.getUser()
    if(_user) {
      this.userId = _user.id;
      this.customerId = _user.customerId;
    }

    if(this.userId) this.api.getUser(this.userId).subscribe(async res => {
      this.user = res;

      if(this.user.hasOwnProperty('Customer') && this.user.Customer.hasOwnProperty('balance'))
        this.balance = this.user.Customer['balance'];
      else
        this.balance = 0;

      /**************************** permission checking *************************/
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        const guiVisibility = this.store.getGuiVisibility();

        let permission = PERMISSION_TYPE_DENY;
        if(guiVisibility != null) for (let v of guiVisibility) {
          if (v.GuiSection.name === 'User') {
            permission = v.GuiPermission.name;
            break;
          }
        }

        if (permission !== PERMISSION_TYPE_ALL && this.store.getUser() && this.store.getUser().id !== this.user.id) {
          this.showWarning('You have no permission for this page')
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
            }, NoPermissionAlertInteral);
          });
          this.location.back();
        }

        // check if other customer user is trying to edit user or no primary user is trying to edit primary user
        // tslint:disable-next-line:max-line-length
        if (this.store.getUser().customerId != this.user.customerId || (this.store.getUserType() != CMSUserType.primaryAdmin && this.user.primaryAdmin)) {
          this.showWarning("You have no permission for this user")
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, NoPermissionAlertInteral)
          })
          this.location.back()
        }

        this.permission = permission
      }
    });

    // subscribe for balance update
    this.store.getBalance().subscribe((value: any) => {
      if(value)
        this.balance = value;
    })
  }

  cardMaskFunction(rawValue: string): Array<RegExp> {
    const card = getValidationConfigFromCardNo(rawValue);
    if (card) {
      return card.mask;
    }
    return [/\d/];
  }

  isFieldValid(field: string) {
    return !this.cardForm.get(field).valid && this.cardForm.get(field).touched;
  }

  validateAllFormFields(formGroup: FormGroup) {         //{1}
    Object.keys(formGroup.controls).forEach(field => {  //{2}
      const control = formGroup.get(field);             //{3}
      if (control instanceof FormControl) {             //{4}
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {        //{5}
        this.validateAllFormFields(control);            //{6}
      }
    });
  }

  acceptOnlyNumber(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onCardChange(event) {
    if (event.error) {
      this.cardErrorMessage = event.error.message
    } else {
      this.cardErrorMessage = ''
    }
  }

  onSubmit(value) {
    if (this.cardForm.invalid) {
      this.validateAllFormFields(this.cardForm)
      return
    }

    this.blockContent = true
    this.stripeService
      .createToken(this.card.element, { name: value.firstname + ' ' + value.lastname })
      .subscribe((result) => {
        if (result.token) {
          // Use the token
          this.resTokenId = result.token.id;

          this.addCreditCard(value)
        } else if (result.error) {
          this.blockContent = false
          // Error creating the token
          this.resTokenId = '';
          this.showWarning("Sorry we cannot validate your card, please check card data and try again.")
        }
      }, error => {
        this.blockContent = false
        this.showWarning("Sorry we cannot validate your card, please check card data and try again.")
      }, () => {
      });
  }

  addCreditCard(value) {
    let paymentMethodsData = {
      payment:{
        currency: this.user.Customer.currency,
        cvv: '1111',
        description: "credit card for " + value.firstname,
        expDate: '11/11',
        name: value.firstname + ' ' + value.lastname,
        number: '1111111111111111',
        type: "card",
        token: this.resTokenId,
        customerId: this.customerId
      },
      customer:this.user.Customer
    }

    this.api.postPaymentMethods(paymentMethodsData).subscribe(res => {
      this.blockContent = false
      if (res) {
        this.showSuccess("Payment method saved successfully");

        setTimeout(() => {
          this.router.navigate([RoutePath.billing.settings], { queryParams: { from: this.goingFrom } });
        }, 300);
      } else {
        this.showWarning("Sorry we cannot save your payment method, please check data and try again.")
      }

    }, error => {
      this.blockContent = false
      this.showWarning("Sorry we cannot save your payment method, please check data and try again.")
    }, () => {
      this.blockContent = false
    })
  }

  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  };

}

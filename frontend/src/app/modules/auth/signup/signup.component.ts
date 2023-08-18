import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService} from '@services/api/api.service';
import { StoreService} from '@app/services/store/store.service';
import Stepper from 'bs-stepper';
// @ts-ignore
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ConfirmedValidator } from './confirmed.validator';

// @ts-ignore
import Countries from '../../../../assets/data/countries.json';

import { StripeService, StripeCardNumberComponent, StripePaymentElementComponent } from 'ngx-stripe';
import {
  StripeCardElementOptions,
} from '@stripe/stripe-js';
import {MenuItem, MessageService, SelectItem} from "primeng/api";
import { Router} from "@angular/router";
import {EnvironmentLoaderService} from "@services/environment-loader.service";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

export class SignupComponent implements OnInit {

  @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#7d8490',
        color: '#7d8490',
        '::placeholder': {
          color: '#7d8490',
        },
      },
    },
  };

  elementsOptions: any = {
    locale: 'en',
  };

  emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  name = 'Registration';
  private stepper: Stepper;
  private stepperEl: HTMLElement;
  prices = [
    {label: "$35", value:35},
    {label: "$45", value:45},
    {label: "$55", value:55},
    {label: "$65", value:65},
    {label: "$75", value:75},
    {label: "$85", value:85},
    {label: "$95", value:95},
    {label: "$105", value:105},
    {label: "$115", value:115},
    {label: "$125", value:125},
    {label: "$135", value:135},
    {label: "$145", value:145},
    {label: "$155", value:155},
    {label: "$165", value:165},
  ];
  selectedPrice = {label: "$35", value:35}
  balance: string = "35";

  products = [{ label:"() - 0", value: {id:0,name:"", description:"-",price:0}}];
  selectedProduct : any

  description = "* Sign up today and pay no monthly plan fee for 60 days. Promotional pricing applies to the monthly subscription fee only (excludes usage costs or service packages). Upon signing up, new accounts will only be charged the Starting Available Balance fee to fund usage (such as minutes and tracking numbers). The monthly subscription will be charged 60 days from signup date and will renew thereafter every 30 days. You may cancel your account at any time. Offer ends December 31, 2021.";
  businessIndustries = [
    {label:'Agriculture', value:'Agriculture'},
    {label:'Automotive', value:'Automotive'},
    {label:'Banking', value:'Banking'},
    {label:'Consumer', value:'Consumer'},
    {label:'Education', value:'Education'},
  ];
  emailForm: FormGroup;
  codeForm: FormGroup;
  profileForm: FormGroup;
  checkoutForm: FormGroup;
  submitted = false;
  countries = Countries;
  notTest = true;
  stepComplete = 0
  resTokenId = null

  loading: boolean = false;
  stepIndex: number = 0;

  stepItems: MenuItem[];

  plan_sel = '-'
  isPaymentSucceed = false

  constructor(
    private router: Router,
    private api: ApiService,
    private store: StoreService,
    public messageService: MessageService,
    private formBuilder:FormBuilder,
    private stripeService: StripeService
  ) {
  }

  ngOnInit() {
    this.stepItems = [
      // { label: 'Verify Email', routerLink: 'verify-email' },
      // { label: 'Confirm Email', routerLink: 'confirm-email' },
      // { label: 'Profile', routerLink: 'profile' },
      // { label: 'Checkout', routerLink: 'checkout' },
      { label: 'Verify Email' },
      { label: 'Confirm Email' },
      { label: 'Profile' },
      { label: 'Checkout' },
    ]

    this.emailForm = this.formBuilder.group({
      email: [this.defValue.email, [Validators.required, Validators.email]],
      username: [this.defValue.username, [Validators.required]]
    });

    this.codeForm = this.formBuilder.group({
      code: [this.defValue.code, Validators.required]
    });

    this.profileForm = this.formBuilder.group({
      firstName: [this.defValue.firstName, Validators.required],
      lastName: [this.defValue.lastName, Validators.required],
      password: [this.defValue.password, Validators.required],
      confirm_password: [this.defValue.confirm_password, Validators.required],
      business_name: [this.defValue.business_name, Validators.required],
      business_number: [this.defValue.business_number],
      business_website: [this.defValue.business_website],
      business_address: [this.defValue.business_address],
      business_industry: [this.defValue.business_industry]
    }, {
      validator: ConfirmedValidator('password', 'confirm_password')
    });

    this.checkoutForm = this.formBuilder.group({
      card_name: [this.defValue.card_name, Validators.required],
      amount: [(parseInt(this.balance) * 100).toString(), Validators.required],
      // zip_code: [this.defValue.zip_code, Validators.required],
      // country: [this.defValue.country, Validators.required],
    })

    this.getProducts()
  }

  canGoNext(toIndex, ignoreStep = false) {
    if (toIndex === 0) {
      this.submitted = true;
    }

    if (toIndex === 1) {
      this.submitted = true;
      if (this.stepComplete<1 && !ignoreStep) return false;
      if (this.emailForm.invalid) return false;
      let username = this.getEmailForm.username.value
      if (/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/.test(username)) {
      } else {
        this.showWarning("Please enter valid username")
        return false
      }
    }

    if (toIndex === 2) {
      this.submitted = true;
      if (this.stepComplete<2 && !ignoreStep) return false;
      if (this.codeForm.invalid) return false;
      if (this.emailForm.invalid) return false;
    }

    if (toIndex === 3) {
      this.submitted = true;
      if (this.profileForm.invalid) return false;
      if (this.codeForm.invalid) return false;
      if (this.emailForm.invalid) return false;
    }

    if (toIndex === 4) {
      this.submitted = true;
      if (this.checkoutForm.invalid) return false;
      if (this.profileForm.invalid) return false;
      if (this.codeForm.invalid) return false;
      if (this.emailForm.invalid) return false;
    }

    return true;
  }

  async next() {
    try {
      if(!this.canGoNext(this.stepIndex+1, true))return;

      // Request For Email
      if (this.stepIndex === 0) {
        await this.request_email(()=>{
          // this.stepper.to(0);
          this.stepIndex = 0;
        });
        this.submitted = false;
      }

      // Verify Email by Code
      if (this.stepIndex === 1) {
        await this.verify_email(()=>{
          // this.stepper.to(1);
          this.stepIndex = 1;
        });
        this.submitted = false;
      }

      // Prepare to Checkout
      if (this.stepIndex === 2) {
        // Retrieve Client Secret from Server
        this.api.getPaymentIntent(this.balance).subscribe(res => {
          this.elementsOptions.clientSecret = res.client_secret;
        }, error => {
          this.showWarning(error.message ? error.message : "Server comunication error, please try later!");
        })

        this.submitted = false;
      }

      // this.stepper.next();
      this.stepIndex++;

    } catch (e) {
    }
  }

  // convenience getter for easy access to form fields
  get defValue() {
    let ranUser = (new Date().getTime()) + "@ecm.ecm"
    return {
      username: this.notTest ? '' : '',
      email: this.notTest ? '' : ranUser,
      code: this.notTest ? '' : '',
      firstName: this.notTest ? '' : 'test',
      lastName: this.notTest ? '' : 'test',
      password: this.notTest ? '' : 'Admin1234?',
      confirm_password: this.notTest ? '' : 'Admin1234?',

      business_name: this.notTest ? '' : 'test',
      business_number: this.notTest ? '' : '100',
      business_website: this.notTest ? '' : 'test.ecm.ecm',
      business_address: this.notTest ? '' : 'st test',
      business_industry: this.notTest ? '' : 'Consumer',

      card_name: this.notTest ? '' : 'test card',
      card_number: this.notTest ? '' : '4242 4242 4242 4242',
      zip_code: this.notTest ? '' : '00100',
      country: this.notTest ? '' : 'IT',
      exp_date: this.notTest ? '' : '02/25',
      cvv: this.notTest ? '' : '123',
    }
  }

  get getEmailForm() { return this.emailForm.controls; }
  get getCodeForm() { return this.codeForm.controls; }
  get getProfileForm() { return this.profileForm.controls; }
  get getCheckoutForm() { return this.checkoutForm.controls; }

  get getRegisterObj() {
    let email = this.getEmailForm.email.value;
    let username = this.getEmailForm.username.value
    let code = this.getCodeForm.code.value;
    let profile = this.getProfileForm;
    let checkout = this.getCheckoutForm;
    let plan = this.selectedProduct ? this.selectedProduct.id : null;
    let resTokenId = this.resTokenId;

    let obj = {
      "email": email,
      "code": code,
      "username": username,
      "password": profile.password.value,
      "firstName": profile.firstName.value,
      "lastName": profile.lastName.value,
      "Customer": {
        "name": profile.business_name.value,
        "address": profile.business_address.value,
        "phone": profile.business_number.value,
        "website": profile.business_website.value,
        "industry": profile.business_industry.value
      },
      "Service": {
        "planId": plan,
        "starting_balance": this.balance
      },
      "Payment": {
        "cardName": checkout.card_name.value,
        "cardNo": "1111111111111111", //checkout.card_number.value,
        "cardExpDate": "11/11", //checkout.exp_date.value,
        "cardCvv": "111", //checkout.cvv.value,
        // "zipCode": checkout.zip_code.value,
        // "country": checkout.country.value,
        "token": resTokenId
      }
    };

    return obj;
  }

  onBalanceChange(event) {
    let selected_balance = event.value
    selected_balance = (selected_balance >= 35) ? selected_balance : 35;
    this.balance = selected_balance.toString();

    this.checkoutForm = this.formBuilder.group({
      card_name: [this.defValue.card_name, Validators.required],
      // amount: [(selected_balance * 100).toString(), Validators.required]
      // zip_code: [this.defValue.zip_code, Validators.required],
      // country: [this.defValue.country, Validators.required],
    })
  }

  selPriceProduct(event) {
    if(!this.products) return;
    this.plan_sel = '$'+this.selectedProduct.price
  }

  getProducts() {
    this.loading = true;
    this.api.getProductsReg().subscribe(res => {
      this.loading = false;
      if (res) {
        let products = [];
        res.forEach(product => {
          if(product.hasOwnProperty('ProductVariations')) {
            product.ProductVariations.forEach(variation => {
              const row = {
                label: product.name + " (" + variation.recur + ") - " + variation.currency + " " + variation.price,
                value: {
                  id: variation.id,
                  name: product.name,
                  price: variation.price,
                  recur: variation.recur,
                  currency: variation.currency,
                  description: product.description
                }
              };

              products.push(row);
            });
          } else {
          };
        });

        this.products = [ ... products ]
        setTimeout(() => {
          this.selectedProduct = products.length>0 ? products[0].value : null;
          this.plan_sel = '$'+ (this.selectedProduct!=null ? this.selectedProduct.price : 15)
        }, 100)
      }
      else{

      }

    }, error => {
      this.loading = false;
    })
  }

  async resendCode() {
    if(this.canGoNext(1)) {
        await this.request_email(()=>{
          // this.stepper.to(0);
          this.stepIndex = 0;
        });
        this.submitted = false;
    }
  }

  async request_email(reject) {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.api.request_email(this.getEmailForm.username.value, this.getEmailForm.email.value).subscribe(res => {
        this.loading = false
        if (res.verification_code) {
          this.stepComplete = 1
          this.showSuccess("We've just sent verification code to you. Please check your inbox");
          resolve(res);
        } else{
          this.showWarning(res.message ? res.message : "Failed to send email");
          reject();
        }

      }, error => {
        this.loading = false;
        reject(error);
      }, () => {
        this.loading = false
      })
    })
  }

  async verify_email(reject) {
    return new Promise(((resolve, reject) => {
      this.loading = true;
      this.api.verify_email(this.getEmailForm.email.value, this.getCodeForm.code.value).subscribe(res => {
        this.loading = false;
        if (res && res.message && res.message === 'success' && res.data ) {
          this.stepComplete = 2
          this.showSuccess("You email verified successfully");
          resolve(res)
        } else {
          this.showWarning(res.message ? res.message : "Sorry we cannot verify you email.")
          reject()
        }
      }, error => {
        this.loading = false;
        this.showWarning("Sorry we cannot verify you email.")
        reject(error)
      }, () => {
        this.loading = false;
      })
    }))
  }

  pay() {
    if (this.checkoutForm.valid) {
      if (this.isPaymentSucceed) {
        this.registerDo()
        return;
      }

      this.loading = true;
      this.stripeService.confirmPayment({
        elements: this.paymentElement.elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: this.checkoutForm.get('card_name').value,
              email: this.getEmailForm.email.value,
            },
          },
        },
        redirect: 'if_required',
      }).subscribe(result => {
        if (result.error) {
          this.loading = false
          this.showWarning(result.error.message);
        } else {
          // The payment has been processed!
          if (result.paymentIntent.status === 'succeeded') {
            // Register Card to backend
            this.resTokenId = result.paymentIntent.payment_method;

            this.isPaymentSucceed = true
            this.registerDo();
          } else {
            this.loading = false
          }
        }
      }, error => {
        this.loading = false
      });
    } else {
      this.showWarning("Please correctly fill the payment form");
    }
  }

  async registerDo() {
    return new Promise(((resolve, reject) => {
      this.loading = true;
      this.api.register(this.getRegisterObj).subscribe(res => {
        this.loading = false;
        this.resTokenId = 0;
        if (res.activated) {
          this.stepComplete = 3
          this.showSuccess("Congratulation! You have completed the registration.");
          // this.stepper.next();
          // $(this.stepperEl).addClass("endView");
          resolve(res)

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 300);
        } else {
          this.showWarning("Sorry we cannot send your registration, please check data and try again.")

          // this.stepper.to(3);
          this.stepIndex = 3;

          // $(this.stepperEl).removeClass("endView");
          reject()
        }
      }, error => {
        this.loading = false;
        this.resTokenId = 0;
        this.showWarning("Sorry we cannot send your registration, please check data and try again.")
        reject(error)
      }, () => {
        this.loading = false;
      })
    }))
  }

  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  };

}

import { ApiService } from "@services/api/api.service";
import { StoreService } from "@services/store/store.service";
import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from "primeng/api";

import {
  CMSUserType,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_DENY
} from "@app/modules/client/constant";

import { of } from "rxjs";
import moment from 'moment';
import { ActivatedRoute } from "@angular/router";
import { catchError, tap } from "rxjs/operators";
import { getUserTimezone } from "@app/helper/utils";
import { formatDate, Location } from "@angular/common";
import Countries from "../../../../../assets/data/countries.json";

import { StripeService, StripeCardNumberComponent, StripePaymentElementComponent } from 'ngx-stripe';

import {
  StripeCardElementOptions,
} from '@stripe/stripe-js';

@Component({
  selector: 'app-billing-settings',
  templateUrl: './billing-settings.component.html',
  providers: [ConfirmationService],
  styleUrls: ['./billing-settings.component.scss']
})

export class BillingSettingsComponent implements OnInit {

  isShowInformation = false
  isLoaded = false
  blockContent = false
  goingFrom = 0

  userId: number = 0;
  customerId: number = 0;
  user: any = {};
  balance = 0

  customer: any

  permission = PERMISSION_TYPE_ALL;
  permissionTypeDeny = PERMISSION_TYPE_DENY;

  isBillingPhoneNumber = false
  selectedBillingPhoneNumber = ''

  priceFalls = [];
  priceCharges = [];
  selectedPriceFall = { name: '$15.00', value: 15 }
  selectedPriceCharge = { name: '$35.00', value: 35 }

  countries : any[]
  selectedCountry : any

  paymentMethods = [];
  filteredPaymentMethod = []
  selectedPaymentMethod : any

  selectedAmount = 0

  editingPaymentMethod: any
  isEditPaymentMethod = false
  selectedPaymentCountry : any
  selectedPaymentName = ''

  filterPaymentHistoryValue = ''
  paymentHistory = []
  paymentHistory_pageIndex = 1
  paymentHistory_pageSize = 10;
  paymentHistory_resultsLength = -1

  filterAccountLogValue = ''
  accountLogs = []
  accountLog_pageIndex = 1
  accountLog_pageSize = 10;
  accountLog_resultsLength = -1

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

  userTimezoneOffset = 0

  isSuperAdmin = false

  subscriptions = []


  constructor(
    public api: ApiService,
    private messageService: MessageService,
    private stripeService: StripeService,
    private confirmationService: ConfirmationService,
    public store: StoreService,
    public route: ActivatedRoute,
    private location: Location,
  ) {
    this.init()
  }

  init() {
    this.countries = Countries.map(item => ({"label": item.name, "value": item.code.toLowerCase()}))
    this.selectedCountry = { "label": "United States", "value": "us" }
    this.selectedPaymentCountry = { "label": "United States", "value": "us" }

    for (let i=15; i<2000; i+=5) {
      this.priceFalls.push({ name: '$'+i+'.00', value: i })
    }

    let i = 35
    while (i<=50000) {
      this.priceCharges.push({ name: '$'+i+'.00', value: i })
      if (i<250)  i+=5
      else if (i<500) i+=10
      else if (i<1000)  i+=25
      else if (i<2000)  i+=100
      else if (i<10000) i+=250
      else i+=1000
    }
  }

  async ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('from')) {
      this.goingFrom = parseInt(this.route.snapshot.queryParamMap.get('from'));
    }

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

  initUser = async () => {
    let _user = this.store.getUser()
    if(_user) {
      this.userId = _user.id;
      this.customerId = _user.customerId;
    }

    this.isSuperAdmin = this.store.getUserType() === CMSUserType.superAdmin

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)

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
        this.isLoaded = true
      }
    });

    // subscribe for balance update
    this.store.getBalance().subscribe((value: any) => {
      if(value)
        this.balance = value;
    })

    this.api.getCustomer(this.customerId).subscribe(res => {
      this.customer = res;
      this.handleCustomerSettings();

      this.searchPaymentHistory()
      this.searchAccountLog()
    });

    this.getPaymentMethodsList()

    if (this.isSuperAdmin) {
      this.getSubscriptions()
    }
  }

  handleCustomerSettings() {
    if (this.customer.settings) {
      let settings = JSON.parse(this.customer.settings)

      if (settings.billingPhoneNumber != undefined) {
        this.selectedBillingPhoneNumber = settings.billingPhoneNumber;
      }

      if (settings.priceFalls != undefined) {
        this.selectedPriceFall = { name: '$'+settings.priceFalls+".00", value: settings.priceFalls };
      }

      if (settings.priceCharge != undefined) {
        this.selectedPriceCharge = { name: '$'+settings.priceCharge+'.00', value: settings.priceCharge} ;
      }
    } else {
    }
  }

  saveGeneral() {
    if (this.selectedBillingPhoneNumber=='')
      this.isBillingPhoneNumber = true

    let priceFall = this.selectedPriceFall.value
    let priceCharge = this.selectedPriceCharge.value

    console.log("general", this.selectedBillingPhoneNumber, priceFall, priceCharge)

    let settings = JSON.parse(this.customer.settings)

    // Initialize it if null
    settings = (settings == null) ? {} : settings;

    settings.billingPhoneNumber = this.selectedBillingPhoneNumber
    settings.priceFalls = priceFall
    settings.priceCharge = priceCharge

    // Save customer settings to store
    this.customer.settings = JSON.stringify(settings);

    this.blockContent = true
    this.api.updateCustomer(this.customer).subscribe(res => {
      this.blockContent = false
      this.customer = res;
      this.showSuccess('Succeeded!');
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });

  }

  filterPaymentMethod(event) {
    let filtered = []
    let query = event.query;

    for (let i=0; i<this.paymentMethods.length; i++) {
      let name = this.paymentMethods[i].description + ' for ' + this.paymentMethods[i].name
      if (name.indexOf(query)>=0)
        filtered.push({label: name, value: this.paymentMethods[i]})
    }

    this.filteredPaymentMethod = filtered
  }

  editPaymentMethod() {
    if (!this.selectedPaymentMethod || !this.selectedPaymentMethod.hasOwnProperty("value"))
      return

    this.editPaymentMethodList(this.selectedPaymentMethod.value.id)
  }

  editPaymentMethodList(id) {
    let method = this.paymentMethods.filter((item) => item.id==id)
    if (method==null || method.length==0) {
      return
    }

    let item = method[0]
    this.editingPaymentMethod = item
    this.selectedPaymentName = item.name
    this.isEditPaymentMethod = true
  }

  savePaymentMethod() {
    this.isEditPaymentMethod = false
  }

  getPaymentMethodsList() {
    return new Promise((resolve, reject) => {
      this.api.getPaymentMethods(this.customerId).subscribe(res => {
        if (res) {
          this.paymentMethods = res.map(item => ({...item, expireDate: moment(item.expDate).format('YYYY-M-D').toString()}));
          resolve(res)
        }
        else{
          reject()
        }
      }, error => {
        reject(error)
      })
    })
  }

  makePayment() {
    if (!this.selectedPaymentMethod || !this.selectedPaymentMethod.hasOwnProperty("value")) {
      this.showWarning("Please select payment method.")
      return;
    }

    if (this.selectedAmount<2.5) {
      this.showWarning("Please enter amount greater than $2.5.")
      return;
    }

    this.confirmDialog("You're charging your wallet. Would you like to continue?", "Charge Request", { action: 'charge' })
  }

  confirmDialog(content: string, title: string, payload: any) {
    this.confirmationService.confirm({
      message: content,
      header: 'Order Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        payload = JSON.parse(JSON.stringify(payload));
        if(payload.action == 'subscribe' || payload.action == 'unsubscribe') {
        } else if(payload.action == 'charge') {
          const pm: any = this.selectedPaymentMethod.value;
          if(pm.token != null && pm.token.trim().length > 0)
            this.chargeCustomer(this.selectedAmount, pm.token);
          else
            this.showWarning("Invalid payment method selected.")
        } else {
          this.showWarning("Request cancelled.")
        }
      },
      reject: () => {
        this.showWarning("Request cancelled.")
      },
      key: "overallDialog"
    });
  }

  chargeCustomer(amount, token) {
    let pr = new Promise((resolve, reject) => {
      this.blockContent = true

      this.api.chargeCustomer(amount, token).subscribe(p_method => {
        if (p_method) {
          // this.paymentMethods = p_method;
          p_method = Array(1).fill(p_method);
          this.api.getCustomerBalance().subscribe(balance => {
            this.blockContent = false
            if (balance) {
              this.store.setBalance(balance.balance);
              this.showSuccess("Wallet correctly charged");
            }
            resolve(p_method);
          }, error => {
            this.blockContent = false
            reject(error);
          }, () => {
            this.blockContent = false
          });
        } else {
          this.blockContent = false
          reject();
        }
      }, error => {
        this.blockContent = false
        reject(error)
      }, () => {
        this.blockContent = false
      })
    })
  }

  dateFormat(date, format = 'mediumDate') {
    return (!date || date.trim().length <= 0) ? "" : formatDate(date, format, 'EN_us');
  }

  exportAccountLog() {
    let data = this.accountLogs.map(item => ({
      'Date': this.getDateTimeStringOfUserTimezone(item.transactionDate),
      'Type': ( item.productId==3 ? 'Charge' : ( item.productId==4 ? 'Auto Charge' : ( item.productId==5 ? 'Number Charge' : (item.productId==6 ? 'Call Charge' : 'Manual Charge') ) ) ),
      'Amount': (item.amount>0 ? '$' + item.amount : '-$' + (item.amount*-1)) + ' ',
      'Description': item.description
    }))

    import("xlsx").then(xlsx => {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, "transactions");
    });
  }

  exportPaymentHistory() {
    let data = this.paymentHistory.map(item => ({
      'Date': this.getDateTimeStringOfUserTimezone(item.transactionDate),
      'Card Type': item.PaymentMethod ? item.PaymentMethod.description : "",
      'Amount': (item.amount>0 ? '$' + item.amount : '-$' + (item.amount*-1)) + ' ',
      'Description': item.description
    }))

    import("xlsx").then(xlsx => {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, "transactions");
    });
  }

  setPrimaryPaymentMethod() {
    this.blockContent = true
    this.api.setPrimaryPaymentMethod(this.editingPaymentMethod.id).subscribe(res => {
      this.blockContent = false
      if (res) {
        this.isEditPaymentMethod = false
        this.getPaymentMethodsList();
        this.showSuccess("Payment method successfully set as primary");
      }
      else{
        this.showWarning("Sorry we're unable to process you request, please try later.")
      }

    }, error => {
      this.blockContent = false
      this.showWarning("Sorry we're unable to process you request, please try later.")
    }, () => {
      this.blockContent = false
    })
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    import("file-saver").then(FileSaver => {
      let EXCEL_TYPE =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      let EXCEL_EXTENSION = ".xlsx";
      const data: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
      });
      FileSaver.saveAs(
        data,
        fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
      );
    });
  }

  getDateTimeStringOfUserTimezone(created) {
    if (!created)
      return ""

    return moment(created).utcOffset(-this.userTimezoneOffset).format('MMM DD, YYYY HH:mm:ss');
  }

  paymentHistory_onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.paymentHistory_resultsLength / this.paymentHistory_pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.paymentHistory_pageSize = pageRows
    this.paymentHistory_pageIndex = pageIndex;
    await this.searchPaymentHistory();
  }

  paymentHistory_paginate = (event) => {
    this.paymentHistory_onPageIndexChange(event.page+1, event.rows);
  }

  onSearchPaymentHistory = () => {
    this.paymentHistory_pageIndex = 1
    this.searchPaymentHistory()
  }

  searchPaymentHistory = async () => {
    try {
      let filterValue = this.filterPaymentHistoryValue.trim()//.replace(/\D/g, '').replace(/\(/g, '').replace(/\-/g, '').replace(/\)/g, '');

      await this.api.getPaymentHistoryCount(this.customer.id, filterValue)
        .pipe(tap((res: any) => {
          this.paymentHistory_resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getPaymentHistory(this.customer.id, this.paymentHistory_pageIndex, this.paymentHistory_pageSize, filterValue)
        .pipe(tap(res => {
          this.paymentHistory = res
        }), catchError((_) => {
          return of(0);
        })).toPromise()

    } catch (e) {
      console.log(e)
    }
  }

  onRefreshPaymentHistory() {
    this.searchPaymentHistory()
  }


  accountLog_onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.accountLog_resultsLength / this.accountLog_pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.accountLog_pageSize = pageRows
    this.accountLog_pageIndex = pageIndex;
    await this.searchAccountLog();
  }

  accountLog_paginate = (event) => {
    this.accountLog_onPageIndexChange(event.page+1, event.rows);
  }

  onSearchAccountLog = () => {
    this.accountLog_pageIndex = 1
    this.searchAccountLog()
  }

  searchAccountLog = async () => {
    try {
      let filterValue = this.filterAccountLogValue.trim()//.replace(/\D/g, '').replace(/\(/g, '').replace(/\-/g, '').replace(/\)/g, '');

      await this.api.getAccountLogsCount(this.customer.id, filterValue)
        .pipe(tap((res: any) => {
          this.accountLog_resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getAccountLogs(this.customer.id, this.accountLog_pageIndex, this.accountLog_pageSize, filterValue)
        .pipe(tap(res => {
          this.accountLogs = res
        }), catchError((_) => {
          return of(0);
        })).toPromise()

    } catch (e) {}
  }

  onRefreshAccountLog() {
    this.searchAccountLog()
  }

  getSubscriptions = () => {
    this.api.getSubscriptions().subscribe(res => {
      this.subscriptions = [...res]
    });
  }

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

}

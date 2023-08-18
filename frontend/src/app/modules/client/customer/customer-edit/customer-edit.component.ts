import {Component, OnInit, ViewChild} from '@angular/core';
import {formatDate, Location} from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ApiService } from '@services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ICustomer } from '@app/models/user';
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";
import moment from "moment";
import {Paginator} from "primeng/paginator";
import {catchError, tap} from "rxjs/operators";
import {of} from "rxjs";
import {getUserTimezone} from "@app/helper/utils";

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
  animations: [
  ]
})

export class CustomerEditComponent implements OnInit {

  cmsUserType = CMSUserType;

  currentSection = 'customer-detail';

  email = null;
  username = null;
  languages = [];
  customers = [];

  localdid: number = 2.00;
  localdid_fee: number = 0.00;
  tollfree: number = 3.00;
  tollfree_fee: number = 0.00;
  cost_per_minute: number = 0.0001;
  inbound_cost_per_minute: number = 0.0;
  outbound_cost_per_minute: number = 0.0;

  rateTypes = [
    { label: '60/60', value: '60/60' },
    { label: '6/6', value: '6/6' },
  ]
  selectedRateType = { label: '60/60', value: '60/60' }

  accountingType = [
    { label: 'Enabled', value: 1 },
    { label: 'Disabled', value: 0 },
  ]
  selectedAccountingType = { label: 'Disabled', value: 0 }
  isPostpaid = false;

  customer: ICustomer = {
    id: null,
    balance: null,
    enabled: null,
    firstName: null,
    lastName: null,
    contactEmail: null,
    companyName: null,
    companyId: null,
    vatNumber: null,
    billingEmail: null,
    address: null,
    city: null,
    state: null,
    country: null,
    zip: null,
    phone: null,
    token: null,
    settings: null,
    accounting_type: 0,
    isPostpaid: false,
  };

  blockContent = false

  isSuperAdmin = false;

  purchaseAmount: number = 15.0
  purchaseDescription = ""

  filterAccountLogValue = ''
  accountLogs = []
  accountLog_pageIndex = 1
  accountLog_pageSize = 10;
  accountLog_resultsLength = -1

  filterCallLogValue = ''
  callLogs = []
  callLog_pageIndex = 1
  callLog_pageSize = 10;
  callLog_resultsLength = -1


  refundConfirmationDialog = false
  refundAmount = 0.0
  refundTransaction = null

  filterPaymentMethodValue = ''
  paymentMethods: any[] = []
  filteredPaymentMethods: any[] = []

  depositDialog = false
  depositAmount = 0.0
  depositMethod = null

  paymentProducts = [
    { label: 'Manual', value: 0, description: '' },
    { label: 'Initial Charge', value: 35, description: 'initial charge' },
    { label: 'Take Down Charge', value: -5, description: 'take down charge for number' },
  ]
  selectedPaymentProduct = { label: 'Manual', value: 0 , description: ''}

  userTimezoneOffset = 0


  constructor(public api: ApiService,
              public store: StoreService,
              public messageService: MessageService,
              public router: ActivatedRoute,
              private routes: Router,
              public location: Location) { }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      this.showWarning('You have no permission for this page')
      await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); });
      this.location.back();
    } else {
      this.isSuperAdmin = true
    }

    /**************************** page started *************************/
    await this.api.getCustomer(this.router.snapshot.params.id).subscribe(res => {
      this.customer = res;
      this.isPostpaid = this.customer.isPostpaid

      this.handleCustomerSettings();

      this.searchCallLog()
      this.searchAccountLog()

      this.getPaymentMethodsList()
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      const guiVisibility = this.store.getGuiVisibility();

      let permission = PERMISSION_TYPE_DENY;
      for (const v of guiVisibility) {
        if (v.GuiSection.name === 'Customer') {
          permission = v.GuiPermission.name;
          break;
        }
      }

      if (permission !== PERMISSION_TYPE_ALL) {
        this.showWarning('You have no permission for this page')
        await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); });
        this.location.back();
      }
    }

    this.userTimezoneOffset = getUserTimezone(this.store.getUser().timezone)
  }

  scrollTo(section) {
    this.currentSection = section;
    const element = document.getElementById(section);
    element.scrollIntoView(true);
  }

  handleChange = (key: string, event: any) => {
    this.customer[key] = event.target.value;
  }

  checkValid = () => {
    if (this.customer.companyName == null || this.customer.companyName.trim().length < 1) {
      return 'Please input company name!';
    }

    if (this.customer.companyId != null && this.customer.companyId.trim().length < 1) {
      return 'Please input company ID!';
    }

    if (this.customer.billingEmail != null && (this.customer.billingEmail.trim().length > 2 && this.customer.billingEmail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) === null)) {
      return 'Please input a valid billing email!';
    }

    if (this.customer.contactEmail != null && (this.customer.contactEmail.trim().length < 3 || this.customer.contactEmail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) === null)) {
      return 'Please input billing email!';
    }

    /* Not really needed for having a valid customer
    if (this.customer.address.trim().length === 0) {
      return 'Please input address!';
    }
    if (this.customer.city.trim().length === 0) {
      return 'Please input city!';
    }
    if (this.customer.state.trim().length === 0) {
      return 'Please input state!';
    }
    if (this.customer.zip.trim().length === 0) {
      return 'Please input zip code!';
    }
    if (this.customer.phone.trim().length === 0) {
      return 'Please input phone number!';
    }
    if (this.customer.vatNumber.trim().length === 0) {
      return 'Please input vat number!';
    }

    const emailValidator = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if (this.customer.billingEmail.trim().length === 0) {
      return 'Please fill billing email address!';
    }
    if (!emailValidator.test(this.customer.billingEmail)) {
      return 'Please input a valid billing email address!';
    }
    if (this.customer.contactEmail.trim().length === 0) {
      return 'Please fill contact email address!';
    }
    if (!emailValidator.test(this.customer.contactEmail)) {
      return 'Please input a valid contact email address!';
    }
    */

    return 'valid';
  }

  /**
   * Handle Customer JSON Settings
   */
   handleCustomerSettings() {
     if (!this.customer.accounting_type)
       return

      this.selectedAccountingType = { label: this.customer.accounting_type==1 ? 'Enabled' : 'Disabled', value: this.customer.accounting_type }

    if (this.customer.accounting_type==1) {
      let settings = JSON.parse(this.customer.settings)

      if (settings.localdid != undefined) {
        this.localdid = settings.localdid;
      }

      if (settings.localdid_fee != undefined) {
        this.localdid_fee = settings.localdid_fee;
      }

      if (settings.tollfree != undefined) {
        this.tollfree = settings.tollfree;
      }

      if (settings.tollfree_fee != undefined) {
        this.tollfree_fee = settings.tollfree_fee;
      }

      if (settings.rate_type != undefined) {
        this.selectedRateType = { label: settings.rate_type, value: settings.rate_type }
      }

      if (settings.inbound_cost_per_minute != undefined) {
        this.inbound_cost_per_minute = settings.inbound_cost_per_minute
      }

      if (settings.outbound_cost_per_minute != undefined) {
        this.outbound_cost_per_minute = settings.outbound_cost_per_minute
      }

    } else {
      this.applySettings()
    }
  }

  /**
   * save ui settings into the session storage and update user information
   */
   applySettings = () => {
     if (this.isSuperAdmin) {
       this.customer.isPostpaid = this.isPostpaid
       this.customer.accounting_type = this.selectedAccountingType.value
       // Retrieve the settings from the session storage
       let settings = JSON.parse(this.customer.settings)

       // Initialize it if null
       settings = (settings == null) ? {} : settings;

       // settings.accounting_type = this.selectedAccountingType.value
       if ( this.customer.accounting_type==1) {
         settings.localdid = this.localdid
         settings.localdid_fee = this.localdid_fee
         settings.tollfree = this.tollfree
         settings.tollfree_fee = this.tollfree_fee
         settings.inbound_cost_per_minute = this.inbound_cost_per_minute
         settings.outbound_cost_per_minute = this.outbound_cost_per_minute
         settings.rate_type = this.selectedRateType.value
       } else {
       }

       // Save customer settings to store
       this.customer.settings = JSON.stringify(settings);
     }
  }

  onSaveDetail = () => {
    const checkResult = this.checkValid();
    if (checkResult !== 'valid') {
      this.showWarning(checkResult);
      return;
    }

    if (this.isSuperAdmin && this.selectedAccountingType.value==1) {
      if (this.inbound_cost_per_minute<=0 || this.outbound_cost_per_minute<=0) {
        this.showWarning("Inbound or Outbound cost cannot be zero.")
        return
      }
    }

      this.blockContent = true
    this.applySettings();
    this.api.updateCustomer(this.customer).subscribe(res => {
      this.blockContent = false
      this.customer = res;
      this.showSuccess('Customer update succeeded!');
      this.routes.navigateByUrl(RoutePath.customer.customers);
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  }

  onPurchase = () => {
     if (!this.isSuperAdmin)
       return

    if (this.purchaseAmount==null  || this.purchaseDescription=="") {
      this.showWarning("Please enter amount and description!")
      return
    }

    if (this.purchaseAmount<0 && this.customer.balance<Math.abs(this.purchaseAmount)) {
      this.showWarning("Please enter valid amount!")
      return
    }

    this.blockContent = true
    this.api.purchaseCustomer(this.customer, this.purchaseAmount, this.purchaseDescription).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Payment succeeded!');

      this.api.getCustomer(this.customer.id).subscribe(res => {
        this.customer = res;
        this.searchAccountLog()
      });

    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
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


  dateFormat(date, format = 'mediumDate') {
    return (!date || date.trim().length <= 0) ? "" : formatDate(date, format, 'EN_us');
  }

  exportExcel(type: string) {
    let data;
    if (type=="account log") {
      data = this.accountLogs.map(item => ({
        'Date': this.getDateTimeStringOfUserTimezone(item.transactionDate),
        'Type': ( item.productId==4 || ( (item.productId==3 || item.productId==7) && item.amount>0) ? 'Deposit' : ((item.productId==3 || item.productId==7) && item.amount<0 ? 'Refund' : (item.productId!=3 && item.productId!=4 && item.productId!=7 ? 'Payment' : '' ) ) ),
        'Amount': (item.amount>0 ? '$' + item.amount : '-$' + (item.amount*-1)) + ' ',
        'Description': item.description
      }))
    }
    if (type=="call log") {
      data = this.callLogs.map(item => ({
        'Date': this.getDateTimeStringOfUserTimezone(item.transactionDate),
        // 'Type': ( item.productId==4 || ( (item.productId==3 || item.productId==7) && item.amount>0) ? 'Deposit' : ((item.productId==3 || item.productId==7) && item.amount<0 ? 'Refund' : (item.productId!=3 && item.productId!=4 && item.productId!=7 ? 'Payment' : '' ) ) ),
        'Amount': (item.amount>0 ? '$' + item.amount : '-$' + (item.amount*-1)) + ' ',
        'Description': item.description
      }))
    }

    import("xlsx").then(xlsx => {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, type);
    });
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

  onStripeRefund(transaction) {
    if (!this.isSuperAdmin)
      return

    this.refundAmount = transaction.amount
    this.refundTransaction = transaction
    this.refundConfirmationDialog = true
  }

  onStripeInvoice = (transaction) => {
    this.blockContent = true
    this.api.invoiceTransaction(this.customer, transaction.id).subscribe(res => {
      this.blockContent = false
      this.refundConfirmationDialog = false

      this.showSuccess('Invoice was generated successfully!');

      this.api.getCustomer(this.customer.id).subscribe(res => {
        this.customer = res;
        this.searchAccountLog()
      });
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });

  }

  doStripeRefund() {
    if (this.refundAmount<=0) {
      this.showWarning("Please input amount to refund correctly. It cannot be below than zero.")
      return
    }

    if (this.refundAmount>this.refundTransaction.amount) {
      this.showWarning("Please input amount to refund correctly. It cannot be larger than transaction.")
      return
    }

    if (this.refundAmount>this.customer.balance) {
      this.showWarning("Please input amount to refund correctly. It cannot be larger than balance.")
      return
    }

    this.blockContent = true
    this.api.refundTransaction(this.customer, this.refundTransaction.id, this.refundAmount).subscribe(res => {
      this.blockContent = false
      this.refundConfirmationDialog = false

      this.showSuccess('Refund succeeded!');

      this.api.getCustomer(this.customer.id).subscribe(res => {
        this.customer = res;
        this.searchAccountLog()
      });
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  }

  getPaymentMethodsList() {
      this.api.getPaymentMethods(this.customer.id).subscribe(res => {
        if (res) {
          this.paymentMethods = res.map(item => ({...item, expireDate: moment(item.expDate).format('YYYY-M-D').toString()}));
          this.filteredPaymentMethods = [...this.paymentMethods]
        }
        else{
        }
      }, error => {
      })
  }

  filterPaymentMethod() {
    let filterValue = this.filterPaymentMethodValue.trim().toLowerCase()
    if (filterValue=="")
      this.filteredPaymentMethods = [ ... this.paymentMethods ]
    else {
      let filtered = []
      this.paymentMethods.forEach((item) => {
        if ((item.name!=null && item.name.toLowerCase().includes(filterValue)) || (item.description!=null && item.description.toLowerCase().includes(filterValue)))
          filtered.push(item)
      })

      this.filteredPaymentMethods = [ ...filtered ]
    }
  }

  onDeposit(method) {
    if (!this.isSuperAdmin)
      return

    this.depositMethod = method
    this.depositDialog = true
  }

  doStripeDeposit() {
    if (this.depositAmount<=0) {
      this.showWarning("Please input amount to refund correctly. It cannot be below than zero.")
      return
    }

    this.blockContent = true
    this.api.chargeCustomerByAdmin(this.depositAmount, this.depositMethod.token, this.customer.id).subscribe(res => {
      this.blockContent = false
      this.depositDialog = false

      this.showSuccess('Deposit succeeded!');

      this.api.getCustomer(this.customer.id).subscribe(res => {
        this.customer = res;
        this.onSearchAccountLog()
      });
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  }

  getDateTimeStringOfUserTimezone(created) {
    if (!created)
      return ""

    return moment(created).utcOffset(-this.userTimezoneOffset).format('MMM DD, YYYY HH:mm:ss');
  }

  callLog_onPageIndexChange = async (pageIndex, pageRows) => {
    const totalPageCount = Math.ceil(this.callLog_resultsLength / this.callLog_pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    // if (pageIndex === this.pageIndex && this.pageSize==pageRows) {return;}
    this.callLog_pageSize = pageRows
    this.callLog_pageIndex = pageIndex;
    await this.searchCallLog();
  }

  callLog_paginate = (event) => {
    this.callLog_onPageIndexChange(event.page+1, event.rows);
  }

  onSearchCallLog = () => {
    this.callLog_pageIndex = 1
    this.searchCallLog()
  }

  searchCallLog = async () => {
    try {
      let filterValue = this.filterCallLogValue.trim()//.replace(/\D/g, '').replace(/\(/g, '').replace(/\-/g, '').replace(/\)/g, '');

      await this.api.getCallLogsCount(this.customer.id, filterValue)
        .pipe(tap((res: any) => {
          this.callLog_resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getCallLogs(this.customer.id, this.callLog_pageIndex, this.callLog_pageSize, filterValue)
        .pipe(tap(res => {
          this.callLogs = res
        }), catchError((_) => {
          return of(0);
        })).toPromise()

    } catch (e) {}
  }

  onRefreshCallLog() {
    this.searchCallLog()
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

      await this.api.getTransactionsCount(this.customer.id, filterValue)
        .pipe(tap((res: any) => {
          this.accountLog_resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      await this.api.getTransactions(this.customer.id, this.accountLog_pageIndex, this.accountLog_pageSize, filterValue)
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

  onPaymentProductChange(event) {
    console.log(this.selectedPaymentProduct)
    if (this.selectedPaymentProduct.value==0) {
    } else {
      this.purchaseAmount = this.selectedPaymentProduct.value
    }

    this.purchaseDescription = this.selectedPaymentProduct.description
  }

}

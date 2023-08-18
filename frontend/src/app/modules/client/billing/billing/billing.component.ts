import { Component, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { Location,formatDate } from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ApiService } from '@services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { StoreService } from '@services/store/store.service';
import {ConfirmationService, MessageService} from 'primeng/api';

// @ts-ignore
import Countries from '../../../../../assets/data/countries.json';

import { StripeService, StripeCardNumberComponent } from 'ngx-stripe';
import {
  StripeCardElementOptions,
} from '@stripe/stripe-js';

// tslint:disable-next-line:max-line-length
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  GUI_VISIBILITY_MATCH,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  providers: [ConfirmationService],
  animations: [
  ]
})

export class BillingComponent implements OnInit {

  @Output('balance')
  balance: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild(StripeCardNumberComponent) card: StripeCardNumberComponent;
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

  elementsOptions = {
    locale: 'es',
  };

  isLoading = false;
  pageLoadingAnimation = '';
  userId: number = 0;
  customerId: number = 0;
  permission = PERMISSION_TYPE_ALL;
  permissionTypeDeny = PERMISSION_TYPE_DENY;
  countries = Countries;
  languages = [];
  customers = [];
  user: any = {};
  // isEditing = false;
  curEditingId = -1;
  isEditingNewProduct = false

  // product/subscription vars
  submitted = false
  priceDiscounts = []
  selectedPriceDiscount : any

  productForms = {}
  productVarForms = {}
  products = []
  pageIndex = 1
  filterName = ""
  filterValue = ""

  defVars = {
    id:0,
    maxQuantity:1,
    price:"0",
    recur:"month",
    currency:"USD"
  }
  groups = [
    {label:'plan', value:'plan'},
    {label:'addon', value:'addon'},
  ];
  selectedGroup : any

  recurs = [
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'Day', value: 'day' }
  ]
  selectedRecur : any

  defProd = {
    id:0,
    name:"",
    description:"",
    sku:"ecms-plan-",
    group:"plans",
    token:"-",
    ProductVariations:[this.defVars]
  }

  resTokenId = null;
  card_name: string = "";
  checkoutForm = {};

  selectedPaymentMethod: any = "";
  selectedProduct: any = {};
  chargeAmount: number = 3;
  paymentMethods = [];

  displayResponsive: boolean = false;
  transactions = [];

  blockContent = false

  constructor(public api: ApiService, private confirmationService: ConfirmationService, public router: ActivatedRoute, private location: Location, private formBuilder:FormBuilder, private messageService: MessageService, private stripeService: StripeService, public store: StoreService) {}

  async ngOnInit() {
    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    this.initUser(true)
    this.api.getLanguages().subscribe(languages => {
      this.languages = languages;
    });

    this.getPaymentMethodsList();
  }

  initUser(compl = false) {

    if(this.router.snapshot.params.id)this.userId = this.router.snapshot.params.id

    if((!this.userId || this.userId <= 0) && !this.router.snapshot.params.id ) {
      let _user = this.store.getUser()
      if(_user) {
        this.userId = _user.id;
        this.customerId = _user.customerId;
      }
    }

    if(this.userId) this.api.getUser(this.userId).subscribe(async res => {
      this.user = res;
      this.onInitProducts();

      if(!compl) return;

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
  }

  get isAdmin() {
    //return false;
    return (this.user && this.user.id==1)
  }

  // product/subscription manager

  onInitProducts() {
    if(this.isAdmin)this.getPriceDiscounts();
    this.getProductsList({});
  }

  setFormsGroup() {
    this.productForms = {};
    for(let i = 0; i<this.products.length; i++) {
      let _id = ""+this.products[i].id;
      this.productForms[_id] = this.getFormBuild(this.products[i])
      if (this.products[i]["ProductVariations"]) {
        for(let iv = 0; iv<this.products[i]["ProductVariations"].length; iv++) {
          let _idv = ""+this.products[i]["ProductVariations"][iv].id;
          this.productVarForms[_idv] = this.getFormBuildVar(this.products[i]["ProductVariations"][iv])
        }
      }
    }
    // $('.productsList input').trigger("change")
  }

  getFormBuild(prod) {
    return this.formBuilder.group({
      name:[prod.name, Validators.required],
      description:[prod.description, Validators.required],
      sku:[prod.sku, Validators.required],
      group:[prod.group],
      discountId:[prod.discountId]
    });
  }

  getFormBuildVar(vars) {
    return this.formBuilder.group({
      currency:[vars.currency, Validators.required],
      price:[vars.price, Validators.required],
      maxQuantity:[vars.maxQuantity, Validators.required],
      recur:[vars.recur, Validators.required]
    });
  }

  getPriceDiscounts() {
    return new Promise((resolve, reject) => {
      this.api.getPriceDiscounts().subscribe(res => {
        if (res) {
          this.priceDiscounts = res;
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

  getProductsList(filter) {
    return new Promise((resolve, reject) => {
      this.api.getProducts(filter).subscribe(res => {
        if (res) {
          this.products = res;
          if(this.isAdmin) {
            this.products.push( JSON.parse(JSON.stringify(this.defProd)) );
            this.setFormsGroup()
          }
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

  /**
   * this is called at changing search value
  */
  onChangeFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterName = (event.target as HTMLInputElement).name;
    this.filterValue = (event.target as HTMLInputElement).value;
    this.onClickFilter();
  }

  onClearFilter = () => {
    this.filterValue = '';
    this.onClickFilter();
  }

  /**
   * this is called at pressing enter key in the search input or clicking the search button
   * @returns
   */
  onClickFilter = () => {
    this.getProductsList(this.filterValue.length ? {where:{description:this.filterValue}} : {});
  }

  getProductForms(id) {
    return this.productForms[id] ? this.productForms[id] : null;
  }

  getProductFormsVars(var_id) {
    return this.productVarForms[var_id] ? this.productVarForms[var_id] : null;
  }

  getProductFormsVarsFromProd(id) {
    let formVars = {}
    let formVarsNew = {}
    let hasIs = false
    for(let i = 0; i<this.products.length; i++) {
      let _id = ""+this.products[i].id;
      if(id == this.products[i].id) {
        this.productForms[_id] = this.getFormBuild(this.products[i])

        for(let iv = 0; iv<this.products[i].ProductVariations.length; iv++) {
          let _idv = ""+this.products[i].ProductVariations[iv].id;
          formVars[_idv] = this.productVarForms[_idv];
        }
        hasIs = true
      }
      if(this.products[i].id == 0) {
        this.productForms[_id] = this.getFormBuild(this.products[i])

        for(let iv = 0; iv<this.products[i].ProductVariations.length; iv++) {
          let _idv = ""+this.products[i].ProductVariations[iv].id;
          formVarsNew[_idv] = this.productVarForms[_idv];
        }
      }
    }
    return hasIs ? formVars : formVarsNew;
  }

  hasFieldError(id, key) {
    return (this.submitted && this.getProductForms(id).controls[key].errors && this.getProductForms(id).controls[key].errors.required);
  }

  hasFieldErrorVar(id, key) {
    return (this.submitted && this.getProductFormsVars(id).controls[key].errors && this.getProductFormsVars(id).controls[key].errors.required);
  }

  manageRowProduct(prod, id) {
    // let qt = parseInt("" + $('#prodVar_qt_'+id).val());
    // if(!qt || qt<=0)qt=1
    let qt = 1
    let isSub = this.hasProductSubscription(id)
    let oldOpts = this.getProductSubscriptionInOption(prod, id)
    if(!isSub && oldOpts) {
      this.switchSubscribe(oldOpts, id, this.user.Customer.id, qt)
    } else if(isSub && (!oldOpts || oldOpts == false)) {
      this.switchSubscribe(id, false, this.user.Customer.id, qt)
    } else if(isSub) {
      this.switchSubscribe(oldOpts, false, this.user.Customer.id, qt)
    } else {
      this.switchSubscribe(false, id, this.user.Customer.id, qt)
    }
  }

  switchSubscribe(oldid, id, customer, qt) {
    if(oldid) {
      let subDataOld = { customer_id:customer, product_id:oldid }
      let pr = new Promise((resolve, reject) => {
        this.api.subscribeProductUpd(false, subDataOld).subscribe(res => {
          if (res) {
            this.showSuccess("Service correctly unsubscribed.");
            this.initUser();
            resolve(res);
          }
          else{
            this.showWarning("Unable to unsubscribe service, try again later.");
            reject();
          }

        }, error => {
          this.showWarning("Unable to unsubscribe service, try again later.");
          reject(error);
        })
      })
      if(id) this.switchSubscribe(false, id, customer, qt)
    } else {
      let subDataNew = { customer_id:customer, product_id:id, quantity:qt }
      let pr = new Promise((resolve, reject) => {
        this.api.subscribeProductUpd(true, subDataNew).subscribe(res => {
          if (res) {
            this.showSuccess("Service correctly subscribed.");
            this.initUser();
            resolve(res);
          } else {
            this.showWarning("Unable to subscribe service, try again later.");
            reject();
          }

        }, error => {
          this.showWarning("Unable to subscribe service, try again later.");
          reject(error);
        })
      })
    }
  }

  getProductSubscriptionInOption(prod, id) {
    let prods = this.products
    for(let i = 0; i < prods.length; i++) {
      if(prod == prods[i].id) {
        for(let f = 0; f < prods[i].ProductVariations.length; f++) {
            if(id != prods[i].ProductVariations[f].id && this.hasProductSubscription(prods[i].ProductVariations[f].id))
              return prods[i].ProductVariations[f].id
        }
      }
    }
    return false;
  }

  hasProductSubscription(id) {
    let subs = this.user.Customer.ProductVariations
    for(let i = 0; i < subs.length; i++) {
        if(id == subs[i].id)
            return true;
    }
    return false;
  }

  openRowProduct(id) {
    if (id != -1) {
      if (id == 0)
        this.isEditingNewProduct = true

      this.curEditingId = id;
      this.selectedGroup = {label:'plan', value:'plan'}
      let prod = this.products.find(item => item.id==id)
      if (prod) {
        let grp = this.groups.find(item => item.value==prod.group)
        if (grp)
          this.selectedGroup = grp
      }
    } else {
      this.isEditingNewProduct = false
      this.curEditingId = -1;
    }
  }

  saveRowProduct(id) {
    this.submitted = true;
    let formObj = this.getProductForms(id)

    if (!formObj || formObj.invalid) {
      return false;
    }

    let productData = {
      id: parseInt(""+id),
      name: formObj.controls.name.value,
      description: formObj.controls.description.value,
      sku: formObj.controls.sku.value,
      group: formObj.controls.group.value, // ? formObj.controls.group.value.value : 'plan',
      discountId: formObj.controls.discountId.value ? parseInt(""+formObj.controls.discountId.value) : null,
    };

    let isUpd = productData.id>0

    this.blockContent = true
    let pr = new Promise((resolve, reject) => {
      this.api.postProduct(productData).subscribe(res => {
        this.blockContent = false
        if (res) {
          this.getProductsList({});

          this.saveVariations(res.id);
          this.showSuccess("Product saved successfully");
          resolve(res)
        } else {
          this.showWarning("Sorry we cannot save your product, please check data and try again.")
          reject()
        }

      }, error => {
        this.blockContent = false
        this.showWarning("Sorry we cannot save your product, please check data and try again.")
        reject(error)
      })
    })
    //if(isUpd)this.saveVariations(id);

    this.submitted = false;
  }

  saveVariations(id) {
    let formObjVars = this.getProductFormsVarsFromProd(id)
    for(let v in formObjVars) {
      let fr = formObjVars[v]
      if (!fr || fr.invalid) {
        return false;
      }
    }

    let prV = [];
    for(let v in formObjVars) {
      let fr = formObjVars[v]
      let variationData = {
        productId: id,
        id: parseInt(""+v),
        currency: this.defVars.currency,
        price: parseFloat(""+fr.controls.price.value),
        recur: fr.controls.recur.value,
        maxQuantity: parseInt(""+fr.controls.maxQuantity.value),
        description: "Product#" + id
      };

      if (parseFloat(""+fr.controls.price.value)<=0) {
        this.showWarning("Price cannot be less than 0.  Please update Variation again!")
        return
      }

      prV[v] =  new Promise((resolve, reject) => {
        this.blockContent = true
        this.api.postVariation(variationData).subscribe(res => {
          this.blockContent = false
          if (res) {
            this.getProductsList({});
            this.showSuccess("Variation saved successfully");
            resolve(res)
          }
          else{
            this.showWarning("Sorry we cannot save your variation, please check data and try again.")
            reject()
          }

        }, error => {
          this.blockContent = false
          this.showWarning("Sorry we cannot save your variation, please check data and try again.")
          reject(error)
        }, () => {
          this.blockContent = false
        })
      }).catch(err => {
        this.blockContent = false
      })
    }
  }

  // payments method manage

  getPaymentMethodsList() {
    return new Promise((resolve, reject) => {
      this.api.getPaymentMethods(this.customerId).subscribe(res => {
        if (res) {
          this.paymentMethods = res;
          if(res.length > 0) this.selectedPaymentMethod = res[0];
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

  onSelectPaymentMethod(event) {
    let index = parseInt(event.target.value);
    this.selectedPaymentMethod = this.paymentMethods[index];
  }

  getFormPaymentsBuild(prod) {
    return this.formBuilder.group({
      card_name: [prod.card_name, Validators.required],
    });
  }

  savePayment(_resTokenId) {
    this.submitted = true;

    let paymentMethodsData = {
      payment:{
        currency: this.user.Customer.currency,
        cvv: 111,
        description: "string",
        expDate: "11/11",
        name: this.card_name,
        number: "1111111111111111",
        type: "card",
        token: _resTokenId,
        customerId: this.customerId
      },
      customer:this.user.Customer
    }

    let pr = new Promise((resolve, reject) => {
      this.api.postPaymentMethods(paymentMethodsData).subscribe(res => {
        if (res) {
          this.getPaymentMethodsList();
          this.showSuccess("Payment method saved successfully");
          resolve(res)
        } else {
          this.showWarning("Sorry we cannot save your payment method, please check data and try again.")
          reject()
        }

      }, error => {
        this.showWarning("Sorry we cannot save your payment method, please check data and try again.")
        reject(error)
      })
    })

    this.submitted = false;
  }

  removePayment(token) {
    let pr = new Promise((resolve, reject) => {
      this.api.deletePaymentMethods(token).subscribe(res => {
        if (res) {
          this.getPaymentMethodsList();
          this.showSuccess("Payment method deleted successfully");
          resolve(res)
        }
        else{
          this.showWarning("Sorry we cannot delete your Payment method, try again.")
          reject()
        }

      }, error => {
        this.showWarning("Sorry we cannot delete your Payment method, try again.")
        reject(error)
      })
    })
  }

  setPrimaryPayment(id) {
    let pr = new Promise((resolve, reject) => {
      this.api.setPrimaryPaymentMethod(id).subscribe(res => {
        if (res) {
          this.getPaymentMethodsList();
          this.showSuccess("Payment method successfully set as primary");
          resolve(res)
        }
        else{
          this.showWarning("Sorry we're unable to process you request, please try later.")
          reject()
        }

      }, error => {
        this.showWarning("Sorry we're unable to process you request, please try later.")
        reject(error)
      })
    })
  }

  async createTokenAndRegister() {
    this.submitted = true;

    if(!this.card_name || this.card_name.trim().length < 1) {
      this.showWarning("Card name is a required information!");
      return false;
    }

    const name = this.card_name;

    this.resTokenId = 0;
    this.stripeService
      .createToken(this.card.element, { name })
      .subscribe((result) => {
        if (result.token) {
          // Use the token
          this.resTokenId = result.token.id;
          this.savePayment(this.resTokenId);
          this.displayResponsive = false;
        } else if (result.error) {
          // Error creating the token
          this.resTokenId = 0;
          this.showWarning("Sorry we cannot validate your card, please check card data and try again.")
        }
    });
    this.submitted = false;
  }

  chargeCustomer(amount, token) {
    let pr = new Promise((resolve, reject) => {
      this.api.chargeCustomer(amount, token).subscribe(p_method => {
        if (p_method) {
          // this.paymentMethods = p_method;
          p_method = Array(1).fill(p_method);
          this.api.getCustomerBalance().subscribe(balance => {
            if (balance) {
              this.store.setBalance(balance.balance);
              this.showSuccess("Wallet correctly charged");
            }
            resolve(p_method);
          }, error => {
            reject(error);
          });
        } else {
          reject();
        }
      }, error => {
        reject(error)
      })
    })
  }

  // transactions manage

  getTransactionsList() {
    return new Promise((resolve, reject) => {
      this.api.getAccountLogs(this.customerId, 1, 1000).subscribe(res => {
        if (res) {
          this.transactions = JSON.parse(JSON.stringify(res));
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

  handleChange = (key: string, event: any) => {
    this.user[key] = event.target.value
  }

  dateFormat(date, format = 'mediumDate') {
    return (!date || date.trim().length <= 0) ? "" : formatDate(date, format, 'EN_us');
  }

  exportPdf() {}

  exportExcel() {
      import("xlsx").then(xlsx => {
          const worksheet = xlsx.utils.json_to_sheet(this.products);
          const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
          const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
          this.saveAsExcelFile(excelBuffer, "transactions");
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

  /**
   * Show Confirmation Popup before buy numbers
   */
  confirmDialog(content: string, title: string, payload: any) {
    this.confirmationService.confirm({
      message: content,
      header: 'Order Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        payload = JSON.parse(JSON.stringify(payload));
        if(payload.action == 'subscribe' || payload.action == 'unsubscribe') {
          this.manageRowProduct(payload.product_id, payload.variation_id);
        } else if(payload.action == 'charge') {
          const pm: any = this.selectedPaymentMethod;
          if(pm.token != null && pm.token.trim().length > 0) this.chargeCustomer(this.chargeAmount, pm.token);
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

import {Component, OnInit} from '@angular/core'
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service'
import {ActivatedRoute, Router} from '@angular/router'
import {SipGateways} from '@app/models/sip-gateway'
import {
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {tap} from "rxjs/operators";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-sipgateway-edit',
  templateUrl: './sipgateway-edit.component.html',
  styleUrls: ['./sipgateway-edit.component.scss'],
  animations: [
  ]
})
export class SipGatewayEditComponent implements OnInit {

  sipGateway: SipGateways = {
    // id: 0,
    name: '',
    customerId: null,
    address: '',
    port: 10,
    digitsStrip: '',
    description: '',
    type: 0,
    nums: null
  }

  // Tab
  customerList: any[] = [{id: 0, firstName: '', lastName:'', companyName: 'None'}];
  customerSelectable =  false;

  selectedCustomer : any
  selectedDescription = ''
  selectedName = ''
  selectedAddress = ''
  selectedPort = ''
  selectedStrip = ''

  formValid = {
    name: true,
    address: true,
    port: true,
    digitsStrip: true,
    description: true,
  }

  calledTypes : any[] = [
    { key: 0, label: 'Incoming Gateway' },
    { key: 1, label: 'Outbound Gateway' },
  ]
  selectedCalledType : any = { key: 0, label: 'Incoming Gateway' }

  blockContent = false

  isWhitelisted = "true"
  addressRegExp = /((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.) {3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(\D*\.[a-z]{2,3}))(:\d+)?$/
  ipv4RegExp =  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

  constructor(public api: ApiService,
              public router: Router,
              public route: ActivatedRoute,
              public messageService: MessageService,
              public store: StoreService,
              public location: Location
  ) {
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      // this.sipGateway.customerId = this.store.getUser().customerId;
      // let guiVisibility = this.store.getGuiVisibility()
      //
      // let permission = PERMISSION_TYPE_DENY
      // for (let v of guiVisibility) {
      //   if (v.GuiSection.name == "SipGateways") {
      //     permission = v.GuiPermission.name
      //     break
      //   }
      // }
      //
      // if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      // }
    } else {
      this.customerSelectable = true
    }

    await this.api.getAllCustomerList().pipe(
      tap(res => {
        for (let item of res) {
          this.customerList.push(item)
        }

        this.customerList = [ ...this.customerList ]
        this.selectedCustomer = this.store.getUser().Customer

        this.api.getSipGatewayById(this.route.snapshot.params.id).subscribe(res => {
          this.blockContent = false
          this.sipGateway.id = res.id;
          this.sipGateway.name = res.name;
          this.sipGateway.customerId = res.customerId;
          this.sipGateway.address = res.address;
          this.sipGateway.port = res.port;
          this.sipGateway.digitsStrip = res.digitsStrip;
          this.sipGateway.description = res.description;
          this.sipGateway.type = res.type;

          this.selectedName = res.name;
          this.selectedAddress = res.address
          this.selectedPort = "" + res.port
          this.selectedStrip = res.digitsStrip
          this.selectedDescription = res.description
          this.isWhitelisted = res.isWhitelisted ? "true" : "false"

          let types  =this.calledTypes.find((item)=>item.key==this.sipGateway.type)
          if (types)
            this.selectedCalledType = types

          if (this.sipGateway.customerId==null)
            this.selectedCustomer = {id: 0, firstName: '', lastName:'', companyName: 'None'}
          else
            this.selectedCustomer = this.customerList.find((cus) => cus.id==this.sipGateway.customerId)
        }, e => {
        })
      }, error => {
      })
    ).toPromise();
  }

  /**
   * this is called at changing input field value
   * @param event input field
   */
  handleChangeEvent = (event: any) => {
    var target = event.target.name;
    var value = event.target.value;

    this.handleValidation(target, value)
    // this.sipGateway[event.target.name] = event.target.value;
  }

  handleValidation = (target, value) => {
    switch (target) {
      case 'name':
        this.formValid.name = value != undefined && value != ''
        break;

      case 'address':
        this.formValid.address = this.addressRegExp.test(value) || this.ipv4RegExp.test(value)
        break;

      case 'port':
        this.formValid.port = value!='' && !isNaN(value) && 5060 <= parseInt(value) && parseInt(value) <= 65536
        break

      case 'digits_strip':
        this.formValid.digitsStrip = value == null || value == '' || (!isNaN(value) && 0 <= parseInt(value) && parseInt(value) <= 10)
        break

      case 'description':
        this.formValid.description = value!=null && value!=''
        break
    }

    return this.isFormInvalid()
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  /**
   *
   */
  isFormInvalid = () => {
    return this.formValid.name && this.formValid.address && this.formValid.port && this.formValid.digitsStrip && this.formValid.description
  }

  /**
   * this is called at clicking save button
   */
  onSaveChange = () => {
    if (!this.handleValidation('name', this.selectedName)
      || !this.handleValidation('address', this.selectedAddress)
      || !this.handleValidation('port', this.selectedPort)
      || !this.handleValidation('digits_strip', this.selectedStrip)
      || !this.handleValidation('description', this.selectedDescription)) {
      return
    }

    this.sipGateway.name = this.selectedName
    this.sipGateway.address = this.selectedAddress
    this.sipGateway.port = parseInt(this.selectedPort)
    this.sipGateway.description = this.selectedDescription
    this.sipGateway.digitsStrip = this.selectedStrip
    this.sipGateway.isWhitelisted = this.isWhitelisted=="true"
    this.sipGateway.customerId = !this.selectedCustomer || this.selectedCustomer.id==0 ? null : this.selectedCustomer.id

    this.blockContent = true
    this.api.updateSipGatewayById(this.sipGateway).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Updating Succeeded!')
      this.router.navigateByUrl(RoutePath.receiving.sipgateways)
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

}

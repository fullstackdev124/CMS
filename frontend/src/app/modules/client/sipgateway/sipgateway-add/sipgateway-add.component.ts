import {Component, OnInit, Directive} from '@angular/core';
import {SipGateways} from '@app/models/sip-gateway';
import {ApiService} from '@services/api/api.service';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {tap} from "rxjs/operators";
import {toBase64} from "@app/helper/utils";
import * as XLSX from "xlsx";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-sipuri-add',
  templateUrl: './sipgateway-add.component.html',
  styleUrls: ['./sipgateway-add.component.scss'],
  animations: [
  ]
})

export class SipGatewayAddComponent implements OnInit {

  sipGateway: SipGateways = {
    // id: 0,
    name: '',
    customerId: null,
    address: '',
    port: 10,
    digitsStrip: '',
    description: '',
    nums: null,
  };

  customerList: any[] = [{id: 0, firstName: '', lastName:'', companyName: 'None'}];
  customerSelectable =  false;

  encoded_file = null
  file_extension = null
  id: null;
  header = ''
  data: any[][] = []
  isOpen: boolean = false
  selected = []
  origin: any[][] = []
  action = 'append';
  importPanelOpened = false;
  selCustomerId = 1;

  types : any[] = [
    { key: 'append', value: 'Append' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ]

  calledTypes : any[] = [
    { key: 0, label: 'Incoming Gateway' },
    { key: 1, label: 'Outbound Gateway' },
  ]
  selectedCalledType : any = { key: 0, label: 'Incoming Gateway' }

  bulkSampleData: any[] = [
    { name: 'DIP_PBX_242', address: '208.73.232.242', port: 5060 },
    { name: 'DIP_PBX_242', address: '208.73.232.242', port: 5060 },
  ]

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

  blockContent = false
  isUploading = false

  isWhitelisted = "true"
  addressRegExp = /((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.) {3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(\D*\.[a-z]{2,3}))(:\d+)?$/
  ipv4RegExp =  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

  constructor(public api: ApiService,
              public route: Router,
              private messageService: MessageService,
              private store: StoreService,
              private location: Location) {
  }

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
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      // this.customerSelectable = false;
      // this.sipGateway.customerId = this.store.getUser().customerId;
      // const guiVisibility = this.store.getGuiVisibility();
      //
      // let permission = PERMISSION_TYPE_DENY;
      // for (const v of guiVisibility) {
      //   if (v.GuiSection.name == 'SipGateways') {
      //     permission = v.GuiPermission.name;
      //     break;
      //   }
      // }

      // if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn('You have no permission for this page')
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve();
          }, NoPermissionAlertInteral);
        });
        this.location.back();
      // }
    } else {
      this.customerSelectable = true
    }

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      await this.api.getAllCustomerList().pipe(
        tap(res => {
          for (let item of res) {
            this.customerList.push(item)
          }

          this.customerList = [ ...this.customerList ]
        })
      ).toPromise();

      this.selectedCustomer = this.store.getUser().Customer
    } else {
      this.customerList.push(this.store.getUser().Customer);
      this.selCustomerId = this.store.getUser().Customer.id;
    }
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
  showSuccess = (msg: string, summary?: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: summary ? summary : 'Success', detail: msg });
  };

  onEditChange = (event: any, id: number) => {
    this.selected[id] = event.target.value;
  }

  /**
   *
   */
  isFormInvalid = () => {
    return this.formValid.name && this.formValid.address && this.formValid.port && this.formValid.digitsStrip && this.formValid.description
  }

  /**
   * this is called at clicking Create button
   * @returns
   */
  onCreate = () => {
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
    this.api.addSipGateway(this.sipGateway).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Adding Succeeded!');
      this.route.navigate([RoutePath.receiving.sipgateways]);
    }, e => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  }

  /**
   *
   * @param isCsv
   */
  onCreateNumber = async (isCsv?: boolean) => {
    if (!isCsv) {
      if (!this.isFormInvalid()) {
        this.showError("Please input valid data.")
        return
      }

      this.blockContent = true
      this.api.addSipGateway(this.sipGateway).subscribe(res => {
        this.blockContent = false
        this.showSuccess('Adding Succeeded!');
        this.route.navigate([RoutePath.receiving.sipgateways]);
      }, e => {
        this.blockContent = false
      }, () => {
        this.blockContent = false
      });
    } else {
      const data = [[...this.header.split(',')], ...this.data]
      const convertedData = data.map(e => e.join(',')).join('\n')

      // const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
      const blob = new Blob([convertedData], {type: 'text/csv;charset=utf-8;'})
      this.encoded_file = await toBase64(blob)
      this.encoded_file = this.encoded_file.split(',')[1]

      this.blockContent = true
      this.api.bulkSipGatewaysUpload({
        encoded_file: this.encoded_file,
        file_extension: this.file_extension,
        customer_id: this.selCustomerId,
        action: this.action
      }).subscribe(res => {
        this.blockContent = false

        let message = ""
        if (res.code==200) {
          message += " Total: " + res.total
          if (res.completed>0)
            message += ", Success: " + res.completed

          if (res.failed>0) {
            message += ", Failed: " + res.failed
            if (this.action=="append")
              message += " (SIP Gateway already existed) "
            else
              message += " (SIP Gateway not existed) "
          }

          if (res.crashed>0) {
            message += ", Error: " + res.crashed
            message += " (Internal server error) "
          }
        }

        if (message.length>0)
          this.showSuccess(message, "Successfully imported.")
        else
          this.showSuccess("Successfully imported.")

        this.data = [];
      }, (e) => {
        this.blockContent = false
      }, () => {
        this.blockContent = false
      });
    }
  }

  /**
   *
   * @param data
   */
  validate = (data) => {
    if (data[0].length === 3
      && (data[0][0] && data[0][0].toLowerCase().includes('name'))
      && (data[0][1] && data[0][1].toLowerCase().includes('address'))
      && (data[0][2] && data[0][2].toLowerCase().includes('port'))
      ) {
      return true

    } else {
      this.showWarn('Please upload valid file!')
      return false
    }
  };

  /**
   * remove header
   */
  removeHeader = () => {
    if (!/\d/g.test(this.data[0][0]) && !/\d/g.test(this.data[0][1])) {
      this.data.shift()
      this.origin.shift()
    }
  }

  /**
   *
   * @param event
   */
  changeListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      this.blockContent = true
      this.isUploading = true

      let file: File = event.target.files.item(0)
      const items = file.name.split('.')
      this.file_extension = items[items.length - 1]
      this.encoded_file = await toBase64(file)
      this.encoded_file = this.encoded_file.split(',')[1]

      const reader: FileReader = new FileReader()
      if (file.type === 'text/csv') {
        reader.readAsText(file)

        reader.onload = (e: any) => {
          const data = e.target.result
          let csvRecordsArray = (<string>data).split('\n')
          this.header = csvRecordsArray[0]
          const total = []
          let item = []
          csvRecordsArray.map(c => {
            item = [...c.split(',')]
            total.push(item)
          })

          const isValid = this.validate(total)
          if (isValid) {
            this.data = total
            this.isOpen = false
            this.removeHeader()
          }

          this.blockContent = false
          this.isUploading = false
        }

      } else {
        reader.onload = (e: any) => {
          /* read workbook */
          const bstr: string = e.target.result
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'})

          /*grab first sheet*/
          const wsname: string = wb.SheetNames[0]
          const ws: XLSX.WorkSheet = wb.Sheets[wsname]

          /* save data */
          const data = <any[][]>(XLSX.utils.sheet_to_json(ws, {header: 1}))
          this.validate(data)
          const isValid = this.validate(data)
          if (isValid) {
            this.data = data
            this.isOpen = false
            this.removeHeader()
          }

          this.blockContent = false
          this.isUploading = false
        }
        reader.readAsBinaryString(file)
      }
      this.importPanelOpened = false
    }
  }

  getInt = (s) => {
    return parseInt(s);
  }
}

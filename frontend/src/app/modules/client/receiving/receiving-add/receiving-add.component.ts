import {toBase64, trackingKeys} from './../../../../helper/utils';
import { Component, OnInit, Directive } from '@angular/core';
import { Location } from '@angular/common';
import { ReceivingNumber } from '@app/models/receiving-number'
import { ApiService } from '@services/api/api.service'
import { Router } from '@angular/router'
import { AnimationInterval, CMSUserType, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL, NoPermissionAlertInteral } from '../../constant';
import { FormGroup, Validators, FormControl, FormBuilder } from '@angular/forms'
import { StoreService } from '@services/store/store.service';
import * as XLSX from 'xlsx';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";
import {INTERNATIONAL_PHONE_COUNTRY} from "@app/modules/client/tracking-number/countries";
import * as PhoneNumberLibrary from "google-libphonenumber";
import {PhoneNumberFormat} from "google-libphonenumber";

@Component({
  selector: 'app-receiving-add',
  templateUrl: './receiving-add.component.html',
  styleUrls: ['./receiving-add.component.scss'],
  animations: [
  ]
})

export class ReceivingAddComponent implements OnInit {

  currentSection = 'receiving-general'
  receivingNumber: ReceivingNumber = {
    number: '',
    total_calls: 0,
    description: null,
    customerId: null,
    tracking_numbers: [],
  }

  generalForm: FormGroup;
  isFormValid: Boolean = false;
  isError = false

  // Standard North US Number Matching (+1 is optional)
  phoneRegex: RegExp = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;

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
                                                                                                                                                                                                                          customerList: any[] = [];
  customerSelectable =  true;
  canBulkUpload = false;

  types : any[] = [
    { key: 'append', value: 'Append' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ]

  bulkSampleData: any[] = [
    { number: '8885345444', source: '4243920017', routing: 'routing', receiving: 'test1' },
    { number: '8334345969', source: '3824935435', routing: 'routing', receiving: 'test2' },
  ]

  selectedCustomer : any
  selectedDescription = ''
  selectedNumber = ''

  blockContent = false
  isUploading = false

  selectedReceivingNumber: string = ""

  phone_countries = INTERNATIONAL_PHONE_COUNTRY.map((item: any)=>{
    item.label = item.name + " (" + item.dial_code + ")"
    return item
  })
  selectedPhoneCountry: any =    {
    "name": "United States",
    "dial_code": "+1",
    "code": "us",
    "placeholder": "(201) 555-0123",
    "mask": "(999) 999-9999",
    label: "United States (+1)",
  }
  selectedCountryCode: any =    {
    "name": "United States",
    "dial_code": "+1",
    "code": "us",
    "placeholder": "(201) 555-0123",
    "mask": "(999) 999-9999",
    label: "United States (+1)",
  }

  phoneUtil = PhoneNumberLibrary.PhoneNumberUtil.getInstance()

  constructor(public api: ApiService,
    public route: Router,
    private messageService: MessageService,
    public store: StoreService,
    public location: Location,
    private fb: FormBuilder
  ) {
    this.generalForm = new FormGroup({
    });
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          this.receivingNumber.customerId = this.store.getUser().customerId
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      this.customerSelectable = false;
      this.receivingNumber.customerId = this.store.getUser().customerId;
      let guiVisibility = this.store.getGuiVisibility();

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "ReceivingNumbers") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      this.canBulkUpload = true;


      this.api.getAllCustomerList().subscribe(res => {
        this.customerList = res
      })

      this.selectedCustomer = this.store.getUser().Customer
    } else {
      this.customerList.push(this.store.getUser().Customer);
      this.selCustomerId = this.store.getUser().Customer.id;
    }
  }

  // validator for number control
  get numberValidator() { return this.generalForm.get('number') }

  /**
   * this is called at changing the value of number, description input field
   * @param event input field
   */
  handleChange = (event: any) => {
    if (event.target.name === 'number') {
      // this.receivingNumber[event.target.name] = event.target.value.replace(/\D/g, '');

    } else {
      this.receivingNumber[event.target.name] = event.target.value;
    }
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


  /**
   * this is called at clicking Save Changes button
   * @returns
   */
  onSaveChange = () => {
    if (this.selectedPhoneCountry?.dial_code=="" || this.selectedReceivingNumber=="") {
      this.showError("Please input the number.")
      return
    }

    const number = this.phoneUtil.parse(this.selectedPhoneCountry.dial_code + this.selectedReceivingNumber)
    if (!number || !this.phoneUtil.isValidNumber(number)) {
      this.showWarn("Please Enter Valid Number.")
      return
    }

    if (this.selectedDescription == '') {
      this.showWarn("Please enter description of Receiving Number")
      return
    }

    this.receivingNumber.number = this.phoneUtil.format(number, PhoneNumberFormat.E164)

    this.receivingNumber.customerId = !this.selectedCustomer || this.selectedCustomer.id==0 ? this.store.getUser().customerId : this.selectedCustomer.id
    this.receivingNumber['description'] = this.selectedDescription;

    this.blockContent = true

    this.api.addReceivingNumber(this.receivingNumber).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Adding Succeeded!')
      this.route.navigate([RoutePath.receiving.numbers])
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

  /**
   *
   * @param isCsv
   */
  onCreateNumber = async (isCsv?: boolean) => {
    if (!isCsv) {
      if (this.generalForm.errors?.numberInvalid) {
        this.showError("Number is invalid. Please input the correct number.")
        return
      }

      this.blockContent = true
      this.api.addReceivingNumber(this.receivingNumber).subscribe(res => {
        this.blockContent = false
        this.showSuccess('Adding Succeeded!')
        this.route.navigate([RoutePath.receiving.numbers])
      }, error => {
        this.blockContent = false
      }, () => {
        this.blockContent = false
      })

    } else {
      const data = [[...this.header.split(',')], ...this.origin]
      const convertedData = data.map(e => e.join(',')).join('\n')

      // const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
      const blob = new Blob([convertedData], {type: 'text/csv;charset=utf-8;'})
      this.encoded_file = await toBase64(blob)
      this.encoded_file = this.encoded_file.split(',')[1]

      this.blockContent = true
      this.api.bulkUpload({
        encoded_file: this.encoded_file,
        file_extension: this.file_extension,
        customer_id: this.selCustomerId,
        action: this.action,
        countryCode: this.selectedCountryCode.dial_code,
      }).subscribe(res => {
        this.blockContent = false
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `BulkUploadReport.csv`)
        tempLink.click()

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
    if (data[0].length === 1 && (data[0][0] && data[0][0].toLowerCase().includes('receiving number') )) {
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
    }

    let origin = this.data.map(item => {
      if (item[0]!="" && item[0].length>2 && item[0].substring(0,2)=="+1")
        item[0] = item[0].substring(2)
      return [...item]
    })
    this.origin = [ ...origin ]

    this.data = this.data.map(item => {
      if (item[0]!="")
        item[0] = this.selectedCountryCode.dial_code + item[0]
      return item;
    })
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

}

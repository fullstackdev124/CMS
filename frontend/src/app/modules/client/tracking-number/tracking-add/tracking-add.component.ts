import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {ApiService} from '@services/api/api.service';
import {GetNumbers} from '@app/models/tracking_numbers';
import {toBase64} from '@app/helper/utils';
import {FormBuilder, FormGroup} from '@angular/forms';
import * as XLSX from 'xlsx';
import {CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_DENY} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {RoutingActionEnum} from '@app/models/routing-action';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

import * as PhoneNumberLibrary from 'google-libphonenumber'
import {INTERNATIONAL_PHONE_COUNTRY} from "@app/modules/client/tracking-number/countries";
import {PhoneNumberFormat} from "google-libphonenumber";

@Component({
  selector: 'app-tracking-add',
  templateUrl: './tracking-add.component.html',
  styleUrls: ['./tracking-add.component.scss'],
  animations: [
  ]
})
export class TrackingAddComponent implements OnInit {

  number: GetNumbers = {
    tracking_number: null,
    customerId: 0,
    notifications: 0,
    text_support: 0,
    tracking_sourceId: 1
  }

  isError = false
  data: any[][] = []
  origin: any[][] = []

  currentSection: string = 'new_number'
  filter: string = null
  isOpen: boolean = false
  isEdit: boolean = false
  id = null
  originId = null
  selected = []
  form: FormGroup
  encoded_file = null
  file_extension = null
  editStage = 'nothing'
  header = ''
  action: string = 'append'
  importPanelOpened = false

  selCustomerId = 1

  customerList: any[] = []
  cmsUserType = CMSUserType
  canBulkUpload = false
  routingActionClass = RoutingActionEnum
  routingAction = RoutingActionEnum.NotMapped.key;
  routingActionEnum = [
    {
      key: 'NOT_MAPPED',
      value: 'Not Mapped'
    },
    {
      key: 'FORWARD_TO',
      value: 'Forward'
    },
    {
      key: 'REMAP_FORWARD_TO',
      value: 'Remap forward to'
    },
    // { key: 'DIAL_AGENT', value: 'Dial Agent' },
    { key: 'HANG_UP', value: 'Hang Up' },
  ]

  object = Object
  isUploading = false

  types : any[] = [
    { key: 'append', value: 'Append' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ]

  bulkSampleData: any[] = [
    { number: '8775345444', source: '4243920017', routing: 'REMAP_FORWARD_TO', receiving: '8004892214', agent: 1 },
    { number: '8775345445', source: '3824935435', routing: 'REMAP_FORWARD_TO', receiving: '8004892215', agent: 2 },
  ]

  selectedTrackingNumber: string = ""
  selectedCustomer : any

  blockContent = false

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
  selectedCountryCode1: any =    {
    "name": "United States",
    "dial_code": "+1",
    "code": "us",
    "placeholder": "(201) 555-0123",
    "mask": "(999) 999-9999",
    label: "United States (+1)",
  }

  phoneUtil = PhoneNumberLibrary.PhoneNumberUtil.getInstance()

  constructor(
    public api: ApiService,
    public router: Router,
    private routes: Router,
    private fb: FormBuilder,
    private messageService: MessageService,
    private location: Location,
    public store: StoreService
  ) {
    this.form = this.fb.group({
      encoded_file: [''],
      file_extension: ''
    })
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          this.number.customerId = this.store.getUser().customerId
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility();

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "TrackingNumbers") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page");
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    /**************************** page started *************************/

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

  /**
   *
   * @param isCsv
   */
  onCreateNumber = async (isCsv?: boolean) => {
    // this.number.tracking_number = this.selectedTrackingNumber

    if (!isCsv) {
      if (this.selectedPhoneCountry?.dial_code=="" || this.selectedTrackingNumber=="") {
        this.showWarn("Please Enter Tracking Number.")
        this.isError = true
        return
      }

      const number = this.phoneUtil.parse(this.selectedPhoneCountry.dial_code + this.selectedTrackingNumber)
      if (!number || !this.phoneUtil.isValidNumber(number)) {
        this.showWarn("Please Enter Valid Tracking Number.")
        this.isError = true
        return
      } else {
        this.isError = false
      }

      this.number.tracking_number = this.phoneUtil.format(number, PhoneNumberFormat.E164)

      this.blockContent = true
      this.api.addNumber(this.number)
        .subscribe(res => {
          this.blockContent = false
          this.routes.navigate([RoutePath.tracking_number.edit_full + res.id])
        }, e => {
          this.blockContent = false
          this.showError("Error is occured while creating tacking number: " + e)
        }, () => {
          this.blockContent = false
        });
    }
    else {
      const data = [[...this.header.split(',')], ...this.origin]
      const convertedData = data.map(e =>  e.join(',')).join('\n')

      // const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
      const blob = new Blob([convertedData], {type: 'text/csv;charset=utf-8;'})
      this.encoded_file = await toBase64(blob)
      this.encoded_file = this.encoded_file.split(',')[1]

      this.isUploading = true;
      this.blockContent = true
      this.api.bulkTNumbersUpload({
        encoded_file: this.encoded_file,
        file_extension: this.file_extension,
        customer_id: this.selCustomerId,
        action: this.action,
        routingAction: this.routingAction,
        countryCode: this.selectedCountryCode.dial_code,
        countryCode1: this.selectedCountryCode1.dial_code
      }).subscribe(res => {
        this.blockContent = false
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `BulkUploadReport.csv`)
        tempLink.click()

        this.data = [];
        this.isUploading = false;
        this.blockContent = false
      }, (e) => {
        console.log(e)
        this.blockContent = false
        this.isUploading = false;
      }, () => {
        this.blockContent = false
        this.isUploading = false;
      });
    }
  }

  /**
   *
   * @param event
   * @param id
   */
  onEditChange = (event: any, id: number) => {
    this.selected[id] = event.target.value;
  }

  /**
   *
   */
  onSaveChange = () => {
    this.data[this.id] = this.selected;
    this.isEdit = false;
    this.editStage = 'nothing';
  }

  /**
   *
   */
  onCancel = () => {
    this.editStage === 'append' && this.data.splice(this.id, 1)
    this.isEdit = false
    this.editStage = 'nothing'
  }

  /**
   *
   * @param data
   */
  validate = (data) => {
    if (
      (
        (data[0][0] != null) && (String(data[0][0]).match(/\s*tracking\s*number\s*/gi)  != null) &&
        (data[0][1] != null) && (String(data[0][1]).match(/\s*tracking\s*source\s*/gi)  != null) &&
        (data[0][2] != null) && (String(data[0][2]).match(/\s*receiving\s*number\s*/gi) != null)
      )
    ) {
      return true
    } else {
      this.showWarn('Please upload valid file!')
      return false
    }
  }

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
      if (item.length>2 && item[2]!="" && item[2].length>2 && item[2].substring(0,2)=="+1")
        item[2] = item[2].substring(2)
      return [...item]
    })
    this.origin = [ ...origin ]

    this.data = this.data.map(item => {
      if (item[0]!="")
        item[0] = this.selectedCountryCode.dial_code + item[0]
      if (item.length>2 && item[2]!="")
        item[2] = this.selectedCountryCode1.dial_code + item[2]
      return item;
    })
  }

  /**
   *
   * @param event
   */
  changeListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      let file: File = event.target.files.item(0)
      const items = file.name.split('.')
      this.file_extension = items[items.length - 1]
      this.encoded_file = await toBase64(file)

      this.encoded_file = this.encoded_file.split(',')[1];

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
          let data = <any[][]>(XLSX.utils.sheet_to_json(ws, {header: 1}))
          const isValid = this.validate(data)
          if (isValid) {
            this.data = data
            this.isOpen = false
            this.removeHeader()
          }
        }
        reader.readAsBinaryString(file)
      }
      this.importPanelOpened = false
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

  getInt = (s) => {
    return parseInt(s);
  }

  onChangePhoneCountry(event) {
    console.log(event)
  }
}

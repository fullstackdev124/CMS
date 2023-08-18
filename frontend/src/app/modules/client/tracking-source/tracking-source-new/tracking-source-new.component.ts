import {toBase64, trackingKeys} from './../../../../helper/utils';

import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { trigger, transition, query, style, animate} from '@angular/animations'
import {Router} from '@angular/router'
import {GetSources} from '@app/models/tracking_numbers'
import {ApiService} from '@services/api/api.service'
import { AnimationInterval, CMSUserType, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL, NoPermissionAlertInteral } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {mergeMap, tap} from "rxjs/operators";
import {of} from "rxjs";
import * as XLSX from 'xlsx';
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-tracking-source-new',
  templateUrl: './tracking-source-new.component.html',
  styleUrls: ['./tracking-source-new.component.scss'],
  animations: [
  ]
})

export class TrackingSourceNewComponent implements OnInit {

  current = 'source-general';
  source: GetSources = {
    name: '',
    type: 'offsite',
    position: 0,
    lastTouch: 0,
    customerId: 1,
  };

  customerList: any[] = []
  cmsUserType = CMSUserType

  encoded_file = null
  file_extension = null
  id: null;
  header = ''
  data: any[][] = []
  isOpen: boolean = false
  isEdit: boolean = false
  selected = []
  origin: any[][] = []
  action = 'append';
  importPanelOpened = false;
  selCustomerId = 1;
  canBulkUpload = false;

  types : any[] = [
    { key: 'append', value: 'Append' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ]

  bulkSampleData: any[] = [
    { source: 'DIP_CUS_BEL', routing: 'routing', receiving: 'test1' },
    { source: 'DIP_CUS_BEL', routing: 'routing', receiving: 'test2' },
  ]

  selectedCustomer : any
  selectedDescription = ''
  selectedName = ''

  blockContent = false
  isUploading = false

  constructor(public api: ApiService,
    public route: Router,
    public router: Router,
    public messageService: MessageService,
    public store: StoreService,
    public location: Location
  ) { }

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
      let guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "TrackingSources") {
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
      this.api.getAllCustomerList().subscribe(res => {
        this.customerList = res
      })

      this.selectedCustomer = this.store.getUser().Customer
    } else {
      this.customerList.push(this.store.getUser().Customer);

      // Assign customer Id in case of not super admin
      this.source.customerId = this.store.getUser().customerId;
    }
  }

  onEditChange = (event: any, id: number) => {
    this.selected[id] = event.target.value;
  }

  /**
   *
   * @param section
   */
  scrollTo(section) {
    this.current = section;
    const element = document.getElementById(section);
    element.scrollIntoView(true);
  }

  /**
   *
   */
  onChangeOnsite = () => {
    this.source.type = this.source.type === 'offsite' ? 'onsite' : 'offsite';
  }

  /**
   *
   */
  onClickSave = () => {
    this.source.name = this.selectedName
    this.source.description = this.selectedDescription

    if (this.source.name=="") {
      this.showWarn("Please enter the name of Source")
      return
    }

    let filter = {
      where: {
        customerId: this.source.customerId,
        name: this.source.name
      }
    }

    this.blockContent = true
    this.api.getSourcesByFilter(filter).subscribe(res => {
      if (res.length > 0) {
        this.blockContent = false
        this.showWarn("There is already the same name.")
        return;
      }

      this.api.addSource(this.source).subscribe(res => {
        this.showSuccess('Creating Succeeded!');
        this.router.navigateByUrl(RoutePath.tracking_source.sources);
      }, err => {
        this.showError("Error in creating tracking source!")
        this.blockContent = false
      }, () => {
        this.blockContent = false
      });

    }, error => {
      this.blockContent = false
      this.showError("Error in creating tracking source!")
    })
  }

    /**
   *
   * @param isCsv
   */
     onCreateNumber = async (isCsv?: boolean) => {
      if (!isCsv) {
        this.blockContent = true
        this.api.addReceivingNumber(this.source).subscribe(res => {
          this.blockContent = false
          this.showSuccess('Adding Succeeded!')
          this.route.navigate([RoutePath.receiving.numbers])
        }, error => {
          this.blockContent = false
        }, () => {
          this.blockContent = false
        })
      } else {
        const data = [[...this.header.split(',')], ...this.data]
        const convertedData = data.map(e => e.join(',')).join('\n')

        // const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
        const blob = new Blob([convertedData], {type: 'text/csv;charset=utf-8;'})
        this.encoded_file = await toBase64(blob)
        this.encoded_file = this.encoded_file.split(',')[1]

        this.blockContent = true
        this.api.bulkTrackingSourcesUpload({
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
                message += " (Tracking source already existed) "
              else
                message += " (Tracking source not existed) "
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
      if (data[0].length === 1
        && (data[0][0] && data[0][0].toLowerCase().includes('tracking source')
        )) {
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
        }
        else {
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

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string, summary?: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: summary? summary : 'Success', detail: msg });
  };

  getInt = (s) => {
    return parseInt(s);
  }
}

import { ConfirmationService, MessageService } from 'primeng/api';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api/api.service';
import { Country, GetNumbers, GetSources } from '@app/models/tracking_numbers';
import { DialNumber, ReceivingNumber } from '@app/models/receiving-number';
import { CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_DENY } from '../../constant';
import { RoutingActionEnum } from '../../../../models/routing-action';
import { StoreService } from '../../../../services/store/store.service';
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs";
import { RoutePath } from "@app/app.routes";
import * as PhoneNumberLibrary from "google-libphonenumber";
import { PhoneFormatPipe } from "@pipes/phone-format.pipe";
import { SipGateways } from '@app/models/sip-gateway';

@Component({
  selector: 'app-tracking-edit',
  templateUrl: './tracking-edit.component.html',
  styleUrls: ['./tracking-edit.component.scss'],
  providers: [ConfirmationService],
  animations: [
  ]
})

export class TrackingEditComponent implements OnInit {

  dialogPosition: string = "top";

  id = null
  currentSection = 'number-name'
  data: GetNumbers
  sources: GetSources[] = []
  // filteredSources: GetSources[] = []
  countries: Country[]
  filteredCountries: Country[]
  isCollapsed = false
  selectedCountry: Country
  dialNumbers: DialNumber[] = []
  isOpen = false
  customerList: any[] = []
  originCustomerId: number = null
  open = false

  tabIndex = 0

  cmsUserType = CMSUserType

  isReleasing = false     // the flag if the tracking number is releasing

  backTrUpdateChecked = false;

  sipGateways: SipGateways[]
  selectedSipGateway : any

  receivingNumbers: ReceivingNumber[]
  filteredReceivingNumbers: ReceivingNumber[] = []

  object = Object
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

  selectedSource: GetSources
  selectedCustomer: any
  selectedDescription = ''
  selectedRoutingAction: any
  selectedReceivingNumber: any
  selectedSIPGateway: any
  selectedFailSafeNumber: any

  goingFrom = ''

  blockContent = false

  filteredSender: any[] = []
  selectedSender: any
  filteredReceiver: any[] = []
  selectedReceiver: any
  selectedSecondsToAnswer = "20"
  userList: any[] = []

  filterNumbers = []

  filterSources = []

  constructor(
    private confirmationService: ConfirmationService,
    public route: ActivatedRoute,
    public api: ApiService,
    private messageService: MessageService,
    private location: Location,
    private router: Router,
    public store: StoreService,
    public phoneFormatPipe: PhoneFormatPipe
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

    this.id = this.route.snapshot.params.id;
    if (this.route.snapshot.queryParamMap.get('from')) {
      this.goingFrom = this.route.snapshot.queryParamMap.get('from');
      setTimeout(() => {
        this.tabIndex = 1
      }, 100)
    }

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "TrackingNumbers") {
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

    await this.api.getAllReceivingNumbers().subscribe(async (res) => {
      this.receivingNumbers = res.body
      this.receivingNumbers.forEach((item: any) => {
        let n = item.number;
        // if (n.length==11) {
        //   n = n.substring(0,1) + " ("+ n.substring(1,4) + ") " + n.substring(4,7) + "-" + n.substring(7,11)
        // } else if (n.length==10) {
        //   n = "("+ n.substring(0,3) + ") " + n.substring(3,6) + "-" + n.substring(6,10)
        // }
        item.label = this.phoneFormatPipe.transform(n) // this.getFormattedPhoneNumber(n)
      })

      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        this.receivingNumbers = this.receivingNumbers.filter((item) => item.customerId == this.store.getUser().customerId)
      }

      this.receivingNumbers.sort((a, b) => {
        if (a.number > b.number)
          return 1;
        else if (a.number < b.number)
          return -1;

        return 0
      })

      await this.api.getAllUserList().subscribe(res => {
        this.userList = res
        this.userList.map(item => item.label = item.firstName + ' ' + item.lastName + " (" + item.Customer?.companyName + ")")
      })

      if (this.store.getUserType() == CMSUserType.superAdmin) {
        await this.api.getAllCustomerList().subscribe(res => {
          this.customerList = res;
          // this.updateFilteredTrackingSources();
        })

      } else {
        this.customerList.push(this.store.getUser().Customer)
      }


      try {
        await this.api.getDetailById(this.route.snapshot.params.id)
          .pipe(tap(async data => {

            this.dialNumbers = data.ReceivingNumber?.number ? [{
              id: 0, number: data.ReceivingNumber?.number,
              schedule: null
            }] : []

            this.data = data
            if (data.routing_action) {
              if (data.routing_action == RoutingActionEnum.ForwardTo.key)
                this.selectedRoutingAction = RoutingActionEnum.ForwardTo
              else if (data.routing_action == RoutingActionEnum.RemapForwardTo.key)
                this.selectedRoutingAction = RoutingActionEnum.RemapForwardTo
              // else if (data.routing_action == RoutingActionEnum.DialAgent.key)
              //   this.selectedRoutingAction = RoutingActionEnum.DialAgent
              else if (data.routing_action == RoutingActionEnum.HangUp.key)
                this.selectedRoutingAction = RoutingActionEnum.HangUp
            } else {
              this.selectedRoutingAction = RoutingActionEnum.NotMapped
            }

            if (data.ReceivingNumber) {
              await this.filterReceivingNumberForInitial(data.ReceivingNumber.id)
            }

            if (data.SipGateways)     {
              this.selectedSipGateway = data.SipGateways;
            }

            this.originCustomerId = data.customerId
            this.selectedSource = data.TrackingSources
            this.selectedCustomer = data.Customer
            this.selectedDescription = data.description

            if (data.failsafe_number != null) {
              this.filterTrackingNumberForInitial(data.failsafe_number)
            }

            if (data.agent_timeout != null)
              this.selectedSecondsToAnswer = data.agent_timeout + ""

            if (data.agent_id != null)
              this.filterSenderForInitial(data.agent_id)

            if (data.failover_agent_id != null)
              this.filterReceiverForInitial(data.failover_agent_id)

            if (this.store.getUserType() !== CMSUserType.superAdmin && this.store.getUser().customerId !== data.customerId) {
              this.showWarn('You have no permission for this tracking number')
              await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); })
              this.location.back();
            }

            this.store.addTrackingNumber(this.data.tracking_number)
            // Call update filtered tracking sources again
            // this.updateFilteredTrackingSources();
          })).toPromise();

        await this.api.getSipGateways('order', 'asc', 1, 1000, '', null).pipe(tap(res => {
          this.sipGateways = res.body
        }), catchError((_) => {
          return of(0);
        })).toPromise();

      } catch (e) {
      }
    })
  }

  /**
   *
   * @param msg
   */
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }

  /**
   *
   */
  getSources = () => {
    let filter = {}
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      filter = {
        where: {
          customerId: this.store.getUser().customerId
        }
      };
    }
    return this.api.getSourcesByFilter(filter)
      .pipe(tap(res => {
        this.sources = res;

        // when source is retrieved,
        // this.updateFilteredTrackingSources();
      }), catchError((_) => {
        return of(0);
      })).toPromise();
  }

  /**
   * this is called at changing tag input field
   * @param event tag list input field
   */
  onChangeTag = (event: Event) => {
    this.data.number_tags = (event.target as HTMLInputElement).value;
  }

  /**
   * Show Confirmation Popup before Tracking Number Release
   */
  confirmDeletion() {
    this.confirmationService.confirm({
      message: 'Are you sure to release number?',
      header: 'Tracking Number Release',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.onDeleteNumber();
      },
      reject: () => {
        this.showWarn("Number release cancelled.")
      },
      key: "trackingRelease"
    });
  }

  /**
   * this is called at clicking Release Tracking Number button
   */
  onDeleteNumber = async () => {
    // remove tracking number
    this.blockContent = true
    let payload = { number: JSON.stringify(this.data) };
    this.api.releaseProviderNumber(payload).subscribe(res => {
      this.blockContent = false
      this.isReleasing = false;
      this.showSuccess("Number successfully released.")
      this.goBack()
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
  }

  onChangeCustomer = (event) => {
    const newCustomerId = parseInt(event.value.id);
    this.data.customerId = newCustomerId;
    this.data.Customer.id = newCustomerId;
    // this.updateFilteredTrackingSources();

    this.filterSourceForCustom(this.selectedSource?.name)
  }

  /** Why this shitty method
  updateFilteredTrackingSources = () => {
    this.filteredSources = this.sources.filter(src => {
       return src.customerId === this.data?.customerId ?? 0;
    });

    // Set to the first tracking source id of the list.
    if (this.filteredSources.length) {
      this.data.tracking_sourceId = this.filteredSources[0].id;
      this.data.TrackingSources.id = this.filteredSources[0].id;
    } else {
      this.data.tracking_sourceId = undefined;
    }
  }
  *(

  )
  /**
   * this is called at changing source field
   * @param event source select field
   */
  onChangeSource = (event) => {
    console.log(event)
    // const newSourceId = parseInt(event.value.id);
    // this.data.tracking_sourceId = newSourceId;
    // this.data.TrackingSources.id = newSourceId;
  }

  onUpdateCallLogChange = (event) => {
    if (this.data) {
      this.data.update_call_logs = event.checked;
    }
  }

  /**
   * this is called at clicking save button
   */
  saveChange = async (tab) => {
    // if (tab == 'general') {
    if (this.selectedSource?.id) {
      this.data.tracking_sourceId = this.selectedSource.id;
      if (this.data.TrackingSources)
        this.data.TrackingSources.id = this.selectedSource.id;
    } else {
      this.showWarn("Please specify the tracking source or select customer with tracking sources")
      return;
    }

    if (!this.data.tracking_sourceId) {
      this.showWarn("Please specify the tracking source or select customer with tracking sources")
      return;
    }
    // } else if (tab == 'routing') {
    if (
      (this.selectedRoutingAction != null) &&
      (this.selectedReceivingNumber == null) &&
      (this.selectedRoutingAction.key == RoutingActionEnum.RemapForwardTo.key)
    ) {
      this.showWarn("Please specify the receiving number")
      return;
    }

    /* if (
       (this.selectedRoutingAction != null)
       // && (this.selectedRoutingAction.key == RoutingActionEnum.DialAgent.key)
     ) {
       if (this.selectedSender?.id == null) {
         this.showWarn("Please select agent")
         return
       }

       // if (this.selectedSecondsToAnswer == null || this.selectedSecondsToAnswer == "") {
       //   this.showWarn("Please input seconds to answer")
       //   return
       // }
       //
       // if (this.selectedReceiver?.id == null) {
       //   this.showWarn("Please select agent if no answer")
       //   return
       // }
     }*/
    // } else if (tab == 'failsafe') {
    //   if (this.selectedFailSafeNumber==null || this.selectedFailSafeNumber?.id==null) {
    //     this.showWarn("Please specify the failsafe number")
    //     return;
    //   }
    // }

    // if (tab == 'general') {
    this.data.description = this.selectedDescription
    // }

    // if (tab == 'routing') {

    this.data.routing_action = this.selectedRoutingAction.key

    if (this.selectedRoutingAction.key == RoutingActionEnum.ForwardTo.key)
      this.data.receiving_numberId = null
    else {
      this.data.receiving_numberId = this.selectedReceivingNumber ? this.selectedReceivingNumber.id : null
    }

    this.data.failover_agent_id = null
    this.data.agent_id = null
    this.data.agent_timeout = 0

    /*  if (this.selectedRoutingAction.key == RoutingActionEnum.DialAgent.key) {
        this.data.agent_id = this.selectedSender?.id
        if (this.selectedReceiver!=null && this.selectedReceiver?.id)
          this.data.failover_agent_id = this.selectedReceiver?.id
        if (this.selectedSecondsToAnswer!=null && this.selectedSecondsToAnswer!="")
          this.data.agent_timeout = Number(this.selectedSecondsToAnswer)
      }*/

    if (this.data.ReceivingNumber)
      this.data.ReceivingNumber.id = this.data.receiving_numberId

    this.data.sip_gatewayId = null
    this.data.SipGateways = null

    this.data.sip_gatewayId = this.selectedSipGateway ? this.selectedSipGateway.id : null
    if (this.data.SipGateways)
      this.data.SipGateways.id = this.data.sip_gatewayId

    // if (tab == 'failsafe') {
    this.data.failsafe_number = this.selectedFailSafeNumber?.tracking_number?.replace(/\D/g, '');
    // }

    this.blockContent = true

    // save tracking number information
    this.api.saveDetailById(this.data, this.id).subscribe(data => {
      this.blockContent = false
      this.showSuccess('Updating Succeeded')
      this.goBack()
    }, err => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    });
  }

  goBack() {
    if (this.goingFrom == 'setup')
      this.router.navigateByUrl(RoutePath.tracking_number.setup)
    else
      this.router.navigateByUrl(RoutePath.tracking_number.numbers)
  }

  /**
   * convert the telephone number to masked number like 1 (xxx) xxx-xxxx
   * @param number telephone number
   * @returns
   */
  getMaskedNumber = (number) => {
    let maskedNumber = `1 (${number.substring(1, 4)}) ${number.substring(4, 7)}-${number.substring(7)}`
    return maskedNumber
  }

  filterSender(event) {
    let filtered: any[] = []
    let query = event.query.toLowerCase()

    this.userList.forEach(item => {
      if (item.label.toLowerCase().indexOf(query) > -1 && item.id != this.selectedReceiver?.id)
        filtered.push(item)
    })

    this.filteredSender = filtered
  }

  filterSenderForInitial(id) {
    let filtered: any[] = []

    this.userList.forEach(item => {
      if (item.id == id) {
        filtered.push(item)
        this.selectedSender = item
      }
    })

    this.filteredSender = filtered
    console.log("Sender", this.selectedSender)
  }

  filterReceiver(event) {
    let filtered: any[] = []
    let query = event.query.toLowerCase()

    this.userList.forEach(item => {
      if (item.label.toLowerCase().indexOf(query) > -1 && item.id != this.selectedSender?.id)
        filtered.push(item)
    })

    this.filteredReceiver = filtered
  }

  filterReceiverForInitial(id) {
    let filtered: any[] = []

    this.userList.forEach(item => {
      if (item.id == id) {
        filtered.push(item)
        this.selectedReceiver = item
      }
    })

    this.filteredReceiver = filtered
  }

  filterTrackingNumberForInitial(number) {
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      customerFilter = {
        customerId: this.selectedCustomer.id
      }
    }

    this.api.getTrackingNumbersForAutoComplete(number, customerFilter).subscribe(res => {
      this.filterNumbers = []
      res.body.forEach(item => {
        let number = item.tracking_number
        item.formatted_tracking_number = this.phoneFormatPipe.transform(number) // "(" + number.substring(0, 3) + ") " +number.substring(3, 6) + "-" + number.substring(6)
        this.filterNumbers.push(item)
        this.selectedFailSafeNumber = item
      })
    })
  }

  filterTrackingNumber(event) {
    let query = event.query.toLowerCase()

    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      customerFilter = {
        customerId: this.selectedCustomer?.id
      }
    }

    this.api.getTrackingNumbersForAutoComplete(query, customerFilter).subscribe(res => {
      this.filterNumbers = []
      res.body.forEach(item => {
        let number = item.tracking_number
        item.formatted_tracking_number = this.phoneFormatPipe.transform(number) // this.getFormattedPhoneNumber(number) // = "(" + number.substring(0, 3) + ") " +number.substring(3, 6) + "-" + number.substring(6)
        if (this.id != item.id)
          this.filterNumbers.push(item)
      })
    })
  }

  filterReceivingNumber(event) {
    let filtered: any[] = []
    let query = event.query.toLowerCase().replace(/\D/g, '').replace(/\(/g, '').replace(/-/g, '').replace(/\)/g, '');

    this.receivingNumbers.forEach(item => {
      if (item.label.toLowerCase().indexOf(query) > -1 && item.id != this.selectedReceivingNumber?.id) {
        if (this.store.getUserType() !== CMSUserType.superAdmin) {
          filtered.push(item)
        } else {
          if (item.customerId == this.selectedCustomer.id) {
            filtered.push(item)
          }
        }
      }
    })

    this.filteredReceivingNumbers = [...filtered]
  }

  filterReceivingNumberForInitial(id) {
    let filtered: any[] = []

    if (this.receivingNumbers) {
      this.receivingNumbers.forEach(item => {
        if (item.id == id) {
          filtered.push(item)
          this.selectedReceivingNumber = item
        }
      })
    }

    this.filteredReceivingNumbers = [...filtered]
  }


  filterSource(event) {
    let query = event.query.toLowerCase()

    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      if (this.selectedCustomer.id)
        customerFilter = {
          customerId: this.selectedCustomer.id
        }
    }

    this.api.getTrackingSourcesForAutoComplete(query, customerFilter).subscribe(res => {
      let exist = false
      this.filterSources = []
      res.data.forEach(item => {
        this.filterSources.push(item)
        if (item.id == this.selectedSource?.id)
          exist = true
      })

      if (!exist)
        this.selectedSource = null
    })
  }

  filterSourceForCustom(query) {
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    } else {
      if (this.selectedCustomer.id)
        customerFilter = {
          customerId: this.selectedCustomer.id
        }
    }

    this.api.getTrackingSourcesForAutoComplete(query, customerFilter).subscribe(res => {
      let exist = false
      this.filterSources = []
      res.data.forEach(item => {
        this.filterSources.push(item)
        if (item.id == this.selectedSource?.id)
          exist = true
      })

      if (!exist)
        this.selectedSource = null
    })
  }
}

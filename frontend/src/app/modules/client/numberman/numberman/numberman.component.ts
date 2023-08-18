import { Router } from '@angular/router';
import { Ratecenter } from './../../../../models/ratecenter';
import { Component, OnInit } from '@angular/core'
import { Location } from '@angular/common';
import { ApiService } from '@services/api/api.service'
import { NumberMan } from '@app/models/number-man'
import { trigger, transition, query, style, animate } from '@angular/animations'
import {MessageService, SelectItem} from 'primeng/api';
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY
} from '../../constant';
import { StoreService } from '../../../../services/store/store.service';

// @ts-ignore
import Countries from '../../../../../assets/data/countries.json';
import USCountries from '../../../../../assets/data/us-countries.json';

import { toBase64 } from './../../../../helper/utils';
import { FileUpload } from 'primeng/fileupload';
import { ConfirmationService } from 'primeng/api';
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-numberman',
  templateUrl: './numberman.component.html',
  styleUrls: ['./numberman.component.scss'],
  providers: [ConfirmationService],
  animations: [
  ]
})

export class NumberManComponent implements OnInit {

  cmsUserType = CMSUserType;

  isLoading = false;
  lookupEnabled = false;

  item: string;
  items: SelectItem[];

  types: any[] = [
    {name: 'Local', code: 'local'},
    {name: 'Toll Free', code: 'toll'},
  ];
  selectedType: any = "";

  lookupFilters: any[] = [];

  selectedLookupFilter: any = {name: 'Contains', code: 'contains'};

  limit: number = 10;
  lookupNumber: string = "";
  numbers: NumberMan[] = [];
  reservedNumbers: NumberMan[] = [];
  selectedNumbers: NumberMan[] = [];

  countries: any = [];
  selectedCountry: any;
  filteredCountries: any[];

  filteredRatecenters: any[];
  selectedRateCenter: Ratecenter;
  ratecenters: Ratecenter[] = [];

  filteredTollSuffixes: any[];
  tollsuffixes: any[] = [];
  selectedTollSuffix: any = {suffix: 'any'};

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  localdid: number = 0.00;
  localdid_fee: number = 0.00;
  tollfree: number = 0.00;
  tollfree_fee: number = 0.00;

  blockContent = false

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    public api: ApiService, public store: StoreService,
    private messageService: MessageService, private location: Location
  ) {}

  async ngOnInit() {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          this.handleCustomerSettings();
          resolve();
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility()

      this.permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "NumbersManagement") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: "You have no permission for this page" });
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

  }

  getProviderNumberList(): Promise<void> {
    if(!this.lookupEnabled) return;

    if(!this.selectedType)
      this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: 'Invalid parameter selected for lookup' });

    return new Promise(async resolve => {


      // Build main lookup filter string
      let filter = "limit=" + this.limit + "&type=" + this.selectedType.toLowerCase();

      if(this.selectedType.toLowerCase() == 'local' || this.selectedType.toLowerCase() == 'intl') {
        if(this.selectedCountry && this.selectedCountry.code.length > 0)
          filter += "&state=" + this.selectedCountry.code.toLowerCase();
      }

      if(this.selectedType.toLowerCase() == 'local') {
        if(this.selectedRateCenter && this.selectedRateCenter.rate_center.length > 0)
          filter += "&ratecenter=" + this.selectedRateCenter.rate_center;

        // Get NPA (Area Code) if any
        if(this.lookupNumber.length >= 3)
          filter += "&npa=" + this.lookupNumber.slice(0, 3);

        // Get NPX (Prefix) if any
        if(this.lookupNumber.length >= 6)
          filter += "&nxx=" + this.lookupNumber.slice(3, 6);

        // Get Number (Subscriber) if any
        if(this.lookupNumber.length > 6)
          filter += "&number=" + this.lookupNumber.slice(6);

      } else if(this.selectedType.toLowerCase() == 'toll') {
        let number = "";
        let suffix = "";
        let lookup = "";

        if(this.selectedTollSuffix && this.selectedTollSuffix.suffix.length > 0 && this.selectedTollSuffix.suffix != "any")
          suffix = this.selectedTollSuffix.suffix

        if(this.lookupNumber && this.lookupNumber.length > 0)
          lookup = this.lookupNumber;

        if(this.selectedLookupFilter && this.selectedLookupFilter.code.length > 0) {
          if(this.selectedLookupFilter.code == 'starts')
            number = (this.selectedTollSuffix.suffix == "any") ? lookup + "%" : suffix + lookup + "%";
          else if(this.selectedLookupFilter.code == 'contains')
            number = (this.selectedTollSuffix.suffix == "any") ? "%" + lookup + "%" : suffix + "%" + lookup + "%";
          else if(this.selectedLookupFilter.code == 'ends')
            number = (this.selectedTollSuffix.suffix == "any") ? "%" + lookup : suffix + "%" + lookup;
        }

        filter += "&number=" + number;
      }

      this.api.getProviderNumbersList(filter).subscribe((data) => {
        if(data.length <= 0) {
          this.showWarn('Provider returned no data for this lookup.')
          return;
        }

        // Fill in the numbers
        this.numbers = data;

      }, e => {
        this.showError('Provider error: ' + e)
      });
    });
  }

  /**
   * Show Confirmation Popup before buy numbers
   */
   confirmPurchase() {
     if (this.selectedNumbers.length==0)
       return;

    let total: number = 0;
    let content: string =
      "<div class=\"grid\">" +
      " <div class=\"col-12\">" +
      " <table id=\"confirm-order-form\" class=\"table\">" +
      "  <tbody>";

      this.selectedNumbers.forEach(number => {
        let charge: string = (number.type == "toll") ? this.tollfree.toString() : this.localdid.toString();
        let tmp: any =
        "    <tr class=\"row buy-number\" data-number=\"" + number.number.toString() + "\">" +
        "      <td class=\"col-md-8 friendly number\" data-col=\"number\">" +
        "        <div class=\"column-area\" style=\"padding-left:20px;min-height:30px;position:relative\">" +
        "          <b class=\"buy-number-digits\">" + this.formatUSPhoneNumber(number.number) + "</b>" +
        "          <br><small class=\"full-number\" style=\"color:#888\">" + number.name + "</small>" +
        "        </div>" +
        "      </td>" +
        "      <td class=\"col-md-4\" style=\"text-align:right\">" +
        "          <b class=\"price\">$" + charge + "</b>" +
        "          <small>/ month</small>" +
        "      </td>" +
        "    </tr>";

        // Appending number to content
        content += tmp;

        // Sum total to charge -- TODO should I charge fee also?
        total += (number.type == 'toll') ? this.tollfree : this.localdid;
      });

      content +=
      "  </tbody>" +
      "  <tfoot>" +
      "    <tr class=\"row\">" +
      "      <th class=\"col-md-8\"></th>" +
      "      <th class=\"col-md-4\" style=\"text-align:right\"><h4>Order Total: $" + total.toFixed(2) + " / month </h4> </th>" +
      "    </tr>" +
      "  </tfoot>" +
      " </table>" +
      " </div>" +
      "</div>";

    let blocked: boolean = false;
    const user = this.store.getUser();
    if(total > user.Customer.balance) blocked = true;

    this.confirmationService.confirm({
      message: content,
      header: 'Order Confirmation',
      acceptIcon: (blocked) ? 'pi pi-money-bill' : 'pi pi-check',
      acceptLabel: (blocked) ? 'Recharge' : 'Purchase',
      accept: () => {
        if(!blocked) {
          this.buyProviderNumbers();
        } else {
          this.showWarn('Insufficient Balance')
        }
      },
      reject: () => {
        this.showWarn("Purchase cancelled.")
      },
      key: "purchaseDialog"
    });
  }

  formatUSPhoneNumber(str) {
    let cleaned = ('' + str).replace(/\D/g, '');
    let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match)
      return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    else {
      match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
      if (match)
        return '(' + match[2] + ') ' + match[3] + '-' + match[4]
    }

    return null
  };

   gotoNumberSetupPage() {
     this.showSuccess('Numbers correctly reserved.')
     this.router.navigateByUrl(RoutePath.tracking_number.setup)
   }

  buyProviderNumbers(): Promise<void> {
    return new Promise(async resolve => {
      this.blockContent = true
      this.api.reserveProviderNumbers({numbers: JSON.stringify(this.selectedNumbers)}).subscribe((data) => {
        this.blockContent = false
        let numbers: any[] = [...this.selectedNumbers]
        numbers.map((item) => {
          if (item.type=="local") {
            if (item.number?.length==11)
              item.number = item.number.substring(1)
            else if (item.number?.length==12)
              item.number = item.number.substring(2)
          }
        })

        this.store.setReservedNumber(numbers);
        this.api.getCustomerBalance().subscribe(balance => {
          if (balance) {
            this.store.setBalance(balance.balance);
          }
          this.gotoNumberSetupPage();
        }, error => {
          this.gotoNumberSetupPage();
        });

//        this.clearForm();
      }, e => {
        this.blockContent = false
        this.showError('Unable to reserve numbers: ' + e)
      }, () => {
        this.blockContent = false
      });
    });
  }

  onTypeChange(event) {
    let seltype = event;
    if(!seltype) {
      this.lookupEnabled = false;
      return;
    }

    this.selectedType = event

    this.lookupNumber = "";
    this.selectedCountry = null;
    this.selectedRateCenter = null;
    this.filteredCountries = null;
    this.filteredRatecenters = null;

    if(seltype == 'local') {
        this.countries = USCountries;

    } else if(seltype == 'toll') {
      let filter = "type=toll";

      this.api.getProviderNumbersListBySuffix(filter).subscribe((data) => {
        if(data.length <= 0) {
          this.showWarn('Provider returned no data for this lookup.')
          return;
        }

        // Fill in the numbers
        this.tollsuffixes = data;

      }, e => {
        this.showError('Provider error: ' + e)
      });
    } else {
      this.countries = Countries;
    }

    this.lookupButtonEvaluate();
  }

  onLookupKeypress(event: KeyboardEvent) {
    if (event.key === 'Tab' || event.key === 'TAB') {
        return;
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].indexOf(event.key) === -1) {
        event.preventDefault();
    }
  }

  onLookupPaste(event: ClipboardEvent) {
    event.preventDefault();
    let pastedText: string = event.clipboardData.getData('text');
    pastedText = pastedText.replace(/\D/g, '');
    this.lookupNumber = pastedText;
    return pastedText;
  }

  onSelectedCountry(event) {
    // Retrieve rate centers if local numbering is selected
    if(this.selectedType && this.selectedType == 'local') {
      this.api.getRatecenters(event.code).subscribe((data) => {
        if(data.length <= 0) {
          this.showWarn('Provider returned no data for this lookup.')
          return;
        }

        // Nullify previously selected ratecenter
        this.selectedRateCenter = null;

        // Fill in retrieved rate centers
        this.ratecenters = [];
        data.forEach(ratecenter => {
          this.ratecenters.push(ratecenter);
        });

      }, e => {
        this.showError('Provider error: ' + e)
      });
    }

    this.lookupButtonEvaluate();
  }

  onSelectTollSuffix(event) {
    this.lookupButtonEvaluate();
  }

  onSelectedRatecenter(event) {
    this.lookupButtonEvaluate();
  }

  onNumberReserve(number) {
    this.reservedNumbers.push(number);
    this.reservedNumbers = Array.from(this.reservedNumbers.reduce((m, t) => m.set(t.number, t), new Map()).values());
  }

  onNumberRelease(number) {
    this.reservedNumbers = this.reservedNumbers.filter(n => n.number != number.number);
    this.selectedNumbers = this.selectedNumbers.filter(n => n.number != number.number);
  }

  filterCountry(event) {
    let filtered : any[] = [];
    let query = event.query;

    for(let i = 0; i < this.countries.length; i++) {
        let country = this.countries[i];
        if (country.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
            filtered.push(country);
        }
    }

    this.filteredCountries = filtered;
    this.lookupButtonEvaluate();
  }

  filterRatecenter(event) {
    let filtered : any[] = [];
    let query = event.query;

    for(let i = 0; i < this.ratecenters.length; i++) {
        let rc = this.ratecenters[i];
        if (rc.rate_center.toLowerCase().indexOf(query.toLowerCase()) == 0) {
            filtered.push(rc);
        }
    }

    this.filteredRatecenters = filtered;
    this.lookupButtonEvaluate();
  }

  filterType(event) {
    this.lookupFilters = [
      {name: 'Contains', code: 'contains'},
      {name: 'Starts with', code: 'starts'},
      {name: 'Ends with', code: 'ends'},
    ];
  }

  filterTollSuffixes(event) {
    let filtered : any[] = [{suffix: 'any'}];
    let query = event.query;

    for(let i = 0; i < this.tollsuffixes.length; i++) {
        let toll = this.tollsuffixes[i];
        if (toll.suffix.toLowerCase().indexOf(query.toLowerCase()) == 0) {
            filtered.push(toll);
        }
    }

    this.filteredTollSuffixes = filtered;
    this.lookupButtonEvaluate();
  }

  lookupButtonEvaluate() {
    if(
      (this.selectedType == "local" && this.selectedCountry && this.selectedCountry.hasOwnProperty('code') && this.selectedCountry.code.length > 0 && this.selectedRateCenter && this.selectedRateCenter.hasOwnProperty('rate_center') && this.selectedRateCenter.rate_center.length > 0) ||
      (this.selectedType == "intl" && this.selectedCountry && this.selectedCountry.hasOwnProperty('code') && this.selectedCountry.code.length > 0) ||
      (this.selectedType == "toll")
    ) {
      this.lookupEnabled = true;
    } else {
      this.lookupEnabled = false;
    }
  }

  onImportNumbers = async (event: any, uploader: FileUpload) => {
    var encoded_file = null;
    encoded_file = await toBase64(event.files[0]);
    encoded_file = encoded_file.split(',')[1]
    uploader.clear();

    this.blockContent = true
    this.api.bulkNumberProvUpload({
      encoded_file: encoded_file,
      file_extension: 'csv'
    }).subscribe(res => {
      this.blockContent = false
      this.showSuccess("File " + event.files[0].name + " correctly uploaded.")
    }, (e) => {
      this.blockContent = false
      this.showError("Error uploading file.")
    }, () => {
      this.blockContent = false
    });

  }

  handleCustomerSettings() {
    let customer = this.store.getUser().Customer;
    if(customer != null) {
      let settings = JSON.parse(customer.settings);

      if (settings.hasOwnProperty("localdid") && settings.localdid != undefined) {
        this.localdid = settings.localdid;
      }

      if (settings.hasOwnProperty("localdid_fee") && settings.localdid_fee != undefined) {
        this.localdid_fee = settings.localdid_fee;
      }

      if (settings.hasOwnProperty("tollfree") && settings.tollfree != undefined) {
        this.tollfree = settings.tollfree;
      }

      if (settings.hasOwnProperty("tollfree_fee") && settings.tollfree_fee != undefined) {
        this.tollfree_fee = settings.tollfree_fee;
      }
    } else {
      // Revert to default values
      this.localdid = 2.00;
      this.tollfree = 3.00;
    }
  }

  clearForm() {
    this.numbers = [];
    this.reservedNumbers = [];
    this.selectedNumbers = [];
    this.lookupNumber = "";
    this.selectedType = null;
    this.selectedCountry = null;
    this.selectedRateCenter = null;
    this.filteredCountries = [];
    this.filteredRatecenters = [];
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
}

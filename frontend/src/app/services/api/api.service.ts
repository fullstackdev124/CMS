import { HttpClient, HttpResponse, HttpParams, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import {
  callLogKeys,
  getFilter,
  getCountWhere,
  receivingNumberKeys,
  sipGatewayKeys,
  trackingKeys,
  userKeys,
  getParamsForFilter,
  callLogKeysForSupport,
  customerKeys, roleKeys
} from '@app/helper/utils'
import { Observable } from 'rxjs'
import {map, tap, timeout} from 'rxjs/operators'
import { StoreService } from '../store/store.service'
import { ICustomer, IRole, IUser, IUserLogin, IUserToken } from 'src/app/models/user'
import {
  ITicket,
  ITicketAsset,
  ITicketAttachment,
  ITicketNotification,
  ITicketObserver,
  ITicketOwner,
  IticketState,
  ITicketVersion
} from 'src/app/models/tickets'
import { IService } from 'src/app/models/service'
import { Country, GetNumbers, GetSources } from 'src/app/models/tracking_numbers'
import {
  CallLog,
  CallLogSupport,
  CallRecording,
  LightLog,
  PhoneBook,
  LogsCount,
  IBlacklistNumber
} from 'src/app/models/callLog'
import { ReceivingNumber } from 'src/app/models/receiving-number'
import { SipGateways } from '@app/models/sip-gateway'
import { GuiPermission, GuiSection, GuiVisibility } from '@app/models/gui'
import { RoutingAction } from '../../models/routing-action';
import { trackingSourceKeys } from '../../helper/utils';
import {environment} from "@env/environment";

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private coreApi: string;

  constructor(private http: HttpClient, private store: StoreService) {
    this.coreApi = environment.api.core.uri + environment.api.core.path
  }

  public setBasePath(env) {
    this.coreApi = env.api.core.uri + env.api.core.path
  }

  public login(data: IUserLogin, rememberedIf: boolean): Observable<object> {
    return this.http.post<IUserToken>(`${this.coreApi}/DashUsers/authenticate`, data).pipe(
      tap(token => this.store.storeToken({ ...token, rememberedIf })),
      map(token => token)
    );
  }

  public retrieveLoggedUserOb(token: IUserToken): Observable<IUser> {
    return this.getUser(token.userId).pipe(tap(user => {
      this.store.storeUser(user);
    }));
  }

  public retrieveLoggedUser(token: IUserToken): Promise<void> {
    return new Promise(resolve => {
      this.getUser(token.userId).subscribe(
        user => this.store.storeUser(user),
        (err) => {
        },
        () => {

          resolve()
        }
      );
    })
  }

  public logout(): Observable<any> {
    return this.http.post(`${this.coreApi}/DashUsers/logout`, null);
  }

  public accountActivate(token): Observable<any> {
    return this.http.get(`${this.coreApi}/DashUsers/activate/token=${token}`);
  }

  public getCanI(data): Observable<any> {
    return this.http.post(`${this.coreApi}/DashUsers/cani`, data);
  }

  getUser(id: number): Observable<IUser> {
    const url = `${this.coreApi}/DashUsers/${id}`;
    return this.http.get<IUser>(url).pipe(timeout(5000));
  }

  updateUser(data: IUser): Observable<IUser> {
    return this.http.patch<IUser>(`${this.coreApi}/DashUsers/${data.id}`, data);
  }

  updateUserRole(userId: number, roleId: number): Observable<IUser> {
    return this.http.post<any>(`${this.coreApi}/DashUsers/${userId}/role`, { role_id: roleId });
  }

  updateUserPassword(userid: number, newPassword: string): Observable<any> {
    const data = {
      id: userid,
      password: newPassword
    };
    return this.http.patch<IUser>(`${this.coreApi}/DashUsers/${userid}`, data);
  }

  accountReset(userid: number): Observable<any> {
    return this.http.get<boolean>(`${this.coreApi}/DashUsers/${userid}/account-reset`);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/DashUsers/forgot-password`, { email: email });
  }

  getUsers(filter?: string): Observable<IUser[]> {
    let url = `${this.coreApi}/DashUsers`;
    if (filter && filter.length > 0) {
      url += filter;
    }
    return this.http.get<IUser[]>(url);
  }

  getSeveralUsers(strUserIds?: string): Observable<IUser[]> {
    let url = `${this.coreApi}/DashUsers/several_user`;

    return this.http.post<any>(`${this.coreApi}/DashUsers/several_user`, { ids: strUserIds });
  }

  /**
   *  get Total count of users
   */
  // tslint:disable-next-line: max-line-length
  getUserCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, userKeys, customerFilter);
    return this.http.get<any>(`${this.coreApi}/DashUsers/count?${'where=' + whereParam}`);
  }

  getRolesByFilter(filter?: String): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/DashRoles?filter=${filter}`)
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/DashRoles`);
  }

  /**
   *  get Total count of roles
   */
  // tslint:disable-next-line: max-line-length
  getRoleCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, roleKeys, customerFilter);
    return this.http.get<any>(`${this.coreApi}/DashRoles/count?${'where=' + whereParam}`);
  }

  addUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/DashUsers`, data);
  }

  isUserUnique(attribute: string, value: string): Observable<any> {
    return this.http.post<boolean>(`${this.coreApi}/DashUsers/isunique`, { column: attribute, pattern: value });
  }

  /* ========= */
  /* CUSTOMERS */
  /* ========= */

  // tslint:disable-next-line: max-line-length
  getCustomersList(active: string, direction: string, page: number, size: number, filterName: string, filterValue: string): Observable<ICustomer[]> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, customerKeys);
    const url = `${this.coreApi}/Customers?${filter !== 'filter=' ? filter + '&' : ''}`;
    return this.http.get<ICustomer[]>(url);
  }

  /**
   *  get Total count of customers
   */
  // tslint:disable-next-line: max-line-length
  getCustomerCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, customerKeys  , customerFilter);
    return this.http.get<any>(`${this.coreApi}/Customers/count?${'where=' + whereParam}`);
  }

  addCustomer(data: ICustomer): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/Customers`, data);
  }

  getCustomer(id: number): Observable<ICustomer> {
    const url = `${this.coreApi}/Customers/${id}`;
    return this.http.get<ICustomer>(url);
  }

  updateCustomer(data: ICustomer): Observable<ICustomer> {
    // return this.http.put<ICustomer>(`${this.coreApi}/Customers/${data.id}`, data);
    return this.http.put<ICustomer>(`${this.coreApi}/Customers`, data);
  }

  deleteCustomerById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/Customers/${id}`);
  }

  getAllCustomerList(): Observable<ICustomer[]> {
    const url = `${this.coreApi}/Customers`;
    return this.http.get<ICustomer[]>(url);
  }

  getCustomerBalance(): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/PaymentMethods/balance`);
  }

  hasPrimaryMethod(): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/PaymentMethods/has_primary_method`);
  }

  purchaseCustomer(data: ICustomer, amount: number, description: string): Observable<any> {
    // return this.http.put<ICustomer>(`${this.coreApi}/Customers/${data.id}`, data);
    return this.http.put<any>(`${this.coreApi}/Customers/charge_wallet`, {customerId: data.id, amount: amount, description: description});
  }

  refundTransaction(data: ICustomer, transactionId: number, amount: number): Observable<any> {
    // return this.http.put<ICustomer>(`${this.coreApi}/Customers/${data.id}`, data);
    return this.http.put<any>(`${this.coreApi}/PaymentMethods/refund`, {customerId: data.id, transactionId, amount});
  }

  invoiceTransaction(data: ICustomer, transactionId: number): Observable<any> {
    // return this.http.put<ICustomer>(`${this.coreApi}/Customers/${data.id}`, data);
    return this.http.put<any>(`${this.coreApi}/PaymentMethods/invoice`, {customerId: data.id, transactionId});
  }

  /* ========= */
  /* LANGUAGES */

  /* ========= */

  getLanguages(): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/Languages?filter[order]=name`);
  }

  /* ======= */
  /* TICKETS */

  /* ======= */

  getTickets(filters: string = ''): Observable<ITicket[]> {
    return this.http.get<ITicket[]>(`${this.coreApi}/tickets${filters}`);
  }

  getTicket(id: number): Observable<ITicket> {
    return this.http.get<ITicket>(`${this.coreApi}/tickets/${id}`);
  }

  addTicket(ticket: ITicket): Observable<ITicket> {
    return this.http.post<ITicket>(`${this.coreApi}/tickets`, ticket);
  }

  getLatestVersion(ticketId: number): Observable<ITicketVersion> {
    return this.http.get<ITicketVersion>(`${this.coreApi}/versions/latest?tid=${ticketId}&`);
  }

  getTicketVersions(id: number): Observable<ITicketVersion[]> {
    return this.http.get<ITicketVersion[]>(`${this.coreApi}/tickets/${id}/versions`);
  }

  getTicketVersion(ticketId: number, versionId: number): Observable<ITicketVersion> {
    return this.http.get<ITicketVersion>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}`);
  }

  updateTicketVersion(ticketId: number, version: ITicketVersion): Observable<ITicketVersion> {
    return this.http.post<ITicketVersion>(`${this.coreApi}/tickets/${ticketId}/versions`, version);
  }

  getTicketOwner(ticketId: number, versionId: number): Observable<ITicketOwner> {
    return this.http.get<ITicketOwner>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/owner`);
  }

  getTicketState(ticketId: number, versionId: number): Observable<IticketState> {
    return this.http.get<IticketState>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/state`);
  }

  getTicketAssets(ticketId: number, versionId: number): Observable<ITicketAsset[]> {
    return this.http.get<ITicketAsset[]>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/assets`);
  }

  getTicketAsset(ticketId: number, versionId: number, assetId: number): Observable<ITicketAsset> {
    return this.http.get<ITicketAsset>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/assets/${assetId}`);
  }

  getTicketAttachments(ticketId: number, versionId: number): Observable<ITicketAttachment[]> {
    return this.http.get<ITicketAttachment[]>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/attachments`);
  }

  getTicketAttachment(ticketId: number, versionId: number, attachId: number): Observable<ITicketAttachment> {
    return this.http.get<ITicketAttachment>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/attachments/${attachId}`);
  }

  addAttachment(n: ITicketAttachment, ticketId: number): Observable<ITicketAttachment> {
    return this.http.post<ITicketAttachment>(`${this.coreApi}/tickets/${ticketId}/versions/${n.versionId}/attachments`, n);
  }

  getTicketNotifications(ticketId: number, versionId: number): Observable<ITicketNotification[]> {
    return this.http.get<ITicketNotification[]>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/notifications`);
  }

  addNotification(n: ITicketNotification, ticketId: number): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/tickets/${ticketId}/versions/${n.versionId}/notifications`, n);
  }

  getTicketNotification(ticketId: number, versionId: number, notifId: number): Observable<ITicketNotification> {
    return this.http.get<ITicketNotification>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/notifications/${notifId}`);
  }

  getTicketObservers(ticketId: number, versionId: number, filters?: string): Observable<ITicketObserver[]> {
    let uri = `${this.coreApi}/tickets/${ticketId}/versions/${versionId}/observers`;
    if (filters) {
      uri += `?${filters}&`;
    }
    return this.http.get<ITicketObserver[]>(uri);
  }

  observeTicket(ticketId: number, versionId: number, userId: number): Observable<ITicketObserver> {
    return this.http.post<ITicketObserver>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/observers`,
      { id: 0, versionId, userId }
    );
  }

  removeObservingTicket(ticketId: number, versionId: number, obId: number): Observable<ITicketObserver> {
    return this.http.delete<ITicketObserver>(`${this.coreApi}/tickets/${ticketId}/versions/${versionId}/observers/${obId}`);
  }

  countTicketByOwner(userId: number) {
    return this.http.get<{ count: number }>(`${this.coreApi}/tickets/count-by-owner?uid=${userId}&`);
  }

  countTicketByObserver(userId: number) {
    return this.http.get<{ count: number }>(`${this.coreApi}/tickets/count-by-owner?uid=${userId}&`);
  }

  countTicketByState(stateId: 1 | 2 | 3 | 4 | 5, userId: number) {
    return this.http.get<{ count: number }>(`${this.coreApi}/tickets/count-by-state?uid=${userId}&sid=${stateId}&`);
  }

  countTicketsObservers(ticketId: number, versionId: number) {
    return this.http.get<{ count: number }>(`${this.coreApi}/Tickets/${ticketId}/Versions/${versionId}/Observers/count`);
  }

  deleteTicket(ticketId: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Tickets/${ticketId}`);
  }

  deleteTicketsByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Tickets?where=${where}`);
  }

  getTicketsByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/tickets?filter=${filter}`);
  }

  /* ======== */
  /* SUBSCRIPTION */

  /* ======== */

  getSubscriptionsByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/Subscriptions?filter=${filter}`);
  }

  deleteSubscriptionById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Subscriptions/${id}`);
  }

  deleteSubscriptionsByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Subscriptions?where=${where}`);
  }

  /* ======== */
  /* SERVICE PROVIDERS */

  /* ======== */

  getServiceProvidersByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/ServiceProviders?filter=${filter}`);
  }

  deleteServiceProviderById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/ServiceProviders/${id}`);
  }

  deleteServiceProvidersByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/ServiceProviders?where=${where}`);
  }

  getProviderNumbersList(filter): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/NumberProviders/num_prov_lookup?${filter}`);
  }

  getProviderNumbersListBySuffix(filter): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/NumberProviders/suffix?${filter}`);
  }

  reserveProviderNumbers(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/NumberProviders/reserve?`, data);
  }

  releaseProviderNumber(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/NumberProviders/release?`, data);
  }

  getCountries(): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/NumberProviders/countries`);
  }

  getRatecenters(state): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/NumberProviders/ratecenter?state=${state}`);
  }

  /* ======== */
  /* DOCUMENTS */

  /* ======== */

  getDocumentsByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/Documents?filter=${filter}`);
  }

  deleteDocumentById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Documents/${id}`);
  }

  deleteDocumentsByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Documents?where=${where}`);
  }

  /* ======== */
  /* MAINTEINANCES */

  /* ======== */

  getMainteinancesByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/Mainteinances?filter=${filter}`);
  }

  deleteMainteinanceById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Mainteinances/${id}`);
  }

  deleteMainteinancesByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Mainteinances?where=${where}`);
  }

  /* ======== */
  /* ASSETS */

  /* ======== */

  getAssetsByFilter(filter: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.coreApi}/Assets?filter=${filter}`);
  }

  deleteAssetById(id: number): Observable<any> {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Assets/${id}`);
  }

  deleteAssetsByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Assets?where=${where}`);
  }

  /* ======== */
  /* ADDRESSEES */

  /* ======== */

  getAddressesByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/Addressees?filter=${filter}`);
  }

  deleteAddressesById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Addressees/${id}`);
  }

  deleteAddressesByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Addressees?where=${where}`);
  }

  /* ======== */
  /* OBSERVERS */

  /* ======== */

  getObserversByFilter(filter: string): Observable<any> {
    return this.http.get<{ count: number }>(`${this.coreApi}/Observers?filter=${filter}`);
  }

  deleteObserversById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Observers/${id}`);
  }

  deleteObserversByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/Observers?where=${where}`);
  }

  /* ======== */
  /* REDIS SUBSCRIPTIONS */

  /* ======== */

  getRedisSubscriptionsByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/RedisSubscriptions?filter=${filter}`);
  }

  deleteRedisSubscriptionById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/RedisSubscriptions/${id}`);
  }

  deleteRedisSubscriptionsByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/RedisSubscriptions?where=${where}`);
  }

  /* ======== */
  /* SERVICES */

  /* ======== */

  getServices(): Observable<IService[]> {
    return this.http.get<IService[]>(`${this.coreApi}/services`);
  }

  getService(id: number): Observable<IService> {
    return this.http.get<IService>(`${this.coreApi}/services/${id}`);
  }

  /**
   * get tracking sources
   */
  // tslint:disable-next-line: max-line-length
  getTrackingSources(active: string, direction: string, page: number, size: number, filterValue: string, customerFilter?: any): Observable<any> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, trackingSourceKeys, null, customerFilter);
    // return this.http.get<GetSources[]>(`${this.coreApi}/TrackingSources?${filter !== 'filter=' ? filter + '&' : ''}`);
    return this.http.get<any>(`${this.coreApi}/TrackingSources/tracking_sources?${filter !== 'filter=' ? filter + '&' : ''}`);
  }

  getTrackingSourcesForAutoComplete(filterValue: string, customerFilter?: any): Observable<any> {
    const filter = getFilter("", "", 10, 1, filterValue, null, null, trackingSourceKeys, null, customerFilter);
    // return this.http.get<GetSources[]>(`${this.coreApi}/TrackingSources?${filter !== 'filter=' ? filter + '&' : ''}`);
    return this.http.get<any>(`${this.coreApi}/TrackingSources/tracking_sources?${filter !== 'filter=' ? filter + '&' : ''}`);
  }

  getSourcesByFilter(filter): Observable<GetSources[]> {
    filter = 'filter=' + encodeURIComponent(JSON.stringify(filter))
    return this.http.get<GetSources[]>(`${this.coreApi}/TrackingSources?${filter !== 'filter=' ? filter + '&' : ''}`);
  }

  getAllSources(): Observable<GetSources[]> {
    return this.http.get<GetSources[]>(`${this.coreApi}/TrackingSources`);
  }

  downloadAllTrackingNumber(filterValue, customerFilter, sorting?): Observable<any> {
    let whereParam = getCountWhere(filterValue, null, null, trackingKeys, customerFilter)
    let url = `${this.coreApi}/OpNumbers/bulk_download?${'where=' + whereParam}`
    if (sorting && sorting!="")
      url += `&sorting=${sorting}`
    return this.http.get<any>(url);
  }

  downloadAllReceivingNumber(filterValue, customerFilter): Observable<any> {
    let whereParam = getCountWhere(filterValue, null, null, trackingKeys, customerFilter)
    return this.http.get<any>(`${this.coreApi}/ReceivingNumbers/bulk_download?${'where=' + whereParam}`);
  }

  downloadAllSipGates(filterValue, customerFilter): Observable<any> {
    let whereParam = getCountWhere(filterValue, null, null, trackingKeys, customerFilter)
    return this.http.get<any>(`${this.coreApi}/SipGateways/bulk_download?${'where=' + whereParam}`);
  }

  downloadAllTrackingSources(filterValue, customerFilter): Observable<any> {
    let whereParam = getCountWhere(filterValue, null, null, trackingKeys, customerFilter)
    return this.http.get<any>(`${this.coreApi}/TrackingSources/bulk_download?${'where=' + whereParam}`);
  }

  deleteSourcesByWhere(where: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/TrackingSources?where=${where}`);
  }

  /**
   *  get Total count of tracking numbers
   */
  getCount(filterName: string, filterValue: string): Observable<number> {
    // tslint:disable-next-line: max-line-length
    return this.http.get<number>(`${this.coreApi}/OpNumbers/count${(filterName && filterValue) ? ('?where[' + filterName + '][like]=%' + filterValue + '%&') : ''}`);
  }

  /**
   *  get Total count of tracking sources
   */
  // tslint:disable-next-line: max-line-length
  getSourcesCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, trackingSourceKeys, customerFilter);
    return this.http.get<any>(`${this.coreApi}/TrackingSources/tracking_sources/count?${'where=' + whereParam}`);
  }

  /**
   *  get number detail by id
   */
  getDetailById(id: number): Observable<GetNumbers> {
    return this.http.get<GetNumbers>(`${this.coreApi}/OpNumbers/${id}`);
  }

  /**
   *  save number detail by id
   */
  saveDetailById(data: GetNumbers, id: number): Observable<any> {
    /*
    if (isUpdatePastCalls) {
      return this.http.put<any>(`${this.coreApi}/OpNumbers/${id}/update`, data);
      // return this.http.put<any>(`${this.coreApi}/TrackingSources/${data.TrackingSources.id}/OpNumber/${id}`);
    } else {
      return this.http.post<any>(`${this.coreApi}/OpNumbers/${id}/replace`, data);
    }
    */
    return this.http.post<any>(`${this.coreApi}/OpNumbers/${id}/UpdateTrackingSource`, { ...data });
  }

  /**
   *  delete number detail by id
   *
   */
  deleteDetailById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/OpNumbers/${id}`);
  }

  /**
   *  delete number by filter string
   *
   */
  deleteOpNumbersByWhere(where: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/OpNumbers?where=${where}`);
  }

  /**
   *  get op numbers by filtering
   */
  getOpNumbersByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/OpNumbers?filter=${filter}`);
  }

  /**
   *  update customer id in the op number table
   * @param updateInfo json object
   */
  updateOpNumberCustomer(updateInfo: any): Observable<any> {

    const body = new HttpParams()
      .set('updateInfo', JSON.stringify(updateInfo));

    // tslint:disable-next-line: max-line-length
    return this.http.post(`${this.coreApi}/OpNumbers/updateCustomer`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  /**
   *  add new tracking number
   */
  addNumber(data: GetNumbers): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/OpNumbers`, data);
  }

  deleteUserById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/DashUsers/${id}`);
  }

  getUsersByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/DashUsers?filter=${filter}`);
  }

  deleteUsersByWhere(where: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/DashUsers?where=${where}`);
  }

  /**
   *  add new tracking source
   */
  addSource(data: GetSources): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/TrackingSources`, data);
  }

  /**
   *  edit tracking source
   */
  saveSourceById(data: GetSources): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/TrackingSources`, data);
  }

  /**
   *  get source detail by id
   */
  getSourceDetailById(id: number): Observable<GetSources> {
    return this.http.get<GetSources>(`${this.coreApi}/TrackingSources/${id}`);
  }

  /**
   *  delete source by id
   */
  deleteSourceById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/TrackingSources/${id}`);
  }

  /**
   *  update customer id in the tracking source table
   * @param updateInfo json object
   */
  updateTrackingSourceCustomer(updateInfo: any): Observable<any> {

    const body = new HttpParams()
      .set('updateInfo', JSON.stringify(updateInfo));

    // tslint:disable-next-line: max-line-length
    return this.http.post(`${this.coreApi}/TrackingSources/updateCustomer`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }


  // tslint:disable-next-line: max-line-length
  getLogsFromSupport(active: string, direction: string, page: number, size: number, filterValue: string, date1: string, date2: string, option: string, value?: string): Observable<HttpResponse<CallLogSupport[]>> {
    const filter = getFilter(active, direction, size, page, filterValue, date1, date2, callLogKeysForSupport, value);
    return this.http.get<CallLogSupport[]>(`${this.coreApi}/CallLogSupports?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  // tslint:disable-next-line: max-line-length
  async getLogsForCompare(active: string, direction: string, page: number, size: number, filterName: string, filterValue: string, date1: string, date2: string, option: string, value?: string) {
    const filter = getFilter(active, direction, size, page, filterValue, date1, date2, callLogKeys, value);
    // tslint:disable-next-line: max-line-length
    return await this.http.get<LightLog[]>(`${this.coreApi}/LightCallLogs?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' }).toPromise();
  }

  // tslint:disable-next-line: max-line-length
  getLightLogs(active: string, direction: string, page: number, size: number, filterName: string, filterValue: string, date1: string, date2: string, option: string, value?: string): Observable<HttpResponse<LightLog[]>> {
    const filter = getFilter(active, direction, size, page, filterValue, date1, date2, callLogKeys, value);
    return this.http.get<LightLog[]>(`${this.coreApi}/LightCallLogs?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  /**
   * get Call Recording
   */
  getCallRecording(id): Observable<CallRecording> {
    return this.http.get<CallRecording>(`${this.coreApi}/CallLogs/${id}/CallRecording`);
  }

  // delete call logs by filter string
  deleteCallLogsByWhere(where: string): Observable<any> {
    return this.http.delete<{ count: number }>(`${this.coreApi}/CallLogs?where=${where}`);
  }

  /**
   * get tracking numbers
   */
  // tslint:disable-next-line: max-line-length
  getTrackingNumbers(active: string, direction: string, page: number, size: number, filterValue: string, customFilters?: any): Observable<HttpResponse<GetNumbers[]>> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, trackingKeys, null, customFilters, "tracking_number,ReceivingNumber.number");

    // return this.http.get<GetNumbers[]>(
    //   `${this.coreApi}/OpNumbers?${filter !== 'filter=' ? filter + '&' : ''}`, {observe: 'response'}
    // );
    return this.http.get<GetNumbers[]>(
      `${this.coreApi}/OpNumbers/tracking_numbers?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' }
    );
  }

  getTrackingNumbersForAutoComplete(filterValue: string, customerFilter?: any): Observable<HttpResponse<GetNumbers[]>> {
    const filter = getFilter("", "", 10, 1, filterValue, null, null,  [
      'tracking_number',
    ], null, customerFilter);

    // return this.http.get<GetNumbers[]>(
    //   `${this.coreApi}/OpNumbers?${filter !== 'filter=' ? filter + '&' : ''}`, {observe: 'response'}
    // );
    return this.http.get<GetNumbers[]>(
      `${this.coreApi}/OpNumbers/tracking_numbers?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' }
    );
  }

  getTrackingNumbersWithCount(active: string, direction: string, page: number, size: number, filterValue: string, customerFilter?: any): Observable<HttpResponse<GetNumbers[]>> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, trackingKeys, null, customerFilter);

    // return this.http.get<GetNumbers[]>(
    //   `${this.coreApi}/OpNumbers?${filter !== 'filter=' ? filter + '&' : ''}`, {observe: 'response'}
    // );
    return this.http.get<GetNumbers[]>(
      `${this.coreApi}/OpNumbers/tracking_numbers_count?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' }
    );
  }

  /**
   *  get Total count of tracking numbers
   */
  // tslint:disable-next-line: max-line-length
  getTrackingNumberCount(filterValue: string, customFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, trackingKeys, customFilter, "tracking_number,ReceivingNumber.number");
    return this.http.get<any>(`${this.coreApi}/OpNumbers/tracking_numbers/count?${'where=' + whereParam}`);
  }

  // tslint:disable-next-line: max-line-length
  getUsersList(active: string, direction: string, page: number, size: number, filterName: string, filterValue: string): Observable<IUser[]> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, userKeys);
    const url = `${this.coreApi}/DashUsers?${filter !== 'filter=' ? filter + '&' : ''}`;
    return this.http.get<IUser[]>(url);
  }

  getAllUserList(): Observable<IUser[]> {
    const url = `${this.coreApi}/DashUsers`;
    return this.http.get<IUser[]>(url);
  }

  // Roles
  // tslint:disable-next-line: max-line-length
  getRolesList(active: string, direction: string, page: number, size: number, filterValue: string, customFilter?: any): Observable<IRole[]> {
    const filter = getFilter(active, direction, size, page, filterValue, null, null, roleKeys, null, customFilter);
    const url = `${this.coreApi}/DashRoles?${filter !== 'filter=' ? filter + '&' : ''}`;
    return this.http.get<IRole[]>(url);
  }

  getRole(id: number): Observable<IRole> {
    const url = `${this.coreApi}/DashRoles/${id}`;
    return this.http.get<IRole>(url);
  }

  updateRole(data: IRole): Observable<IRole> {
    return this.http.patch<IRole>(`${this.coreApi}/DashRoles/${data.id}`, data);
  }

  createRole(data): Observable<IRole> {
    return this.http.post<IRole>(`${this.coreApi}/DashRoles`, data);
  }

  getAssingedUsers(id: number): Observable<IUser[]> {
    return this.http.post<IUser[]>(`${this.coreApi}/DashRoles/AssociatedDashUsers`, { id });
  }

  deleteRoleById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/DashRoles/${id}`);
  }

  deleteRolesByWhere(where: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/DashRoles?where=${where}`);
  }

  deleteAllVisibilityByRoleId(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/DashRoles/${id}/GuiVisibilities`);
  }

  createRolePrincipal(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/DashRoles/${data.roleId}/principals`, { data });
  }

  // RoleMapping

  getRoleMappingByFilter(filter: string): Observable<any> {
    return this.http.get<any>(`${this.coreApi}/DashRoleMappings?filter=${filter}`);
  }

  updateRoleMapping(data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/DashRoleMappings/${data.id}`, data);
  }

  createRoleMapping(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/DashRoleMappings`, data);
  }

  deleteRoleMappingByWhere(where: string) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/DashRoleMappings?where=${where}`);
  }

  deleteRoleMappingById(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/DashRoleMappings/${id}`);
  }

  deleteAllUserRoleMapping(id: number) {
    return this.http.delete<{ count: number }>(`${this.coreApi}/DashUsers/${id}/DashRoleMapping`);
  }

  // GuiVisibility

  getGuiVisibilitiesByFilter(filter: string): Observable<GuiVisibility[]> {
    return this.http.get<GuiVisibility[]>(`${this.coreApi}/GuiVisibilities?filter=${filter}`);
  }

  updateGuiVisibility(data: any): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/GuiVisibilities`, { ...data });
  }

  createGuiVisibility(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/GuiVisibilities`, { ...data });
  }

  deleteGuiVisibilityByWhere(where: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/GuiVisibilities?where=${where}`);
  }

  // GuiSection

  getGuiSections(): Observable<GuiSection[]> {
    return this.http.get<GuiSection[]>(`${this.coreApi}/GuiSections`);
  }

  // GuiPermissions

  getGuiPermission(): Observable<GuiPermission[]> {
    return this.http.get<GuiPermission[]>(`${this.coreApi}/GuiPermissions`);
  }

  /**
   * Get Call Log By Id
   * @param id
   */
  getLogById(id: number): Observable<CallLog> {
    return this.http.get<CallLog>(`${this.coreApi}/CallLogs/${id}`);
  }

  saveLogById(data: CallLog): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/CallLogs`, data);
  }

  /**
   *  update customer id in the call log table
   * @param updateInfo json object
   */
  updateCallLogCustomer(updateInfo: any): Observable<any> {

    const body = new HttpParams()
      .set('updateInfo', JSON.stringify(updateInfo));

    // tslint:disable-next-line: max-line-length
    return this.http.post(`${this.coreApi}/CallLogs/updateCustomer`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  /**
   * Get Call Logs Counters for dashboard
   */
  getDashLogsCount(offset, weekend): Observable<LogsCount> {
    let param = "offset="+offset+"&weekend="+weekend;
    return this.http.get<LogsCount>(`${this.coreApi}/CallLogs/count_logs?${param}`);
  }

  getDashStatistics(startDate: string, endDate: string): Observable<any> {
    let param = "startDate="+startDate+"&endDate="+endDate;
    return this.http.get<any>(`${this.coreApi}/CallLogs/statistics?${param}`);
  }

  getPhoneBookById(id: number): Observable<PhoneBook> {
    return this.http.get<PhoneBook>(
      `${this.coreApi}/PhoneBooks/${id}`
    );
  }

  /**
   * get all phonebooks
   */
  getAllPhonebooks(): Observable<PhoneBook[]> {
    return this.http.get<PhoneBook[]>(
      `${this.coreApi}/PhoneBooks`
    );
  }

  /**
   * Add Phonebook
   * @param data
   */
  addPhoneBook(data: PhoneBook): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/Phonebooks`, data);
  }

  /**
   * Get Receiving Numbers
   * @param active
   * @param direction
   * @param page
   * @param size
   * @param filterValue
   * @param customerFilter
   */
  // tslint:disable-next-line: max-line-length
  getReceivingNumbers(active: string, direction: string, page: number, size: number, filterValue: string, customerFilter?: any): Observable<HttpResponse<ReceivingNumber[]>> {
    // tslint:disable-next-line: max-line-length
    const filter = getFilter(active, direction, size, page, filterValue, null, null, receivingNumberKeys, null, customerFilter, "number,OpNumber.tracking_number");
    // tslint:disable-next-line: max-line-length
    return this.http.get<ReceivingNumber[]>(`${this.coreApi}/ReceivingNumbers/receiving_numbers?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  /**
   *  get Total count of receiving numbers
   */
  // tslint:disable-next-line: max-line-length
  getReceivingNumbersCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, receivingNumberKeys, customerFilter, "number,OpNumber.tracking_number");
    return this.http.get<any>(`${this.coreApi}/ReceivingNumbers/count?${'where=' + whereParam}`);
  }

  /**
   * get all receiving numbers
   */
  getAllReceivingNumbers(): Observable<HttpResponse<ReceivingNumber[]>> {
    // tslint:disable-next-line: max-line-length
    return this.http.get<ReceivingNumber[]>(`${this.coreApi}/ReceivingNumbers`, { observe: 'response' });
  }

  /**
   * Add Receiving Number
   * @param data
   */
  addReceivingNumber(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/ReceivingNumbers`, data);
  }

  /**
   * Get Receiving Number By ID
   * @param id
   */
  getReceivingNumberById(id: number): Observable<ReceivingNumber> {
    return this.http.get<ReceivingNumber>(`${this.coreApi}/ReceivingNumbers/${id}`);
  }

  /**
   * Update Receiving Number By ID
   * @param data
   */
  updateReceivingNumberById(data: ReceivingNumber): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/ReceivingNumbers`, data);
  }

  deleteReceivingNumberById(id: number): Observable<any> {
    return this.http.delete(`${this.coreApi}/ReceivingNumbers/${id}`);
  }

  /**
   * get routing actions that use receiving number
   * @param id receiving number id
   */
  getTrackingNumbersByReceivingNumber(id: number): Observable<GetNumbers[]> {
    const condition = {
      where: {
        receiving_numberId: id
      }
    }
    const filter = encodeURIComponent(JSON.stringify(condition))
    return this.http.get<GetNumbers[]>(`${this.coreApi}/OpNumbers?filter=${filter}`);
  }

  /**
   * Get Routing Actions
   * @param active
   * @param direction
   * @param page
   * @param size
   * @param filterValue
   */
  // tslint:disable-next-line: max-line-length
  getRoutingActions(active: string, direction: string, page: number, size: number, filterValue: string): Observable<HttpResponse<RoutingAction[]>> {
    // tslint:disable-next-line: max-line-length
    const filter = getFilter(active, direction, size, page, filterValue, null, null, sipGatewayKeys);
    // tslint:disable-next-line: max-line-length
    return this.http.get<RoutingAction[]>(`${this.coreApi}/RoutingActions?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  /**
   * Get All Routing Actions
   */
  getAllRoutingActions(): Observable<RoutingAction[]> {
    return this.http.get<RoutingAction[]>(`${this.coreApi}/RoutingActions`);
  }

  /**
   * Add Routing Action
   * @param data
   */
  addRoutingAction(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/RoutingActions`, data);
  }

  /**
   * Get Routing Action By ID
   * @param id
   */
  getRoutingActionById(id: number): Observable<RoutingAction> {
    return this.http.get<RoutingAction>(`${this.coreApi}/RoutingActions/${id}`);
  }

  /**
   * Update Routing Action By ID
   * @param data
   */
  updateRoutingActionById(data: RoutingAction): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/RoutingActions`, data);
  }

  /**
   * Delete Routing Action
   * @param id routing action id
   */
  deleteRoutingActionById(id: number): Observable<any> {
    return this.http.delete(`${this.coreApi}/RoutingActions/${id}`);
  }

  /**
   * get tracking numbers that use sip gateway
   * @param id sip gateway id
   */
  getTrackingNumbersBySipGateway(id: number): Observable<GetNumbers[]> {
    const condition = {
      where: {
        sip_gatewayId: id
      }
    }
    const filter = encodeURIComponent(JSON.stringify(condition))
    return this.http.get<GetNumbers[]>(`${this.coreApi}/OpNumbers?filter=${filter}`);
  }

  /**
   * get tracking numbers that use tracking source
   * @param id tracking source id
   */
  getTrackingNumbersByTrackingSource(id: number): Observable<GetNumbers[]> {
    const condition = {
      where: {
        tracking_sourceId: id
      }
    }
    const filter = encodeURIComponent(JSON.stringify(condition))
    return this.http.get<GetNumbers[]>(`${this.coreApi}/OpNumbers?filter=${filter}`);
  }

  /**
   * Get Sip Gateways
   * @param active
   * @param direction
   * @param page
   * @param size
   * @param filterValue
   * @param customerFilter
   */
  // tslint:disable-next-line: max-line-length
  getSipGateways(active: string, direction: string, page: number, size: number, filterValue: string, customerFilter?: any): Observable<HttpResponse<SipGateways[]>> {
    // tslint:disable-next-line: max-line-length
    const filter = getFilter(active, direction, size, page, filterValue, null, null, sipGatewayKeys, null, customerFilter);
    // tslint:disable-next-line: max-line-length
    return this.http.get<SipGateways[]>(`${this.coreApi}/SipGateways?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  /**
   *  get Total count of sip gateways
   */
  // tslint:disable-next-line: max-line-length
  getSipGatewayCount(filterValue: string, customerFilter?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, null, null, trackingSourceKeys, customerFilter);
    return this.http.get<any>(`${this.coreApi}/SipGateways/count?${'where=' + whereParam}`);
  }

  /**
   * Get All Sip Gateways
   */
  getAllSipGateways(): Observable<SipGateways[]> {
    return this.http.get<SipGateways[]>(`${this.coreApi}/SipGateways`);
  }

  /**
   * Add Sip Gateway
   * @param data
   */
  addSipGateway(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/SipGateways`, data);
  }

  /**
   * Get Sip Gateway By ID
   * @param id
   */
  getSipGatewayById(id: number): Observable<SipGateways> {
    return this.http.get<SipGateways>(`${this.coreApi}/SipGateways/${id}`);
  }

  /**
   * Update Sip Gateway By ID
   * @param data
   */
  updateSipGatewayById(data: SipGateways): Observable<any> {
    return this.http.put<any>(`${this.coreApi}/SipGateways`, data);
  }

  /**
   * delete sip gateway
   * @param id sip gateway id
   */
  deleteSipGatewayById(id: number): Observable<any> {
    return this.http.delete(`${this.coreApi}/SipGateways/${id}`);
  }

  assignSipGatewayOrder(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/SipGateways/order`, { gw_list: data });
  }

  markDefaultOutboundGateway(id: number): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/SipGateways/set_default`, {gateway_id: id});
  }

  /**
   * Bulk Upload
   */

  bulkUpload(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/ReceivingNumbers/bulk_upload`, data);
  }

  bulkNumberProvUpload(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/NumberProviders/bulk_upload`, data);
  }

  bulkTNumbersUpload(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/OpNumbers/bulk_upload`, data);
  }

  bulkSipGatewaysUpload(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/SipGateways/bulk_upload`, data);
  }

  bulkTrackingSourcesUpload(data): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/TrackingSources/bulk_upload`, data);
  }

  activityReport(startDate, endDate, offset): Observable<any> {
    const body = new HttpParams()
      // .set('filter', filter)
      .set('start_date', startDate)
      .set('end_date', endDate)
      // .set('interval', interval)
      // .set('view_by', viewBy)
      .set('offset', offset)

    // tslint:disable-next-line: max-line-length
    return this.http.post(`${this.coreApi}/CallLogs/activity_report`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  overviewReport(startDate, endDate, offset): Observable<any> {
    const body = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate)
      .set('offset', offset)
      // .set('interval', interval)
      // .set('interval', interval === 'H' ? '1' : interval === 'D' ? '0' : interval === 'W' ? '2' : '3')
      // .set('customer_id', customerId)

    // tslint:disable-next-line: max-line-length
    return this.http.post(`${this.coreApi}/CallLogs/overview_report`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  /**
   * get logs count from backend
   * @param filterValue
   * @param date1
   * @param date2
   * @param customerFilter
   * @returns
   */
  getLogsCount(filterValue: string, date1: string, date2: string, customerFilter: any, customCondition?: any): Observable<any> {
    const whereParam = getCountWhere(filterValue, date1, date2, callLogKeys, customerFilter, "OpNumber.ReceivingNumber.number,trackingNumber,trackingNumber", customCondition);
    return this.http.get<any>(`${this.coreApi}/CallLogs/count?${'where=' + whereParam}`);
  }

  /**
   * Get Call Logs
   * @param active
   * @param direction
   * @param page
   * @param size
   * @param filterValue
   * @param date1
   * @param date2
   * @param option
   * @param value
   */
  // tslint:disable-next-line: max-line-length
  getLogs(active: string, direction: string, page: number, size: number, filterValue: string, date1: string, date2: string, customFilter?: any, customCondition?: any): Observable<HttpResponse<CallLog[]>> {
    const filter = getFilter(active, direction, size, page, filterValue, date1, date2, callLogKeys, null, customFilter, "OpNumber.ReceivingNumber.number,trackingNumber,trackingNumber", customCondition);
    return this.http.get<CallLog[]>(  `${this.coreApi}/CallLogs?${filter !== 'filter=' ? filter + '&' : ''}`, { observe: 'response' });
  }

  getCallLogExport(startDate, endDate, offset): Observable<any> {
    const body = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate)
      .set('offset', offset)

    return this.http.post(`${this.coreApi}/CallLogs/export_report`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  compareDatarange(daterange1, daterange2): Observable<any> {
    const parameter = 'daterange=true&start_daterange=' + daterange1 + '&end_daterange=' + daterange2 + '&view_by=2';

    const body = new HttpParams()
      .set('start_daterange', daterange1)
      .set('end_daterange', daterange2)
      .set('daterange', 'true')
      .set('view_by', '2');

    return this.http.post(`${this.coreApi}/CallLogs/compare_report`, body.toString(), { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') });
  }

  compareDatarange_calllog(daterange1, daterange2): Observable<any> {
    return this.http.get(`${this.coreApi}/CallLogs/compare_report?start_daterange=${daterange1}&end_daterange=${daterange2}&daterange=true&view_by=2`)
  }

  /**
   * get products list
   * @param filter
   * @returns
   */
  getProducts(filter): Observable<any> {
    return this.http.get(`${this.coreApi}/Products?filter=` + JSON.stringify(filter), filter)
  }

  /**
   * get products list for registration
   * @returns
   */
  getProductsReg(): Observable<any> {
    return this.http.get(`${this.coreApi}/Products/reg_list`, {});
  }

  /**
   * post product
   * @param productData
   * @returns
   */
  postProduct(productData): Observable<any> {
    if (!productData.discountId)
      delete productData.discountId;
    if (productData.id)
      return this.http.put(`${this.coreApi}/Products`, productData)
    else {
      delete productData.id;
      return this.http.post(`${this.coreApi}/Products`, productData)
    }
  }

  /**
   * post variation
   * @param variationData
   * @returns
   */
  postVariation(variationData): Observable<any> {
    if (variationData.id)
      return this.http.put(`${this.coreApi}/ProductVariations`, variationData)
    else {
      delete variationData.id;
      return this.http.post(`${this.coreApi}/ProductVariations`, variationData)
    }
  }

  /**
   * post subscribe product
   * @param isSub
   * @param subscribeData
   * @returns
   */
  subscribeProductUpd(isSub, subscribeData): Observable<any> {
    if (isSub)
      return this.http.post(`${this.coreApi}/Products/subscribe_product`, subscribeData)
    else {
      delete subscribeData.quantity;
      return this.http.post(`${this.coreApi}/Products/unsubscribe_product`, subscribeData)
    }
  }

  /**
   * Request Intent Object
   * @returns
   */
   getPaymentIntent(amount): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/create_intent`, { amount: amount });
  }

  /**
   * get Payment Methods list
   * @returns
   */
  getPaymentMethods(id): Observable<any> {
    return this.http.get(`${this.coreApi}/PaymentMethods?filter={"where":{"customerId":${id}}}`, {});
  }

  /**
   * post Payment Methods
   * @param paymentMethodsData
   * @returns
   */
  postPaymentMethods(paymentMethodsData): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/attach`, paymentMethodsData)
  }

  /**
   * delete Payment Methods
   * @param token
   * @returns
   */
  deletePaymentMethods(_token): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/detach`, { token: _token });
  }

  /**
   * Set Payment Method Primary
   * @param id
   * @returns
   */
  setPrimaryPaymentMethod(id): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/set_primary`, { payment_id: id });
  }

  /**
   * get Payment Transaction list
   * @returns
   */

  getAccountLogsCount(id, value?: string) {
    const where: any = {
      and: [
        { customerId: id},
        { paymentId: {eq: null} },
      ]
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions/count?where=${encodeURIComponent(JSON.stringify(where))}`, {});
  }

  getAccountLogs(id, pageIndex, pageSize, value?: string): Observable<any> {
    const filter: any = {
      order: ["transactionDate DESC"],
      where: {
        and: [
          { customerId: id},
          { paymentId: {eq: null} },
        ]
      },
      limit: pageSize,
      skip: (pageIndex-1)*pageSize
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      filter.where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions?filter=${encodeURIComponent(JSON.stringify(filter))}`, {});
  }

  getPaymentHistoryCount(id, value?: string) {
    const where: any = {
      and: [
        { customerId: id},
        { paymentId: {neq: null} },
      ]
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions/count?where=${encodeURIComponent(JSON.stringify(where))}`, {});
  }

  getPaymentHistory(id, pageIndex, pageSize, value?: string): Observable<any> {
    const filter: any = {
      order: ["transactionDate DESC"],
      where: {
        and: [
          { customerId: id},
          { paymentId: {neq: null} },
        ]
      },
      limit: pageSize,
      skip: (pageIndex-1)*pageSize
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      filter.where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions?filter=${encodeURIComponent(JSON.stringify(filter))}`, {});
  }


  getCallLogsCount(id, value?: string) {
    const where: any = {
      and: [
        { customerId: id},
        { productId: 6 }
      ]
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions/count?where=${encodeURIComponent(JSON.stringify(where))}`, {});
  }

  getCallLogs(id, pageIndex, pageSize, value?: string): Observable<any> {
    const filter: any = {
      order: ["transactionDate DESC"],
      where: {
        and: [
          { customerId: id},
          { productId: 6 },
        ]
      },
      limit: pageSize,
      skip: (pageIndex-1)*pageSize
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      filter.where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions?filter=${encodeURIComponent(JSON.stringify(filter))}`, {});
  }

  getTransactionsCount(id, value?: string) {
    const where: any = {
      and: [
        { customerId: id},
        { productId: {neq: 6}}
      ]
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions/count?where=${encodeURIComponent(JSON.stringify(where))}`, {});
  }

  getTransactions(id, pageIndex, pageSize, value?: string): Observable<any> {
    const filter: any = {
      order: ["transactionDate DESC"],
      where: {
        and: [
          { customerId: id},
          { productId: {neq: 6}}
        ]
      },
      limit: pageSize,
      skip: (pageIndex-1)*pageSize
    }

    if (value && value!="") {
      const or: any[] = [{description: { like: `%${value}%`}}]
      // @ts-ignore
      if (!isNaN(value)) {
        or.push({amount: parseFloat(value)})
      }

      filter.where.and.push({or})
    }

    return this.http.get(`${this.coreApi}/PaymentTransactions?filter=${encodeURIComponent(JSON.stringify(filter))}`, {});
  }

  /**
   * get Price Discounts list
   * @returns
   */
  getPriceDiscounts(): Observable<any> {
    return this.http.get(`${this.coreApi}/PriceDiscounts`, {});
  }

  chargeCustomer(amount, payment_token): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/charge_customer`, { amount: amount, source: payment_token });
  }

  chargeCustomerByAdmin(amount, payment_token, customerId): Observable<any> {
    return this.http.post(`${this.coreApi}/PaymentMethods/charge_customer`, { amount: amount, source: payment_token, customerId });
  }

  /**
   * to request a verify code on new user email
   * @param email_address
   * @returns
   */
  request_email(username, email_address): Observable<any> {
    return this.http.post(`${this.coreApi}/DashUsers/request_email`, { username, email_address: email_address })
  }

  /**
   * to verify new user email
   * @param email_address
   * @param verify_code
   * @returns
   */
  verify_email(email_address, verify_code): Observable<any> {
    return this.http.post(`${this.coreApi}/DashUsers/verify_email`, { email_address: email_address, verify_code: verify_code })
  }

  /**
   * post registration user
   * @param userdata
   * @returns
   */
  register(userdata): Observable<any> {
    return this.http.post(`${this.coreApi}/DashUsers/register`, userdata)
  }

  deleteCustomerProductsRelByWhere(where: string) {
    return this.http.delete<any>(`${this.coreApi}/CustomerProductsRels?where=${where}`);
  }

  addBlacklistNumber(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/BlacklistNumbers`, data);
  }

  deleteBlacklistNumber(id): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/BlacklistNumbers/${id}`);
  }

  getBlacklistNumber(customerId): Observable<IBlacklistNumber[]> {
    let filter = "{}"
    if (customerId!=1)
      filter = `{ "where": {"or": [{"customerId": 1}, {"customerId": ${customerId} }] } }`

    const url = `${this.coreApi}/BlacklistNumbers?filter=${filter}`;
    return this.http.get<IBlacklistNumber[]>(url);
  }

  getSubscriptions(): Observable<any[]> {
    const url = `${this.coreApi}/PaymentMethods/subscriptions`;
    return this.http.get<any[]>(url);
  }



}

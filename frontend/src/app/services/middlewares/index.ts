import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {tap, pluck, catchError, take} from 'rxjs/operators';
import {StoreService} from '@app/services/store/store.service';
import {ApiService} from '../api/api.service';
import {Router} from '@angular/router';
import {MessageService} from "primeng/api";

// HttpRequest objects are immutable, so in order to modify them, we need to
// first make a copy, then modify the copy and call handle on the modified copy

// Can be used for: notifications, toast errors, redirects ...
@Injectable()
export class StatusInterceptor implements HttpInterceptor {

  constructor(private store: StoreService, private api: ApiService, private router: Router, private messageService: MessageService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpErrorResponse) {
          // console.log('Error', event.status, 'for :', event.url);

        } else if (event instanceof HttpResponse) {
          // Just for debugging purpose
          // console.log('Status', event.status, 'for:', event.url);
        }
      }),
      catchError((error: any): Observable<any> => {
        if (error.status == 0) {
          this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: "Network Connection Error" });
        } else {
          this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: `${error && error.status} ${error && error.error && error.error.error && error.error.error.message || ''}` });
        }

        if (request.url.includes('DashUsers/authenticate')) {
          this.store.setIsLoginFailed(true)
          return
        }

        if (error.status === 401) {
          this.store.state$.pipe(pluck('user'), take(1)).subscribe(u => {
            if (u && u.username && u.password) {
              this.api.login({username: u.username, password: u.password}, false).subscribe(r => {
                if (r) {
                  // console.log('auto relogin executed');
                }
              });
            } else {
              // throw request
              return this.router.navigate(['/']);
            }
          });

        } else if (error.status === 403) {
          this.api.retrieveLoggedUserOb(this.store.retrieveToken()).subscribe((user) => {
            if (user) {

            } else {
              window.localStorage.clear();
              this.router.navigate(['/']);
            }
          }, error => {
            window.localStorage.clear();
            this.router.navigate(['/']);
          }, () => {
          })
        } else {
          return throwError(error.message);
        }

        return of(request);
      })
    );
  }
}

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  private token: string;

  constructor(private store: StoreService) {
    this.store.state$.pipe(
      pluck('token'),
    ).subscribe(token => this.token = (token) ? token.id : null);
  }

  /**
   * Always attach access token to url and headers
   * @param request
   * @param next
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.includes(".json")) {
      return next.handle(request);
    } else if (this.token) {
      return next.handle(request.clone({
        url: `${request.url}${request.url.includes('?') ? '&' : '?'}access_token=${this.token}`,
        setHeaders: {Authorization: `Bearer ${this.token}`}
      }));
    } else {
      return next.handle(request);
    }
  }
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    }));
  }
}

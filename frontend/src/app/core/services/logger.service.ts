import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {

    constructor() { }

    log(msg: string) {
    }

    logError(msg: string) {
        console.error(msg);
    }

}

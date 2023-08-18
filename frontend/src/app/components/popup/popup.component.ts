import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { PopupRef } from '@app/components/popup/popup.ref';
import { sliderMenu, fadeBottom, fadeTop } from '@app/animations';
import { fromEvent } from 'rxjs';
import { PopupData, PopupState } from '@app/models/popup';
import { StoreService } from '@app/services/store/store.service';

@Component({
	selector: 'app-popup',
	templateUrl: './popup.component.html',
	styleUrls: ['./popup.component.css'],
	animations: [fadeBottom, fadeTop, sliderMenu]
})
export class PopupComponent implements OnInit, OnDestroy {

	public animationState: PopupState = 'open';
	public iconName: string;
	public fade: 'top' | 'bottom' | 'side';
	private intervalId: number;

	constructor(readonly data: PopupData, readonly ref: PopupRef) {
		this.iconName = data.icon || 'information';
	}

	ngOnInit() {
		if (this.data.timeout) {
			this.intervalId = window.setTimeout(() => this.animationState = 'close', this.data.timeout);
		}
	}

	ngOnDestroy() {
		clearTimeout(this.intervalId);
	}

	close() {
		this.animationState = 'close';
	}

	onFadeFinished(event: AnimationEvent) {
		const { toState } = event;
		if (toState === 'close' && this.animationState === 'close') {
			this.ref.close();
		} else {
			if (this.data.clickHandler === 'outside') {
				this.ref.backdropClick.subscribe(_ => this.close());
			} else if (this.data.clickHandler === 'all') {
				fromEvent(document, 'click').subscribe(_ => this.close());
			}
		}
	}
}

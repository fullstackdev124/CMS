import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef, GlobalPositionStrategy, OverlayConfig, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { PopupComponent } from '@app/components/popup/popup.component';
import { PopupRef } from '@app/components/popup/popup.ref';
import { IPopupOptions, PopupData, IRelativePopup } from '@app/models/popup';
import { StoreService } from '../store/store.service';

@Injectable({
	providedIn: 'root'
})
export class PopupService {

	public overlayRef: OverlayRef | null;
	private isMobile: boolean;

	constructor(
		private overlay: Overlay,
		private parentInjector: Injector,
		private storeService: StoreService
	) {
		this.storeService.state$.subscribe(state => {
			this.isMobile = state.isMobile;
		});
	}

	show(data: PopupData, options: IPopupOptions) {

		const overlayRef = this.overlay.create(this.getOverlayConfig(data.type, options));
		const popupRef = new PopupRef(overlayRef);

		data.mobile = this.isMobile;

		const tokens = new WeakMap();
		tokens.set(PopupData, data);
		tokens.set(PopupRef, popupRef);

		const injector = new PortalInjector(this.parentInjector, tokens);
		overlayRef.attach(new ComponentPortal(PopupComponent, null, injector));

		return popupRef;
	}

	showSuccess(message: string) {
		this.show({
			type: 'notification',
			text: message,
			icon: 'information',
			clickHandler: 'none',
			color: 'green',
			timeout: 3000
		}, {
			hasBackdrop: false,
			onScroll: 'noop',
			popup: {}
		});
	}

	showWarn(message: string) {
		this.show({
			type: 'notification',
			text: message,
			icon: 'information',
			clickHandler: 'none',
			color: 'red',
			timeout: 3000
		}, {
			hasBackdrop: false,
			onScroll: 'noop',
			popup: {}
		});
	}

	private getPositionStrategy(type: string, options: IPopupOptions): GlobalPositionStrategy | FlexibleConnectedPositionStrategy {
		switch (type) {
			case 'modal': {
				return this.overlay.position().global().centerHorizontally().centerVertically();
			}
			case 'contextPage':
			case 'contextMenu': {
				if (this.isMobile) {
					return this.overlay.position().global().centerHorizontally().bottom('0px');
				} else {
					options.popup = options.popup as IRelativePopup;
					return this.overlay.position().flexibleConnectedTo(options.popup.origin).withPositions(options.popup.positions).withPush(false);
				}
			}
			case 'notification': {
				if (this.isMobile) {
					return this.overlay.position().global().top('0px');
				} else {
					return this.overlay.position().global().right('1rem').top('4rem');
				}
			}
			default: return this.overlay.position().global();
		}
	}

	private getOverlayConfig(type: string, options: IPopupOptions): OverlayConfig {
		if ((type === 'contextMenu' || type === 'contextPage') && !this.isMobile) {
			return new OverlayConfig({
				positionStrategy: this.getPositionStrategy(type, options),
				hasBackdrop: options.hasBackdrop,
				backdropClass: 'cdk-transparent-backdrop',
				scrollStrategy: options.onScroll === 'reposition' ? this.overlay.scrollStrategies.reposition() : this.overlay.scrollStrategies.close(),
				width: (options.popup as IRelativePopup).width,
				height: (options.popup as IRelativePopup).height,
			});
		} else {
			return new OverlayConfig({
				positionStrategy: this.getPositionStrategy(type, options),
				hasBackdrop: options.hasBackdrop,
				backdropClass: 'cdk-theme-backdrop',
				scrollStrategy: options.onScroll === 'noop' ? this.overlay.scrollStrategies.noop() : this.overlay.scrollStrategies.block(),
			});
		}
	}
}

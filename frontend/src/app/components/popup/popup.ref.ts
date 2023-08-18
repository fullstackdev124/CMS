import { OverlayRef } from '@angular/cdk/overlay';

export class PopupRef {

	constructor(private readonly overlay: OverlayRef) {}

	public backdropClick = this.overlay.backdropClick();

	public close() {
		this.overlay.dispose();
	}

	public isVisible() {
		return this.overlay && this.overlay.overlayElement;
	}

	public getPosition() {
		return this.overlay.overlayElement.getBoundingClientRect();
	}
}

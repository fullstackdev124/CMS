import { TemplateRef } from '@angular/core';
import { ConnectionPositionPair } from '@angular/cdk/overlay';

export type PopupState = 'open' | 'close';

export class PopupData {
	type: 'modal' | 'contextMenu' | 'contextPage' | 'sideMenu' | 'notification';
	clickHandler: 'all' | 'outside' | 'none';
	mobile?: boolean;
	timeout?: number;
	icon?: string;
	text?: string;
	color?: string;
	template?: TemplateRef<any>;
	templateContext?: object;
}

export interface IPopupOptions {
	popup?: IAbsolutePopup | IRelativePopup;
	onScroll?: 'noop' | 'block' | 'reposition';
	hasBackdrop?: boolean;
}

export interface IAbsolutePopup {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

export interface IRelativePopup {
	origin: HTMLElement;
	width: number | string;
	height: number | string;
	positions: ConnectionPositionPair[];
}

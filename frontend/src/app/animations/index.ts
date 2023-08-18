import { style, trigger, state, animate, transition } from '@angular/animations';

export const entryComponent = trigger('entryComponent', [
	// the "in" style determines the "resting" state of the element when it is visible.
	state('in', style({
		opacity: 1,
		transform: 'translateY(20px)'
	})),
	transition('void => *', [
		style({
			opacity: 0,
			transform: 'translateY(-20px)'
		}),
		animate('250ms ease-out')
	]),
	transition('void => *', [
		animate('250ms ease-in', style({
			opacity: 0,
			transform: 'translateY(-20px)'
		}))
	]),
]);

export const fadeTop = trigger('fadeTop', [
	state('*', style({
		opacity: 1,
		transform: 'translateY(-4rem)'
	})),
	state('open', style({
		opacity: 1,
		transform: 'translateY(0rem)'
	})),
	state('close', style({
		opacity: 0,
		transform: 'translateY(-4rem)'
	})),
	transition('* => open', [
		animate('250ms ease-out')
	]),
	transition('* => close', [
		animate('250ms ease-in')
	]),
]);

export const fadeBottom = trigger('fadeBottom', [
	state('*', style({
		opacity: 1,
		transform: 'translateY(4rem)'
	})),
	state('open', style({
		opacity: 1,
		transform: 'translateY(0rem)'
	})),
	state('close', style({
		opacity: 0,
		transform: 'translateY(4rem)'
	})),
	transition('* => open', [
		animate('250ms ease-out')
	]),
	transition('* => close', [
		animate('250ms ease-in')
	]),
]);

export const popupFade = trigger('popupFade', [
	state('void', style({
			opacity: 0,
			transform: 'translateY(2rem)',
		}),
	),
	state('open', style({
		opacity: 1,
		transform: 'translateY(0rem)'
	})),
	state('close', style({
			opacity: 0,
			transform: 'translateY(2rem)',
		}),
	),
	transition('void => open', [
		animate('250ms ease-out')
	]),
	transition('open => close', [
		animate('250ms ease-in')
	]),
]);

export const sliderMenu = trigger('sliderMenu', [
	state('void', style({
		opacity: 0,
		transform: 'translateX(-75%)',
	}),
),
state('open', style({
	opacity: 1,
	transform: 'translateX(0rem)'
})),
state('close', style({
		opacity: 0,
		transform: 'translateX(-75%)',
	}),
),
	transition('void => open', [
		animate('250ms ease-out')
	]),
	transition('open => close', [
		animate('250ms ease-in')
	]),
]);
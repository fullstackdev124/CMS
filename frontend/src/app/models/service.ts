export interface IService {
	id: number;
	name: string;
	label: string;
	description: string;
}

export interface IServiceItem {
	id: number;
	serviceId: number;
	name: string;
	enabled: boolean;
}

export interface ISubMenu {
	label: string;
	icon: string;
	link: string;
	toggle: boolean;
	enabled: boolean;
	menus?: ISubMenu[];
}

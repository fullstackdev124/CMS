import {IRole} from '@app/models/user';

export interface GuiPermission {
  id: number;
  name: string;
  label: string;
}

export interface GuiSection {
  id: number;
  name: string;
  fqdn: string;
  groupName: string;
}

export interface GuiVisibility {
  id: number;
  guipermissionId: number;
  guisectionId: number;
  roleId: number;
  GuiPermission: GuiPermission;
  GuiSection: GuiSection;
  DashRole: IRole;
}

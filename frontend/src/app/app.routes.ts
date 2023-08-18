export const RoutePath = {
  auth: {
    login: 'auth/login',
    signup: 'auth/signup',
    forgot: 'auth/forgot-password',
  },
  error: {
    e404: 'error/404',
    e500: 'error/500',
  },
  dashboard: '/service/dashboard',
  callLogs: '/service/call-log',
  user: {
    users: '/service/user',
    add: '/service/user/add/:id',
    edit: '/service/user/edit/:id',
    delete: '/service/user/delete/:id',
  },
  billing: {
    profile: '/service/billing',
    settings: '/service/billing/settings'
  },
  receiving: {
    numbers: '/service/routing/receiving',
    sipgateways: '/service/routing/sipgateway'
  },
  numberman: {
    management: '/service/numberman',
    add: '/service/numberman/add',
    edit: '/service/numberman/edit/:id',
    delete: '/service/numberman/delete/:id'
  },
  tracking_number: {
    numbers: '/service/tracking-number',
    setup: '/service/tracking-number/setup',
    add: '/service/tracking-number/add',
    edit_full: '/service/tracking-number/edit/',
    edit: '/service/tracking-number/edit/:id',
    delete_full: '/service/tracking-number/delete/',
    delete: '/service/tracking-number/delete/:id'
  },
  tracking_source: {
    sources: '/service/tracking-source',
    add: '/service/tracking-source/add',
    edit: '/service/tracking-source/:id'
  },
  reports: {
    activity_reports: '/service/reports/activity',
    roi_reports: '/service/reports/roi',
    overview: '/service/reports/overview'
  },
  customer: {
    customers: '/service/customer',
    add: '/service/customer/add/:id',
    edit: '/service/customer/edit/:id',
    delete: '/service/customer/delete/:id',
  },
  role: {
    roles: '/service/role',
    add: '/service/role/add/:id',
    edit: '/service/role/edit/:id',
    delete: '/service/role/delete/:id',
  },
}

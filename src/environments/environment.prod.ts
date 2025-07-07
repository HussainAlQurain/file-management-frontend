export const environment = {
  apiBase: (window as any)['env']?.['apiUrl'] || 'http://16.24.170.37:8080/api',
  production: true,
  appName: (window as any)['env']?.['appName'] || 'Document Management System'
};

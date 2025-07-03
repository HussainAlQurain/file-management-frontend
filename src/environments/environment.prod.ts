export const environment = {
  apiBase: (window as any)['env']?.['apiUrl'] || 'http://localhost:8080/api',
  production: true,
  appName: (window as any)['env']?.['appName'] || 'Document Management System'
};

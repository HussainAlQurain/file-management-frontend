export function toParams(obj: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        params[key] = obj[key].join(',');
      } else {
        params[key] = String(obj[key]);
      }
    }
  }
  
  return params;
}

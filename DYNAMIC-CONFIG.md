# Dynamic API Configuration

This setup allows your Angular app to load API configuration dynamically from `env.js` at runtime, with fallback to environment files.

## How it works

### 1. App Initialization
- The app loads `env.js` from the public folder at startup via `APP_INITIALIZER`
- If `env.js` is not found, it falls back to `environment.ts` values
- All services use `ConfigService` to get the current API base URL

### 2. Configuration Priority
1. **Runtime config** (`env.js` from public folder) - **Highest Priority**
2. **Environment files** (`environment.ts/environment.prod.ts`) - **Fallback**

### 3. Service Integration
All HTTP services now use `ConfigService.apiBase` instead of hardcoded `environment.apiBase`:

```typescript
// Before
private readonly baseUrl = `${environment.apiBase}/resource-types`;

// After
private configService = inject(ConfigService);

private get baseUrl(): string {
  return `${this.configService.apiBase}/resource-types`;
}
```

## Usage Examples

### Development (Local)
Your `public/env.js`:
```javascript
(function (window) {
  window["env"] = window["env"] || {};
  window["env"]["apiUrl"] = "http://localhost:8080/api";
  window["env"]["appName"] = "Document Management System - Dev";
})(this);
```

### Production (Deployment)
Update `public/env.js` on your server:
```javascript
(function (window) {
  window["env"] = window["env"] || {};
  window["env"]["apiUrl"] = "https://your-production-server.com/api";
  window["env"]["appName"] = "Document Management System";
})(this);
```

### Docker/Kubernetes Deployment
You can override `env.js` at deployment time:
```bash
# Example: Replace env.js with production values
echo "(function (window) {
  window['env'] = window['env'] || {};
  window['env']['apiUrl'] = '$API_URL';
  window['env']['appName'] = '$APP_NAME';
})(this);" > /path/to/app/env.js
```

## Benefits

1. **Post-build configuration**: Change API URLs without rebuilding
2. **Environment agnostic**: Same build works in dev, staging, production
3. **Docker friendly**: Perfect for containerized deployments
4. **Backward compatible**: Falls back to environment files if env.js is missing
5. **No breaking changes**: Existing HTTP client setup remains unchanged

## Testing

To test the configuration:

1. **Check browser console** for configuration logs:
   - "Configuration loaded from env.js: {...}"
   - "Could not load env.js, using environment defaults"

2. **Verify API calls** use the correct base URL from `env.js`

3. **Test fallback** by removing/renaming `public/env.js` temporarily

## Current Status

✅ All services updated to use `ConfigService`
✅ APP_INITIALIZER configured for startup loading
✅ Fallback to environment files working
✅ Build compilation successful
✅ No breaking changes to existing HTTP setup

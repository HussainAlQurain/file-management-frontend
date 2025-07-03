# 🌐 Angular i18n Setup Guide - English & Arabic Support

## ✅ What's Been Implemented

### 1. **Angular i18n Configuration**
- ✅ `@angular/localize` package installed
- ✅ Polyfills configured for i18n
- ✅ Source locale set to English (`en`)
- ✅ Arabic locale (`ar`) configured
- ✅ Translation files created in `src/locale/`

### 2. **ng-zorro Localization**
- ✅ English (`en_US`) and Arabic (`ar_EG`) locales configured
- ✅ Dynamic locale switching based on document language
- ✅ RTL (Right-to-Left) support for Arabic

### 3. **Components Internationalized**
- ✅ Login page component
- ✅ Dashboard page component  
- ✅ Shell layout component (navigation, header, footer)
- ✅ Language switcher component

### 4. **CSS RTL Support**
- ✅ Comprehensive RTL styles for Arabic
- ✅ ng-zorro component RTL fixes
- ✅ Arabic font support
- ✅ Smooth transitions for language switching

## 🚀 How to Use

### Development Commands

```bash
# Serve English version (default)
ng serve

# Serve Arabic version
ng serve --configuration=ar

# Extract new translation strings
ng extract-i18n

# Build English version
ng build

# Build Arabic version  
ng build --configuration=ar

# Build both versions
ng build && ng build --configuration=ar
```

### Language Switching

The app includes a language switcher in the header that:
- Shows current language with flag
- Allows switching between English and Arabic
- Updates document direction (LTR/RTL)
- Sets proper language attributes

## 📁 File Structure

```
src/
├── locale/
│   ├── messages.xlf           # Source (English) translations
│   └── messages.ar.xlf        # Arabic translations
├── app/
│   ├── shared/components/language-switcher/
│   │   └── language-switcher.component.ts
│   └── ...
└── styles.scss               # Includes RTL styles
```

## 📝 Adding New Translations

### 1. Mark Text for Translation

In templates:
```html
<!-- Simple text -->
<h1 i18n="@@page.title">Page Title</h1>

<!-- Placeholder -->
<input i18n-placeholder="@@search.placeholder" placeholder="Search...">

<!-- Using $localize in component -->
export class MyComponent {
  title = $localize`:@@page.title:Page Title`;
}
```

### 2. Extract and Translate

```bash
# Extract new strings
ng extract-i18n

# This updates src/locale/messages.xlf
# Copy new entries to messages.ar.xlf and add Arabic translations
```

### 3. Add Arabic Translation

In `src/locale/messages.ar.xlf`:
```xml
<trans-unit id="page.title" datatype="html">
  <source>Page Title</source>
  <target>عنوان الصفحة</target>
</trans-unit>
```

## 🌍 Production Deployment

For production, you'll have separate builds for each language:

```
dist/
├── dms/              # English version (/)
└── dms/ar/           # Arabic version (/ar/)
```

### Server Configuration

Configure your web server to serve:
- English: `https://yourdomain.com/` → `dist/dms/`
- Arabic: `https://yourdomain.com/ar/` → `dist/dms/ar/`

### Language Detection

You can implement automatic language detection:
1. Check `Accept-Language` header
2. Check user preferences from database
3. Default to English
4. Redirect to appropriate language URL

## 🎨 RTL Styling

The app automatically applies RTL styles when `dir="rtl"` is set. All ng-zorro components are properly configured for RTL.

### Custom RTL Styles

Add RTL-specific styles:
```scss
[dir="rtl"] {
  .my-component {
    text-align: right;
    margin-right: 0;
    margin-left: 16px;
  }
}
```

## 🔧 Language Switcher

The language switcher component:
- Detects current locale
- Updates document direction and lang attributes  
- Shows language names in native scripts
- Includes flag emojis for visual identification

## 📱 Responsive RTL

All responsive layouts work properly in RTL mode:
- Navigation adapts to RTL flow
- Cards and forms align correctly
- Grid layouts reverse appropriately

## 🛠️ Troubleshooting

### Common Issues

1. **New strings not translating**: Run `ng extract-i18n` and add to Arabic file
2. **RTL layout issues**: Check if new components need RTL styles
3. **Build errors**: Ensure all `i18n` attributes have unique IDs

### Translation ID Format

Use descriptive IDs:
- `@@login.username.label` 
- `@@dashboard.title`
- `@@nav.documents`
- `@@error.required.field`

## 🎯 Current Translation Coverage

### ✅ Completed Components
- Authentication (login page)
- Dashboard (main page)
- Navigation (sidebar, header)
- User interface (menus, buttons)

### 🔄 To be Added
- Document forms
- Admin panels  
- Error messages
- Validation messages
- Confirmation dialogs

## 📚 References

- [Angular i18n Guide](https://angular.dev/guide/i18n)
- [ng-zorro i18n](https://ng.ant.design/docs/i18n/en)
- [RTL CSS Guidelines](https://rtlstyling.com/)

## 🤝 Contributing Translations

When adding new features:
1. Always use `i18n` attributes for user-facing text
2. Use descriptive translation IDs
3. Extract strings: `ng extract-i18n`
4. Add Arabic translations to `messages.ar.xlf`
5. Test both LTR and RTL layouts

---

Your Angular DMS now supports both English and Arabic with proper RTL layout and professional translations! 🎉 
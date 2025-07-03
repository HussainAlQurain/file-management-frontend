// Runtime environment configuration
// This file can be modified after build without rebuilding the entire application

(function (window) {
  window["env"] = window["env"] || {};

  // Environment variables - these can be overridden at deployment time
  window["env"]["apiUrl"] = "http://localhost:8080/api";
  window["env"]["appName"] = "Document Management System";
  window["env"]["version"] = "1.0.0";
  
  // You can add more configuration here as needed
  // window["env"]["maxFileSize"] = "100MB";
  // window["env"]["supportEmail"] = "support@example.com";
})(this); 
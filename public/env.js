(function (window) {
  window["env"] = window["env"] || {};
  
  // Test configuration with your EC2 IP
  window["env"]["apiUrl"] = "http://16.24.170.37:8080/api";
  window["env"]["appName"] = "Document Management System";
  window["env"]["version"] = "1.0.0";
  window["env"]["test"] = "This is working!";
  
  console.log("ENV.JS LOADED SUCCESSFULLY!");
  console.log("API URL:", window["env"]["apiUrl"]);
})(this); 
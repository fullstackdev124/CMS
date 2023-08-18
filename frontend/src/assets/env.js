(function(window) {
  window["env"] = window["env"] || {};

  // Environment variables
  window["env"]["backend_ip"] = "${HOST_IP}"
  window["env"]["backend_port"] = "${BACKEND_PORT}";
})(this);

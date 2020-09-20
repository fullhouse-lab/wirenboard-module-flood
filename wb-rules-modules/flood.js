// config.safeRotation_cron = "0 0 0 * * SAT" default - every saturday at 0:00 (GMT 0)
// "0 0 0 * * *" - every day at 0:00 (GMT 0)
// "0 0 * * * *" - every hour (GMT 0)

var MODULE_NAME 		= "flood_manager";
var MODULE_VERSION  = "v.1.5.1";

exports.start = function(config) {
	if (!validateConfig(config)) return;

	//  device  //
	createDevice(config);

	//  rules  //
	config.sensors.forEach( function(item) {
		createRule_externalSensor(config.id,
				item.device,
		  	item.control,
		  	item.name,
				(item.activationValue) ? item.activationValue : 1);
		createRule_VALUE_sensor(config.id, item.name, config.sensors);
	});
	createRule_BTN_testWet(config.id);
	createRule_BTN_testDry(config.id);
	createRule_SWITCH_enabled(config.id, config.sensors);
	createRule_VALUE_flood(config.id, config.onWet, config.onDry);
	if (config.valve_relay)	createRule_valve(
		config.id,
		config.valve_relay.device,
		config.valve_relay.control,
		(config.valve_relay.activationValue != undefined) ? config.valve_relay.activationValue : true
	);
	createCron_VALUE_flood(
		config.id,
		(config.safeRotation_cron) ? config.safeRotation_cron : "0 0 0 * * SAT"
	);

  log(config.id + ": Started (" + MODULE_NAME + " " + MODULE_VERSION + ")");
};

//  Validate config  //

var validateConfig = function(_config) {
  if (!_config) {
    log("Error: " + MODULE_NAME + ": No config");
    return false;
  }

  if (!_config.id || !_config.id.length) {
    log("Error: " + MODULE_NAME + ": Config: Bad id");
    return false;
  }

  if (!_config.title || !_config.title.length) {
    log("Error: " + MODULE_NAME + ": Config: Bad title");
    return false;
  }

  if (_config.valve_relay) {
		if (!_config.valve_relay.device || !_config.valve_relay.control) {
		  log("Error: " + MODULE_NAME + ": Config: Bad valve");
		  return false;
		}
	}

  if (!_config.sensors) {
    log("Error: " + MODULE_NAME + ": Config: Bad sensors");
    return false;
  }

  return true;
}

//
//  Device  //
//

function createDevice(config) {
	var cells = {
		enabled: 				{ type: "switch", value: true, readonly: false },
		version: 				{ type: "text", 	value: MODULE_VERSION },
		safe_rotation: 	{ type: "switch", value: true, readonly: false },
		flood: 					{ type: "value", 	value: 0, readonly: false },
		test_wet: 			{ type: "pushbutton", readonly: false },
		test_dry: 			{ type: "pushbutton", readonly: false },
	}

	if (config.valve_relay) {
		var valve_value = dev[config.valve_relay.device][config.valve_relay.control];
		cells.valve = { type: "switch", value: valve_value, forceDefault: true, readonly: false };
	}

	config.sensors.forEach( function(item) {
	  cells[item.name] = { type: "value", value: 0, readonly: false };
	});

	defineVirtualDevice(config.id, {
	  title: config.title,
	  cells: cells
	});
}

//
//  Rules  //
//

function createRule_valve(device_id, device, control, activationValue) {
	//  valve -> device  //
	defineRule({
    whenChanged: device_id + "/valve",
    then: function (newValue, devName, cellName) {
			var newState = (newValue) ? activationValue : !activationValue;
      if (dev[device][control] != newState) dev[device][control] = !!newState;
    }
  });

	//  device -> valve  //
  defineRule({
    whenChanged: device + "/" + control,
    then: function (newValue, devName, cellName) {
			var newState = (newValue == activationValue);
      if (dev[device_id]["valve"] != newState) dev[device_id]["valve"] = newState;
    }
  });
}

function createRule_externalSensor(device_id, device, control, name, activationValue) {
	defineRule("external_sensor_" + device_id + "_" + name, {
    whenChanged: device + "/" + control,
    then: function (newValue, devName, cellName) {
    	//  get values  //
    	var value = (newValue == activationValue) ? 1 : 0;

			//  save new  //
      if (dev[device_id][name] !== value) dev[device_id][name] = value;
		}
	});
}

function createRule_VALUE_sensor(device_id, name, sensors) {
	defineRule("value_sensor_" + device_id + "_" + name, {
    whenChanged: device_id + "/" + name,
    then: function (newValue, devName, cellName) {
			//  flood found  //
			if (newValue) {
				//  check enabled  //
				if (!dev[device_id]["enabled"]) return;

				//  check already found  //
				if (dev[device_id]["flood"]) return;

				//  set flood  //
				dev[device_id]["flood"] = 1;
			}

			//  no flood anymore on sensor  //
			else {
				//  check others  //
				var isFlood = false;
				sensors.forEach(function (sensor) {
					if(dev[device_id][sensor.name]) isFlood = true;
				})

				//  set dry  //
				if(!isFlood) dev[device_id]["flood"] = 0;
			}
		}
	});
}

function createRule_BTN_testWet(device_id) {
	defineRule("btn_testwet_" + device_id, {
    whenChanged: device_id + "/test_wet",
    then: function (newValue, devName, cellName) {
			//  set flood  //
			if(dev[device_id]["flood"] !== 1) dev[device_id]["flood"] = 1;
		}
	});
}

function createRule_BTN_testDry(device_id) {
	defineRule("btn_testdry_" + device_id, {
    whenChanged: device_id + "/test_dry",
    then: function (newValue, devName, cellName) {
			//  set no flood  //
			if(dev[device_id]["flood"] !== 0) dev[device_id]["flood"] = 0;
		}
	});
}

function createRule_VALUE_flood(device_id, cb_onWet, cb_onDry) {
	defineRule("value_flood_" + device_id, {
    whenChanged: device_id + "/flood",
    then: function (newValue, devName, cellName) {
			//  flood found  //
			if (newValue) {
				if (dev[device_id]["valve"] !== null) dev[device_id]["valve"] = false;
				if (cb_onWet) cb_onWet();
			}

			//  no flood anymore  //
			else {
				if (cb_onDry) cb_onDry();
			}
		}
	});
}

function createRule_SWITCH_enabled(device_id, sensors) {
	defineRule("switch_enabled_" + device_id, {
		whenChanged: device_id + "/enabled",
		then: function (newValue, devName, cellName) {
			log(device_id + ": Change enabled: " + newValue);

			//  enable  //
			if (newValue) {
				//  check others  //
				var isFlood = false;
				sensors.forEach(function (sensor) {
					if(dev[device_id][sensor.name]) isFlood = true;
				})

				//  set flood  //
				if(isFlood) dev[device_id]["flood"] = 1;
			}

			//  disable  //
			else {
				//  set no flood  //
				if(dev[device_id]["flood"] !== 0) dev[device_id]["flood"] = 0;
			}
		}
	});
}

function createCron_VALUE_flood(device_id, cron_str) {
	defineRule("cron_rot_" + device_id, {
	  when: cron(cron_str),
	  then: function() {
			//  check enabled  //
			if (!dev[device_id]["enabled"]) return;

			//  check enabled safe_rotation  //
			if (!dev[device_id]["safe_rotation"]) return;

			//  check no flood  //
			if (dev[device_id]["flood"]) return;

			//  close valve  //
			dev[device_id]["valve"] = false;
			log(device_id + ": Safe rotation: Close valve");

			//  open after 30 sec  //
			setTimeout(function() {
				//  check flood detected  //
				if (dev[device_id]["flood"]) return;

				//  open valve  //
				dev[device_id]["valve"] = true;
				log(device_id + ": Safe rotation: Open valve");
			}, 30 * 1000);
	  }
	});
}

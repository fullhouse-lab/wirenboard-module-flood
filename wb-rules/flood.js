var flood_manager = require("flood");

flood_manager.start({
	id: "flood",
	title: "Flood Manager",
	sensors: [
  	{ name: "s_leak_floor_1", device: "wb-gpio", control: "EXT4_IN13" },
  	{ name: "s_leak_floor_2", device: "wb-gpio", control: "EXT4_IN14", activationValue: 1 },
	],
	valve_relay: { device: "wb-gpio",	control: "EXT3_R3AXXX", activationValue: false },  // EXT3_R3A3

	onWet: function() {
		log("Flood found !");

		//  email  //
		//dev["email_manager"]["send"] = "Обнаружена протечка !!";

		//  sms  //
		//dev["sms_manager"]["send"] = "Flood found !!";
	},
	onDry: function() {
		log("No flood anymore =)");
	}
});

// config.safeRotation_cron = "0 0 0 * * SAT" default - every saturday at 0:00 (GMT 0)
// "0 0 0 * * *" - every day at 0:00 (GMT 0)
// "0 0 * * * *" - every hour (GMT 0)

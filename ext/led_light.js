"use strict";
// gcos circuit specification interface instance
//
// led_light
// 
// Assumption:
//   - This is a resource basis definition.
//   - An instance will be created for each basis used for all enumerated in config file resources 
//   - Led that can be turned on and off.
//
// Filenaming
//
//   - Assume led_light.js (this file) is in the ./ext/led_light.js file.
//   - This file is loaded when led_light basis configuration record is read.
//
// Circuit Design
//
//   - Start -> GPIO Pin X (in config file) ->  Long Led lead -> 
//              330k ohm resistor -> Terminate GND/0V
var module_name = "led_light";
//
//var debug = require('debug')('http'), http = require('http'), name = module_name;
var debug = require("debug")(module_name);
//
debug("debug enabled in module: " + module_name);
//
// Place your module global variables here, you will be able to see them
// in the init module when "init" is started.  
//
// Key idea:  the owner can control certain variables at init time as we move
// foreward dynamically, say, they want to change the gpio port based on config
// for testing or other purposes.  It is better to have a standard value for the
// the basis module, read it, and then store it from init time frame.
//
// If you don't wish your users that flexablity, you can at least put in config
// file, and lastly you can set in your code if an absolute must.
//
//
var State = null;   // 0  - ready state for init, 1 - start, stop and toggle, 2 - after stop, ready for unload, rest to 0
var Gpio = null;
var led = null;

var gpio_pin  = 0;
var gpio_mode = 'out';

//
// init function - used to establish the gpio such that can start, stop and toggle the device
//
//                 The core GPIO command is provided, and return data. The data can be augmented
//                 as needed.
//
function init(req) {   // TODO PERRY  Need to handle > 1 GPIO pin, e.g could enable several

 // Dump gpio object for example

  debug("led_light sample gpio object", JSON.stringify(req));

 // Assign the information needed for on/off api from the gpio object

  // user defines the data structure and variable names in json confiuguation file (see gcons.ini)
  gpio_pin  = req.gpio_basis.led_pin.led_gpio_pin;
  gpio_mode = req.gpio_basis.led_pin.led_mode;

  debug("Module [" + module_name + "] init [Mode: " + gpio_mode + " Pin: " + gpio_pin + "]");

 try {
  // Gpio = require("onoff").Gpio, led = new Gpio(Gpio_pin, Gpio_mode),  iv;
  Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
  led = new Gpio(gpio_pin, gpio_mode);         // Export GPIO #14 as an output.
 } catch (err) {
	console.log("Error: " + err);
	return (err);
 }

 debug("init complete");

  var data_response = {
 	"module"      : module_name,
 	"method"      : "init",
	"status"      : "OK", 	
 	"return_code" : 200
 };

 return(data_response);
} 

function start(req) {

 debug("start started", req);

 var result = led.writeSync(1);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "start",
 	"status"      : "tbd",	
 	"return_code" : 200
  };

 
 debug("start complete")

 return(data_response);
}

function status(req) {

 debug("status started", req)

 var result = led.readSync();

 var data_response = {
 	"module"      : module_name,
 	"method"      : "status",
 	"status"      : "tbd",
 	"pin_read"    : led.readSync(),
 	"return_code" : 200
 };

 debug("status complete")
	
 return(data_response)
}

function stop(req) {

 debug("stop started", req)

 var result = led.writeSync(0);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "stop",
 	"status"      : "tbd",
 	"return_code" : 200
 };

 debug("stop complete")
	
 return(data_response)
}

function toggle(req) {


 debug("toggle started", req)

 var result = led.writeSync(led.readSync() ^ 1);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "toggle",
 	"status"      : "tbd",
 	"return_code" : 200
 };

 debug("toggle complete")

  return(data_response)
}

function unload(req) {

 debug("unload started", req);

 var result = led.unexport();

 var data_response = {
 	"module"      : module_name,
 	"method"      : "unload",
 	"status"      : "tbd", 	
 	"return_code" : 200
 };

 debug("unload complete")	

 return(data_response)
}


exports.init   = init;     // Configure the Gpio device, including pin and mode
exports.start  = start;    // Engage Gpio swtich to start circuit operation
exports.status = status;   // Query resource basis, this is part static and rest module specifics
exports.stop   = stop;     // Disable Gpio switch to stop circuity operation
exports.toggle = toggle;   // Swtich a resorce basis from state to state (more than one state support, implementation by client)
exports.unload = unload;   // Export the unloading of the function when done

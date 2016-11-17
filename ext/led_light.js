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
// State TBD
var State = null;   // 0  - ready state for init, 1 - start, stop and toggle, 2 - after stop, ready for unload, rest to 0
var Gpio = null;
var led = null;

var Gpio_pin  = 0;
var Gpio_mode = 'out';

//
// init function - used to establish the gpio such that can start, stop and toggle the device
//
//                 The core GPIO command is provided, and return data. The data can be augmented
//                 as needed.
//
function init(gpio_mode, gpio_pin) {   // TODO PERRY  Need to handle > 1 GPIO pin, e.g could enable several

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
 	"return_code" : "200"
 };

 return(data_response);
} 

function start(data) {

 debug("start started");

 var result = led.writeSync(1);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "start",
 	"status"      : "tbd",	
 	"return_code" : "200"
  };

 
 debug("start complete")

 return(data_response);
}

function status(data) {

 debug("status started")

 var result = led.readSync();

 var data_response = {
 	"module"      : module_name,
 	"method"      : "status",
 	"status"      : "tbd",
 	"pin_read"    : led.readSync(),
 	"return_code" : "200"
 };

 debug("status complete")
	
 return(data_response)
}

function stop(data) {

 debug("stop started")

 var result = led.writeSync(0);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "stop",
 	"status"      : "tbd",
 	"return_code" : "200"
 };

 debug("stop complete")
	
 return(data_response)
}

function toggle(data) {


 debug("toggle started")

 var result = led.writeSync(led.readSync() ^ 1);

 var data_response = {
 	"module"      : module_name,
 	"method"      : "toggle",
 	"status"      : "tbd",
 	"return_code" : "200"
 };

 debug("toggle complete")

  return(data_response)
}

function unload(data) {

 debug("unload started")

 var result = led.unexport();

 var data_response = {
 	"module"      : module_name,
 	"method"      : "unload",
 	"status"      : "tbd", 	
 	"return_code" : "200"
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

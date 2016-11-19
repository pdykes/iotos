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
var module_name = "led_push_button_yellow";
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
var button = null;
var led = null;

var gpio_button_pin  = 0;
var gpio_button_mode = null;
var gpio_button_opt = null;
var gpio_led_pin  = 0;
var gpio_led_mode = null;


//
// init function - used to establish the gpio such that can start, stop and toggle the device
//
//                 The core GPIO command is provided, and return data. The data can be augmented
//                 as needed.
//
function init(gpio_object) {   // TODO PERRY  Need to handle > 1 GPIO pin, e.g could enable several

 // Dump gpio object for example

  debug("led_light sample gpio object" + JSON.stringify(gpio_object));

 // Assign the information needed for on/off api from the gpio object

  // user defines the data structure and variable names in json confiuguation file (see gcons.ini)
  gpio_led_pin  = gpio_object.led_pin.led_gpio_pin;
  gpio_led_mode = gpio_object.led_pin.led_mode;

  gpio_button_pin  = gpio_object.button_pin.button_gpio_pin;
  gpio_button_mode = gpio_object.button_pin.button_mode;
  gpio_button_opt  = gpio_object.button_pin.button_edge;

  debug("LED Module [" + module_name + "] init [Mode: " + gpio_led_mode + " Pin: " + gpio_led_pin + "]");
  debug("Button Module [" + module_name + "] init [Mode: " + gpio_button_mode + " Pin: " + gpio_button_pin + " Option: " + gpio_button_opt +"]");

 try {
  // Gpio = require("onoff").Gpio, led = new Gpio(Gpio_pin, Gpio_mode),  iv;
  Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
  led = new Gpio(gpio_led_pin, gpio_led_mode),
  button = new Gpio(gpio_button_pin, gpio_button_mode, gpio_button_opt);     // Export GPIO #14 as an output.
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

 button.watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value === 0) {
    console.log('Yellow Warning BUTTON PRESSED!');
  } else {
    console.log('Yellow Warning BUTTON RELEASED!');
    led.writeSync(led.readSync() ^ 1);
  }

  // toggle light with each press/release cycle on light

  // button.unexport(); // Unexport GPIO and free resources
 });

 // var result = led.writeSync(1);

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

 var resultl = led.readSync();
 var resultb = button.readSync();

 var data_response = {
 	"module"      : module_name,
 	"method"      : "status",
 	"status"      : "tbd",
 	"pin_led_read"      : resultl,
  "pin_button_read"   : resultb,
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

 var resultl = led.unexport();
 var resultb = button.unexport();

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

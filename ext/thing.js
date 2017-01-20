"use strict";
// iotos circuit specification interface instance
//
// thing
// 
// Assumption:
//   - This is a resource basis definition.
//   - An instance will be created for each basis used for all enumerated in config file resources 
//   - thing that can be turned on and off.
//
// Filenaming
//
//   - Assume thing.js (this file) is in the ./ext/thing.js file.
//   - This file is loaded when thing basis configuration record is read.
//
// Circuit Design
//
//   - Start -> GPIO Pin X (in config file) ->  Long thing lead -> 
//              330k ohm resistor -> Terminate GND/0V
//
// Example Goal
//
//   - Establish a thing resource that can publish
//   - Unique function in this case is to report status at start to remote service
//   - Also, upon stop, this would provide some computed value
//
//
var module_name = "thing_push_button_yellow";
//
//var debug = require('debug')('http'), http = require('http'), name = module_name;
var debug = require("debug")(module_name);
//
debug("debug enabled thing in module: " + module_name);
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
var State = null; // 0  - ready state for init, 1 - start, stop and toggle, 2 - after stop, ready for unload, rest to 0
var Gpio = null;
var button = null;
var thing = null;

var gpio_button_pin = 0;
var gpio_button_mode = null;
var gpio_button_opt = null;
var gpio_thing_pin = 0;
var gpio_thing_mode = null;


//
// init function - used to establish the gpio such that can start, stop and toggle the device
//
//                 The core GPIO command is provided, and return data. The data can be augmented
//                 as needed.
//
function init(req) { // TODO PERRY  Need to handle > 1 GPIO pin, e.g could enable several

    // Dump gpio object for example

    debug("thing_push_button_yellow button/light sample gpio object" + JSON.stringify(req));

    // Assign the information needed for on/off api from the gpio object

    // user defines the data structure and variable names in json confiuguation file (see gcons.ini)
    gpio_thing_pin = req.gpio_basis.thing_pin.thing_gpio_pin;
    gpio_thing_mode = req.gpio_basis.thing_pin.thing_mode;

    gpio_button_pin = req.gpio_basis.button_pin.button_gpio_pin;
    gpio_button_mode = req.gpio_basis.button_pin.button_mode;
    gpio_button_opt = req.gpio_basis.button_pin.button_edge;

    debug("thing Module [" + module_name + "] init [Mode: " + gpio_thing_mode + " Pin: " + gpio_thing_pin + "]");
    debug("Button Module [" + module_name + "] init [Mode: " + gpio_button_mode + " Pin: " + gpio_button_pin + " Option: " + gpio_button_opt + "]");

    try {
        // Gpio = require("onoff").Gpio, thing = new Gpio(Gpio_pin, Gpio_mode),  iv;
        Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
            thing = new Gpio(gpio_thing_pin, gpio_thing_mode),
            button = new Gpio(gpio_button_pin, gpio_button_mode, gpio_button_opt); // Export GPIO #14 as an output.
    } catch (err) {
        console.log("Error: " + err);
        return (err);
    }

    debug("init complete");

    var data_response = {
        "module": module_name,
        "method": "init",
        "status": "OK",
        "return_code": 200
    };

    return (data_response);
}

function start(req) {

    debug("start started");

    button.watch(function (err, value) {
        if (err) {
            throw err;
        }

        if (value === 0) {
            console.log('Yellow Warning BUTTON PRESSED!');
        } else {
            console.log('Yellow Warning BUTTON RELEASED!');
            thing.writeSync(thing.readSync() ^ 1);
        }

        // toggle light with each press/release cycle on light

        // button.unexport(); // Unexport GPIO and free resources
    });

    // var result = thing.writeSync(1);

    var data_response = {
        "module": module_name,
        "method": "start",
        "value": 0,
        "status": "starting",
        "return_code": 200
    };


    debug("start complete")

    return (data_response);
}

function status(req) {

    debug("status started")

    var resultl = thing.readSync();
    var resultb = button.readSync();

    var number = /* simulated value */ 8 * 1 * 2;

    debug("simulated compute value: ", number);

    var data_response = {
        "module": module_name,
        "method": "status",
        "status": "tbd",
        "value": number,
        "pin_thing_read": resultl,
        "pin_button_read": resultb,
        "return_code": 200
    };

    debug("status complete")

    return (data_response)
}

function stop(req) {

    debug("stop started")

    var result = thing.writeSync(0);

    var number = /* simulated value */ 8 * 2 * 4;

    debug("simulated compute value: ", number);

    var data_response = {
        "module": module_name,
        "method": "stop",
        "value": number,
        "status": "stopped",
        "return_code": 200
    };

    debug("stop complete")

    return (data_response)
}

function toggle(req) {


    debug("toggle started - not a focus of this example")

    var result = thing.writeSync(thing.readSync() ^ 1);

    var data_response = {
        "module": module_name,
        "method": "toggle",
        "status": "tbd",
        "return_code": 200
    };

    debug("toggle complete")

    return (data_response)
}

function unload(req) {

    debug("unload started")

    var resultl = thing.unexport();
    var resultb = button.unexport();

    var data_response = {
        "module": module_name,
        "method": "unload",
        "status": "tbd",
        "return_code": 200
    };

    debug("unload complete")

    return (data_response)
}


exports.init = init; // Configure the Gpio device, including pin and mode
exports.start = start; // Engage Gpio swtich to start circuit operation
exports.status = status; // Query resource basis, this is part static and rest module specifics
exports.stop = stop; // Disable Gpio switch to stop circuity operation
exports.toggle = toggle; // Swtich a resorce basis from state to state (more than one state support, implementation by client)
exports.unload = unload; // Export the unloading of the function when done

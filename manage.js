// Grand Challenge PI Web OS  (iotos)
//
// Goal of manage component to is provide a command line to manage iotos instnaces.
//
// a) Enable resources to be accessed and used by all players
// b) Provide a structure to communicate between pi, and each ones specific resources
// c) Direct pis to be able to provide data back to consumers and to cloud
// d) Provide inventory of functions available on a specific pi
// e) Proivde access control of who can access a given resource
// f) Enable exclusive and shared usage by consumers
// g) This command should be operating system neutral
//
// Static PI URLS based on onboard engineering
// Standardized across all PIs by engineering team
// Not all boards need to have all active, see
//
var module_name = "manage";

//var debug = require('debug')('http'), http = require('http'), name = module_name;
var debug = require("debug")(module_name);

debug("debug enabled in module: %s", module_name);

var basis_busy = "1";
var basis_available = "0";

var url_root = "/api/v01";

var exit_count = 1;

// mqtt values begin  TODO PERRY - put in iotos.ini file

var mqtt_host             = null;
var mqtt_private_key      = null;
var mqtt_client_cert      = null;
var mqtt_ca_certificate   = null;
var IoT_Monitoring        = false;

// IOT Materials

//Environment Configuration
debug("Configuring MQTT/IoT Support");

var AWS = require('aws-iot-device-sdk');
const deviceModule = AWS.device;

var config = {};
config.IOT_BROKER_ENDPOINT      = null;
config.IOT_BROKER_REGION        = null;
config.IOT_THING_NAME           = null;
config.IOT_Queue                = null;

//Loading AWS SDK libraries

// AWS.config.region = config.IOT_BROKER_REGION;


//Initializing client for IoT
// var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});
var mqtt_publish_queue = config.IOT_Queue;

// mqtt values end

var instance_name_found = false;  // used to sort through all target and find one of focus for this run



// parse cli

debug("Command line Processing begin");

// process command line args
const commandLineArgs = require('command-line-args');

var cfg_file = 'iotos.ini';

const clidef = ([
  { name: 'verbose',      type: Boolean, multiple: false, alias: 'v' },
  { name: 'directive',    type: String,  multiple: false, alias: 'd' },
  { name: 'resource',     type: String,  multiple: false, alias: 'r' },  
  { name: 'targethost',   type: String,  multiple: false, alias: 't' },
  { name: 'port',         type: Number,  multiple: false, alias: 'p' },
  { name: 'configFile',   type: String,  multiple: false, alias: 'f', defaultValue: cfg_file },
  { name: 'json_data',    type: String,  multiple: false, alias: 'j', defaultValue: null },
  { name: 'alexa',        type: Boolean, multiple: false, alias: 'a' },
  { name: 'help',         type: Boolean, multiple: false, alias: 'h' }
]);


var cli_options = null;

try {
   debug("clidef: ", clidef);
   cli_options = commandLineArgs(clidef);
   debug("cli_options: ", cli_options);
} catch (e) {
    debug("Error processing cli items", e);
    help(e);
    return("Please enter valid command line to start iotos CLI");
}


// anchor data structure

var SortedArrayMap = require("collections/sorted-array-map");

var target_cache   = SortedArrayMap([]);

// populate the configuration file

/*

Concept - have a sorted map of target IoT devices [target_cache()], and for each have these
          data structures

          resource_cache()      - resource description per targe cache, list of all resources included for that device
          permissions_cache()   - permissions cache, e.g. which users are allowed to access which target/resource [TBD]
          data_routing_cache()  - data publishing target cache for each target, enables how and where to route data as device
                                  reports information
          it_config_cache()     - it information cache, enables that is used to reach other computers   

*/

function process_configuration_structure () {
/* tried to refactor a bit, need to consider this later due to the issues encountered
var cfg_json_parse = require("./parsecfg.js");

cfg_json_parse.iotosf();
*/

 debug("Creating Resource Mappings from [" + resource_mappings_file + "]");


 for(var TargetKey in json) {
  debug("Target Key processing:"+ TargetKey);

  var target_check = target_cache.get(TargetKey);

  if (target_check == null) {

    // ----queue cache---------------------------------------------------------------------------
    // This section established the lookup cache that correlates a given
    // incoming email subject to the subqueue clients will subscribe to.

    // Setup runtime caches which offer various functions
    //  - Higher performance lookup vectors for each query
    //  - Direct access arrays (with keys from above) to access basis circuits
    //  - Direct access arrays (with keys from above) to access URL circuits

    target_entry = {
        target_id          : TargetKey,
        resource_cache     : new SortedArrayMap([]),
        permissions_cache  : new SortedArrayMap([]),
        data_routing_cache : new SortedArrayMap([]),
        resource_lookup    : [],
        resource_status    : [],
        it_config          : null,
        thishost           : false
     };

     target_cache.set(TargetKey,target_entry);
  } else {
     err = new Error("Error: TargetKey defined more than once in configuration. Modify the configuration.");
     return err;
  }

  if (TargetKey == instance_name) {      
      instance_name_found = true;    // this may be removed, not sure required
      target_entry.thishost = true;  // override the default setting      
  }

  

      var objectl2 = json[TargetKey];
      for(var Resource_Mapping in objectl2) {
          var objectl3 = objectl2[Resource_Mapping]
          var category = Resource_Mapping;
          for(var Cfg_Mapping in objectl3) {
            var objectl4 = objectl3[Cfg_Mapping];

            // if (debug == "true") {
            //      console.log("resource object14:" + JSON.stringify(objectl4,null,4));   
            // }

            if (category == "resources") {
              target_entry.resource_cache.set(Cfg_Mapping,objectl4);

              // if (debug  == 'true') {
              // console.log("resources key:" + Cfg_Mapping);
              // console.log("resources object:" + JSON.stringify(objectl4,null,4));
              // }

              if (objectl4.hasOwnProperty('instance')) {

                var instance_id = objectl4.instance;
                var basis_id = objectl4.basis;

                
                debug("instance_id: " + instance_id);
                debug("basis_id: " + basis_id);
                debug("target_entry.resource_status[basis_id]: ", target_entry.resource_status[basis_id]);
                
                // only create second dimension once for each basis_id 

                target_entry.resource_status[basis_id]  = ( typeof target_entry.resource_status[basis_id] != 'undefined' && target_entry.resource_status[basis_id] instanceof Array ) ? target_entry.resource_status[basis_id] : [];

                // resource_status[basis_id] = [];                  // resource status is double array, need to create

                target_entry.resource_lookup[Cfg_Mapping] = objectl4;                      // Store cached inforation used during runtime
                target_entry.resource_status[basis_id][instance_id] = objectl4;

                target_entry.resource_lookup[Cfg_Mapping].busy = '0';         // track if local resource busy
                target_entry.resource_lookup[Cfg_Mapping].activated = '0';    // track if local resource busy
                target_entry.resource_lookup[Cfg_Mapping].rejected = '0';     // track if local resource reject count
                target_entry.resource_lookup[Cfg_Mapping].count = '0';        // track if local resource invocation count

                target_entry.resource_status[basis_id][instance_id].busy = '0';            // track if underlying resource busy
                target_entry.resource_status[basis_id][instance_id].activated = '0';       // track underlying resource count
                target_entry.resource_status[basis_id][instance_id].rejected = '0';        // track underlying resource reject count
                target_entry.resource_status[basis_id][instance_id].count = '0';           // track underlying resource invocation count
                target_entry.resource_status[basis_id][instance_id].module = null;         // during the init sequence will load this resource basis module

                debug("resource lookup object[" + Cfg_Mapping + "]:" + JSON.stringify(target_entry.resource_lookup[Cfg_Mapping],null,4));
                debug("resources status object[" + basis_id + "][" + instance_id + "]:" + JSON.stringify(target_entry.resource_status[basis_id][instance_id],null,4));
              } else {  // IT Configuration Use case

                // Putting the IT Config in the resources probably not by best architectural move, but until fix  PERRY TODO
                if (objectl4.hasOwnProperty('port')) {
                  target_entry.it_config = objectl4;
                  debug("IT Config for target " + TargetKey + " is: ", JSON.stringify(target_entry.it_config));
                }

              }
            }

            if (category == "permissions") {
              target_entry.permissions_cache.set(Cfg_Mapping,objectl4);
              debug("permissions key:" + Cfg_Mapping);
              debug("permissions object:" + JSON.stringify(objectl4,null,4));
            }

            if (category == "data_routing") {
              target_entry.data_routing_cache.set(Cfg_Mapping,objectl4);
              debug("data routing key:" + Cfg_Mapping);
              debug("data routing object:" + JSON.stringify(objectl4,null,4));
            }  
          }   // for
      }    // for
    debug("Target " + TargetKey + " content: ", JSON.stringify(target_entry,null,4));  
  }  // for  
}

// resources - this list should grow very large, always
// synchronize with the standard configuration.json file

var uri_ping                  = "/ping";
var uri_control               = "/control";
var uri_access_control        = "/acl";
var uri_manage                = "/manage";

var internal_IT             = "internal_IT";

// iotos os build version

// Initial version.
// var iotos_version            = "v0.0.1 11/08/2016";

// Enabled help, in memory caches, command lines for ctrl and manage. Also
// added URI handling, extension by team members and access controls.
var iotos_version            = "v0.0.4 (mvp4) 01/02/2017";

var os = require('os');
var os_platform = os.platform();
var os_arch = os.arch();
console.log('Management Command [os:' + os_platform + ' arch:' + os_arch + ']');

// var Gpio = null;

// if ((os_arch == "arm") && (os_platform == "linux")) {
//  Gpio = require('onoff').Gpio;
// }

// config property tools
var PropertiesReader = require('properties-reader');

// use to process several content types for restful interaction
var bodyParser = require('body-parser');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// web framework
var express = require('express');

var app = express();

// setup post post processing
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// default ini file eventNotifier.ini, users can override

var voice_control = false;
var alexa_control = false;    // alexa is the first voice interface I'm pursuing
var google_control = false;   // google browser and mobile be the next effort (PERRY TODO)

var target_host   = null;     // value must be from .ini or commandline
var instance_port = null;     // value must be from .ini or commandline
var instance_ip   = null;     // value set via config file, set by ini

var command_resource  = null;
var command_directive = null;
var command_data_json = null;

function help(err) {
  console.log("Command options:");
  console.log(" --verbose/-v    - Verbose Mode at startup");
  console.log(" --directive/-d  - Directive mode*");
  console.log(" --resource/-r   - Name of resource*");
  console.log(" --port/-p       - Target port override");  
  console.log(" --targethost/-t - Target host override");
  console.log(" --configFile/-f - Configuration file"); 
  console.log(" --json_data/-j  - JSON data");
  console.log(" --alexa/-a      - Voice via Amazon Alexa technology");
  console.log("");
  console.log(" --help/-h       - Help"); 
  console.log("");
  console.log(" * required");
  if (err !=null ) {
    console.log("");
    console.log("command line error: " + err);
  }
}

// NOTE:  it is possible to run more than one iotos on the same PI, especially for testing,
//        and each instance on same system should not interrupt the other's operation, hence
//        -name "player_2" -port "8081" -cfg "player_2.ini"


alexa_control = cli_options.alexa;
if (alexa_control == true) {
  voice_control = true;
  var message_str = "iotos cli Amamzon/Alexa Voice Control enabled (-a)";
  debug(message_str);
} else {
  debug ("Voice Control Not Enabled ");
}

if (voice_control == false) {
  command_resource = cli_options.resource;
  if (command_resource == null) {
   var message_str = "iotos cli resource (-r) value not provided";
   debug(message_str);
   return(message_str);
  } else {
   debug ("Requested single command: " + command_resource);
  }

  command_directive = cli_options.directive;
  if (command_directive == null) {
    var message_str = "iotos cli resource command value not provided";
    debug(message_str);
    return(message_str);
  } else {
    debug ("Requested directive: " + command_directive);
  } 
} else {
  var message_str = "iotos cli Entering Voice Preperation Mode"; 
  debug(message_str); 
  console.log(message_str);
}

debug("Help option processing.");

var help_option = cli_options.help;

if (help_option == true) {
  help();
  return;
}

if (cli_options.alexa == true) {
  voice_control = true;  
  var info_message = "iotos CLI Voice Management Enabled, Alexa Feture, Connecting to AWS IoT";
  debug(info_message);
  console.log(info_message);
}

debug("Command line option defaults or overrides:" + JSON.stringify(cli_options, null, 4));

var properties = null;

try {
 debug("Properties File: " + cli_options.configFile);
 properties = PropertiesReader(cli_options.configFile);
} catch (e) {
  console.log("Problem parsing property file:" + e);
  throw new Error("Corrupted or not found:" + cli_options.configFile);
}

// load the json confiugration file, override port in file if specitify the commandline

var resource_mappings_file = null;

try {
  resource_mappings_file = properties.get('iotos.config');  //Get URL and other paramters
} catch (err) {
  console.log("iotos CLI Error opening iotos.ini file, error: ", err);
  return;
}

debug("Resource mapping file: " + resource_mappings_file);

var fs = require('fs');

var json = null;

try {
 json = JSON.parse(fs.readFileSync(resource_mappings_file, 'utf8'));
} catch (e) {
  console.log("Problem parsing config attribute:" + e);
  // no use continuing
  return new Error("Corrupted:" + resource_mappings_file);
}

if (cli_options.targethost == null) {   // if a user does not override, must be in config file
  target_host = properties.get('iotos.name');   // default
} else {
  target_host = cli_options.targethost;  // if set, overrides any configuration
}


try {
 if ((alexa_control == true) && (voice_control == true)) {
  // pull in configuration data
  mqtt_host                    = properties.get('voice-control.mqtt_host'); 
  mqtt_private_key             = properties.get('voice-control.mqtt_private_key');
  mqtt_client_cert             = properties.get('voice-control.mqtt_client_cert');
  mqtt_ca_certificate          = properties.get('voice-control.mqtt_ca_certificate');  
  config.IOT_BROKER_ENDPOINT   = properties.get('voice-control.IOT_BROKER_ENDPOINT');
  config.IOT_BROKER_REGION     = properties.get('voice-control.IOT_BROKER_REGION');
  config.IOT_THING_NAME        = properties.get('voice-control.IOT_THING_NAME');
  config.IOT_Queue             = properties.get('voice-control.IOT_Queue');
 }
} catch (err) {
  console.log("Problem parsing voice configuation attributes in iotos.ini:", e);
  return;
}


var verified_json_data = null;
var verified_json_data_fname = cli_options.json_data;

debug("verified_json_data_fname command line value: " + verified_json_data_fname);

if (verified_json_data_fname !== null) {
  try {
   verified_json_data = JSON.parse(fs.readFileSync(verified_json_data_fname, 'utf8'));
   debug(verified_json_data_fname + " formatted json: ", JSON.stringify(verified_json_data,null,4));
  } catch (e) {
   console.log("Problem parsing json_data file:" + verified_json_data_fname + " Error: " + e.message);
   throw new Error("Malformed or not found:" + verified_json_data_fname);
  }
}


debug("target_host: " + target_host);

if (target_host == null) {
  console.log("iotos Error - Target host name not set in command line or configuration file");
  return new Error("iotos Error - Target host name not set in command line or configuration file");
}

 //  Server bootstrap

console.log("iotos Version " + iotos_version + " Target host: " + target_host); 
console.log("iotos Initializing Resource Mapping: " + resource_mappings_file);

var IT_configuration = "";  // this can be overriden by command line

var target_host_found = false;

var instance_name = target_host;

debug("Target Host Value: " + instance_name);

debug("processing configuration");

process_configuration_structure();


if (!instance_name_found) {
  console.log("iotos Instance Name [" + target_host + "] not configured, must be added to configuration file");
  return new Error("iotos Instance Name [" + target_host + "] not configured, must be added to configuration file");
}

// Enable talking to target iotos host, for voice this is repeated
var Client = require('node-rest-client').Client;
var client = new Client();

function process_request(target, resource, directive) {

  // if user sets these, he is overiding the configuration file, which is ok for *this* instance
  // Others cannot be be overrideen that are referred to.  This allows running more than once instnace
  // in the same PI concurrently (testing, advanced use, etc...)

  debug("Function process_request entry target[" + target + "] resource[" + resource + "] directive[" + directive + "]");

  if ((target     == null) ||
      (resource   == null) || 
      (directive  == null)) 
  {
    console.log("iotos CLI Process requested missing key attributes, try again. Enable debug for more detail [set DEBUG=manage] (export for unix), restart.");
    return;
  } 

  var instance_port = cli_options.port;

  debug("Target Host Value: " + target);

  var target_host_record = target_cache.get(target);

  // debug("Target Host record: " + JSON.stringify(target_host_record,null,4));  // great deal of data

  IT_configuration = target_host_record.resource_cache.get(internal_IT);  // json parsed earlier

  if (instance_port == null) {  // read from configuration
    console.log("iotos Port assigned from config file: " + IT_configuration.port);
    console.log("iotos IP Address assigned from config file: " + IT_configuration.ip);
    instance_port = IT_configuration.port;
    instance_ip = IT_configuration.ip;
  }

  debug("iotos Instance: " + target + " on " + instance_port + " initializing...");

  debug("iotos Web reference information:" + JSON.stringify(IT_configuration));

  // get details for the instance we are working with

  debug("resource lookup object[" + resource + "]:" + JSON.stringify(target_host_record.resource_lookup[resource],null,4));

  if (target_host_record.resource_lookup[resource] == null) {
    console.log("iotos CLI resource not found: [" + resource + "] Check: " + resource_mappings_file);
    return;
  }

  var resource_basis    = target_host_record.resource_lookup[resource].basis;
  var resource_instance = target_host_record.resource_lookup[resource].instance;

  debug("Target Resource: " + resource + " Basis: " + resource_basis + " Instance: " + resource_instance);

  // POST method invocation 

  var iot_target = "http://" + instance_ip + ":" + instance_port + url_root;
  var iot_cmd    = "";

  debug("Targeting URL: ", iot_target);

  var control_request = false;
  var manage_request = false;
   
  switch (directive) {
     case "init" :
     case "initialize" :  // very useful for voice, as init not valid word
       iot_target = iot_target + uri_control;
       iot_cmd = "Init";
       control_request = true;
      break;
     case "start":
       iot_target = iot_target + uri_control;
       iot_cmd = "Start";
       control_request = true;     
      break;
     case "status":
       iot_target = iot_target + uri_control;
       iot_cmd = "Status";
       control_request = true;     
      break;
     case "stop":
     case "suspend" :  // very useful alias for voice, as stop often already used
       iot_target = iot_target + uri_control;
       iot_cmd = "Stop";
       control_request = true;     
      break;
     case "toggle":
       iot_target = iot_target + uri_control;
       iot_cmd = "Toggle";
       control_request = true;     
     break;        
    case "unload":
       iot_target = iot_target + uri_control;
       iot_cmd = "Unload";
       control_request = true;     
    break;
    case "listactive" :
    case "list active" :  // voice interpreter often uses spaces
       iot_target = iot_target + uri_manage;
       iot_cmd = "ListActive";
       manage_request = true;     
    break;  
   default:
     if (voice_control == false) {
      var message_str = "iotos CLI Unknown directive requested " + directive + ", exiting...";
      debug(message_str);
      return(message_str);
     }
  }

  var user_command = "iotos CLI " + iot_cmd + " request operation initiated to ";


  debug("iotos CLI Request ", user_command + iot_target);
  console.log("iotos CLI Request ", user_command + iot_target);

// set content-type header and data as json in args parameter 
  var args = {
      data: { 
        "command" :  directive,
        "resource" : resource,
        "instance" : target
      },
      headers: { "Content-Type": "application/json" }
    // headers: { "Content-Type": "application/x-www-form-urlencoded" }
  };

  debug("Arguments prepared for server (pre json data)");

  
  if (control_request === true) {
      args.data.json_data = {
        "content" : verified_json_data
        };
  }
  

  debug("IoT Target URL: ", iot_target);
  debug("Arguments relayed to server: ", JSON.stringify(args,null,4));

  if (verified_json_data != null) {
   console.log("iotos CLI Request custom data prepared. Enable to debug to view detail.");
  }


  client.post(iot_target, args, function (data, response) { // cli fire away model
    // parsed response body as js object 
    // console.log("Return value");
    // debug("Restful request result: ", JSON.stringify(response,null,4));
    // raw response 
    var message_str = "iotos CLI request result received: " + JSON.stringify(data,null,4);
    debug(message_str);
    console.log("iotos CLI result, enable debug for more detail.");
  });

} // process request


if (voice_control == true) {
 if (alexa_control == true) {

   console.log('iotos CLI voice control mode enabled, entering monitor mode, ^C to exit.');

   // Enable Connection to AWS
   const device = deviceModule({
      keyPath:              mqtt_private_key,
      certPath:             mqtt_client_cert,
      caPath:               mqtt_ca_certificate,
      clientId:             config.IOT_THING_NAME+"mgmt_broker_listener",
      region:               config.IOT_BROKER_REGION,
      keepalive:            30, 
      baseReconnectTimeMs:  350,
      host:                 mqtt_host,
   });   

/*
   process.on('SIGINT', () => {
    if (exit_count <= 1) {
     exit_count++;
     console.log('Received SIGINT.  Press Ctrl-C again to exit');
    } else {
     console.log('Received SIGINT.  Attempt cleanup, then exit.');
     process.exit();
   }
   });

  debug("SIGINT capability enabled"); 
  */

  debug("AWS IoT Command Mode Entered");

  // AWS IoT Handling
  device.subscribe(config.IOT_Queue);

  device.on('connect', function() {
    console.log('iotos CLI AWS IoT Connection Active');
  });
  device.on('close', function() {
    console.log('iotos CLI AWS IoT Connection Closed');
  });
  device.on('reconnect', function() {
    console.log('iotos CLI AWS IoT reconnect');
  });
  device.on('offline', function() {
         console.log('iotos CLI AWS IoT offline');
  });
  device.on('error', function(error) {
    console.log('iotos CLI AWS IoT error', error);
  });


  /* Expected Payload
  {
   "resource_control": {
    "target": "alpha",
    "resource": "river",
    "command": "initialize"
   }
  }

  */
  device.on('message', function(topic, payload) {

    try {

     var payload_json = null;

     debug("AWS IoT Message (Raw) Payload: ", payload.toString());

     payload_json = JSON.parse(payload, 'utf8');
     debug("Parsed payload: ", JSON.stringify(payload_json,null,4));

     var message_str = "iotos CLI AWS IoT received on topic: " + topic + " message: " + JSON.stringify(payload_json,null,4);
     debug(message_str);
     console.log(message_str);

     var target_endpoint  = payload_json.resource_control.target;
     var target_resource  = payload_json.resource_control.resource;
     var target_directive = payload_json.resource_control.command;

     message_str = "iotos CLI AWS IoT command entry dispatched: -t " + target_endpoint + " -r " + target_resource + " -d " + target_directive;
     debug(message_str);
     console.log(message_str);

     process_request(target_endpoint, target_resource, target_directive);

   } catch (err) {
     var message_str = "iotos CLI AWS IoT voice processing error, incoming payload: " + payload.toString() + 
      " Error:" + err;
     debug(message_str);
     console.log(message_str);     
   }

  });

 }  // end AWS control 
} // end voice control
 else { // assumption single command mode PERRY DO REPL possible?
  debug("Single Command Mode");
  process_request(target_host, command_resource, command_directive); 
  return("iotos CLI command execution complete.")
}

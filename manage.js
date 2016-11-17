// Grand Challenge PI Web OS  (gcos)
//
// Goal of manage component to is provide a command line to manage GCOS instnaces.
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

var instance_name_found = false;  // used to sort through all target and find one of focus for this run

// Nice catch, but Ctrl-D need to handle
process.on('SIGINT', () => {
 if (exit_count <= 1) {
   exit_count++;
   console.log('Received SIGINT.  Press Ctrl-C again to exit');
 } else {
   console.log('Received SIGINT.  Attempt cleanup, then exit.');
   process.exit();
 }
});

function process_configuration () {
/* tried to refactor a bit, need to consider this later due to the issues encountered
var cfg_json_parse = require("./parsecfg.js");

cfg_json_parse.gcosf();
*/

 debug("Creating Resource Mappings from [" + resource_mappings_file + "]");


 for(var PlayerKey in json) {
  debug("Target Key:"+ PlayerKey);
  if (PlayerKey == instance_name) {      // load uris only for this instance
      instance_name_found = true;
      var objectl2 = json[PlayerKey];
      for(var Resource_Mapping in objectl2) {
          var objectl3 = objectl2[Resource_Mapping]
          var category = Resource_Mapping;
          for(var Cfg_Mapping in objectl3) {
            var objectl4 = objectl3[Cfg_Mapping];

            // if (debug == "true") {
            //      console.log("resource object14:" + JSON.stringify(objectl4,null,4));   
            // }

            if (category == "resources") {
              resource_cache.set(Cfg_Mapping,objectl4);

              // if (debug  == 'true') {
              // console.log("resources key:" + Cfg_Mapping);
              // console.log("resources object:" + JSON.stringify(objectl4,null,4));
              // }

              if (objectl4.hasOwnProperty('instance')) {

                var instance_id = objectl4.instance;
                var basis_id = objectl4.basis;

                
                debug("instance_id: " + instance_id);
                debug("basis_id: " + basis_id);
                
                // only create second dimension once for each basis_id 

                resource_status[basis_id]  = ( typeof resource_status[basis_id] != 'undefined' && resource_status[basis_id] instanceof Array ) ? resource_status[basis_id] : [];

                // resource_status[basis_id] = [];                  // resource status is double array, need to create

                resource_lookup[Cfg_Mapping] = objectl4;                      // Store cached inforation used during runtime
                resource_status[basis_id][instance_id] = objectl4;

                resource_lookup[Cfg_Mapping].busy = '0';         // track if local resource busy
                resource_lookup[Cfg_Mapping].activated = '0';    // track if local resource busy
                resource_lookup[Cfg_Mapping].rejected = '0';     // track if local resource reject count
                resource_lookup[Cfg_Mapping].count = '0';        // track if local resource invocation count

                resource_status[basis_id][instance_id].busy = '0';            // track if underlying resource busy
                resource_status[basis_id][instance_id].activated = '0';       // track underlying resource count
                resource_status[basis_id][instance_id].rejected = '0';        // track underlying resource reject count
                resource_status[basis_id][instance_id].count = '0';           // track underlying resource invocation count
                resource_status[basis_id][instance_id].module = null;         // during the init sequence will load this resource basis module

                debug("resource lookup object[" + Cfg_Mapping + "]:" + JSON.stringify(resource_lookup[Cfg_Mapping],null,4));
                debug("resources status object[" + basis_id + "][" + instance_id + "]:" + JSON.stringify(resource_status[basis_id][instance_id],null,4));
              }
            }

            if (category == "permissions") {
              permissions_cache.set(Cfg_Mapping,objectl4);
              debug("permissions key:" + Cfg_Mapping);
              debug("permissions object:" + JSON.stringify(objectl4,null,4));
            }

            if (category == "data_routing") {
              data_routing_cache.set(Cfg_Mapping,objectl4);
              debug("data routing key:" + Cfg_Mapping);
              debug("data routing object:" + JSON.stringify(objectl4,null,4));
            }  
          }   // for
      }    // for
    }   // if this instance   
  }  // for  
}

// resources - this list should grow very large, always
// synchronize with the standard configuration.json file

var uri_ping                  = "/ping";
var uri_control               = "/ctrl";
var uri_access_control        = "/acl";

var internal_IT             = "internal_IT";

// gcos os build version

// Initial version.
// var gcos_version            = "v0.0.1 11/08/2016";

// Enabled help, in memory caches, command lines for ctrl and manage. Also
// added URI handling, extension by team members and access controls.
var gcos_version            = "v0.0.2 11/10/2016";

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

// process command line args
const commandLineArgs = require('command-line-args');

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
var cfg_file = 'gcos.ini';
var target_host   = null;     // value must be from .ini or commandline
var instance_port = null;     // value must be from .ini or commandline
var instance_ip   = null;     // value set via config file, set by ini

var command_resource  = null;
var command_directive = null;

function help(err) {
  console.log("Command options:");
  console.log(" --verbose/-v    - Verbose Mode at startup");
  console.log(" --directive/-d  - Directive mode*");
  console.log(" --resource/-r   - Name of resource*");
  console.log(" --port/-p       - Target port override");  
  console.log(" --targethost/-t - Target host override");
  console.log(" --configFile/-f - Configuration file"); 
  console.log(" --help/-h       - Help"); 
  console.log("");
  console.log(" * required");
  if (err !=null ) {
    console.log("");
    console.log("command line error: " + err);
  }
}

// NOTE:  it is possible to run more than one gcos on the same PI, especially for testing,
//        and each instance on same system should not interrupt the other's operation, hence
//        -name "player_2" -port "8081" -cfg "player_2.ini"

var directive     = "ctrl";
var host          = "192.168.1.111";
var resource      = "led_light";

const cli_optionDefinitions = [
  { name: 'verbose',      type: String,  multiple: false, alias: 'v', defaultValue: 'false' },
  { name: 'directive',    type: String,  multiple: false, alias: 'd', defaultValue: command_directive },
  { name: 'resource',     type: String,  multiple: false, alias: 'r', defaultValue: command_resource },  
  { name: 'targethost',   type: String,  multiple: false, alias: 't', defaultValue: target_host },
  { name: 'port',         type: Number,  multiple: false, alias: 'p', defaultValue: instance_port },
  { name: 'configFile',   type: String,  multiple: false, alias: 'f', defaultValue: cfg_file },
  { name: 'help',         type: Boolean, multiple: false, alias: 'h' }
]

var cli_options = null;

try {
   cli_options = commandLineArgs(cli_optionDefinitions);
} catch (e) {
    help(e);
    return("Please enter valid command line to start Grand Challenge OS (GCOS) CLI");
}

command_resource = cli_options.resource;
if (command_resource == null) {
  help();
  return;
} else {
  debug ("Requested command: " + command_resource);
}

command_directive = cli_options.directive;
if (command_directive == null) {
  help();
  return;
} else {
  debug ("Requested directive: " + command_directive);
}

var help_option = cli_options.help;

if (help_option == true) {
  help();
  return;
}

debug("Command line option defaults or overrides:" + JSON.stringify(cli_options, null, 4));

try {
 debug("Properties File: " + cli_options.configFile);
 var properties = PropertiesReader(cli_options.configFile);
} catch (e) {
  console.log("Problem parsing property file:" + e);
  throw new Error("Corrupted or not found:" + cli_options.configFile);
}

// load the json confiugration file, override port in file if specitify the commandline

var resource_mappings_file = properties.get('gcos.config');  //Get URL and other paramters

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
  target_host = properties.get('gcos.name');   // default
} else {
  target_host = cli_options.targethost  // if set, overrides any configuration
}

debug("target_host: " + target_host);

if (target_host == null) {
 console.log("GCOS Error - Target host name not set in command line or configuraiton file");
 return new Error("GCOS Error - Target host name not set in command line or configuraiton file");
}

//  Server bootstrap

console.log("GCOS Version " + gcos_version + " Target host: " + target_host); 
console.log("GCOS Initializing Resource Mapping: " + resource_mappings_file);

// ----queue cache---------------------------------------------------------------------------
// This section established the lookup cache that correlates a given
// incoming email subject to the subqueue clients will subscribe to.

// Setup runtime caches which offer various functions
//  - Higher performance lookup vectors for each query
//  - Direct access arrays (with keys from above) to access basis circuits
//  - Direct access arrays (with keys from above) to access URL circuits

var SortedArrayMap = require("collections/sorted-array-map");

var resource_cache     = SortedArrayMap([]);
var permissions_cache  = SortedArrayMap([]);
var data_routing_cache = SortedArrayMap([]);;

var IT_configuration = "";  // this can be overriden by command line

var target_host_found = false;

var instance_name = target_host;

debug("Target Host Value: " + instance_name);

var resource_lookup = [];
var resource_status = [];

/* tried to refactor a bit, need to consider this later due to the issues encountered
var cfg_json_parse = require("./parsecfg.js");

cfg_json_parse.gcosf();
*/

process_configuration();
/*
 debug("Creating Resource Mappings from [" + resource_mappings_file + "]");


 for(var PlayerKey in json) {
  // console.log("Player Key:"+ PlayerKey);
  if (PlayerKey == instance_name) {      // load uris only for this instance
      instance_name_found = true;
      var objectl2 = json[PlayerKey];
      for(var Resource_Mapping in objectl2) {
          var objectl3 = objectl2[Resource_Mapping]
          var category = Resource_Mapping;
          for(var Cfg_Mapping in objectl3) {
            var objectl4 = objectl3[Cfg_Mapping];

            // if (debug == "true") {
            //      console.log("resource object14:" + JSON.stringify(objectl4,null,4));   
            // }

            if (category == "resources") {
              resource_cache.set(Cfg_Mapping,objectl4);

              // if (debug  == 'true') {
              // console.log("resources key:" + Cfg_Mapping);
              // console.log("resources object:" + JSON.stringify(objectl4,null,4));
              // }

              if (objectl4.hasOwnProperty('instance')) {

                var instance_id = objectl4.instance;
                var basis_id = objectl4.basis;

                
                debug("instance_id: " + instance_id);
                debug("basis_id: " + basis_id);
                
                // only create second dimension once for each basis_id 

                resource_status[basis_id]  = ( typeof resource_status[basis_id] != 'undefined' && resource_status[basis_id] instanceof Array ) ? resource_status[basis_id] : [];

                // resource_status[basis_id] = [];                  // resource status is double array, need to create

                resource_lookup[Cfg_Mapping] = objectl4;                      // Store cached inforation used during runtime
                resource_status[basis_id][instance_id] = objectl4;

                resource_lookup[Cfg_Mapping].busy = '0';         // track if local resource busy
                resource_lookup[Cfg_Mapping].activated = '0';    // track if local resource busy
                resource_lookup[Cfg_Mapping].rejected = '0';     // track if local resource reject count
                resource_lookup[Cfg_Mapping].count = '0';        // track if local resource invocation count

                resource_status[basis_id][instance_id].busy = '0';            // track if underlying resource busy
                resource_status[basis_id][instance_id].activated = '0';       // track underlying resource count
                resource_status[basis_id][instance_id].rejected = '0';        // track underlying resource reject count
                resource_status[basis_id][instance_id].count = '0';           // track underlying resource invocation count
                resource_status[basis_id][instance_id].module = null;         // during the init sequence will load this resource basis module

                debug("resource lookup object[" + Cfg_Mapping + "]:" + JSON.stringify(resource_lookup[Cfg_Mapping],null,4));
                debug("resources status object[" + basis_id + "][" + instance_id + "]:" + JSON.stringify(resource_status[basis_id][instance_id],null,4));
              }
            }

            if (category == "permissions") {
              permissions_cache.set(Cfg_Mapping,objectl4);
              debug("permissions key:" + Cfg_Mapping);
              debug("permissions object:" + JSON.stringify(objectl4,null,4));
            }

            if (category == "data_routing") {
              data_routing_cache.set(Cfg_Mapping,objectl4);
              debug("data routing key:" + Cfg_Mapping);
              debug("data routing object:" + JSON.stringify(objectl4,null,4));
            }  
          }   // for
      }    // for
    }   // if this instance   
}  // for
*/

if (!instance_name_found) {
  console.log("GCOS Instance Name [" + target_host + "] not configured, must be added to configuration file");
  return new Error("GCOS Instance Name [" + target_host + "] not configured, must be added to configuration file");
}


// if user sets these, he is overiding the configuration file, which is ok for *this* instance
// Others cannot be be overrideen that are referred to.  This allows running more than once instnace
// in the same PI concurrently (testing, advanced use, etc...)

var instance_port = cli_options.port;

IT_configuration = resource_cache.get(internal_IT);  // json parsed earlier

if (instance_port == null) {  // read from configuration
  console.log("GCOS Port assigned from config file: " + IT_configuration.port);
  console.log("GCOS IP Address assigned from config file: " + IT_configuration.ip);
  instance_port = IT_configuration.port;
  instance_ip = IT_configuration.ip;
}

debug("GCOS Instance: " + target_host + " on " + instance_port + " initializing...");

debug("GCOS Web reference information:" + JSON.stringify(IT_configuration));

// get details for the instance we are working with

debug("resource lookup object[" + command_resource + "]:" + JSON.stringify(resource_lookup[command_resource],null,4));

if (resource_lookup[command_resource] == null) {
  console.log("GCOS resource not found: [" + command_resource + "] Check: " + resource_mappings_file);
  return;
}

var resource_basis    = resource_lookup[command_resource].basis;
var resource_instance = resource_lookup[command_resource].instance;

//Example POST method invocation 
var Client = require('node-rest-client').Client;
 
var client = new Client();

var iot_target = "http://" + instance_ip + ":" + instance_port + url_root;
var iot_cmd    = "";
 
switch (command_directive) {
   case "init":
     iot_target = iot_target + uri_control;
     iot_cmd = "Init";
    break;
   case "start":
     iot_target = iot_target + uri_control;
     iot_cmd = "Start";
    break;
   case "status":
     iot_target = iot_target + uri_control;
     iot_cmd = "Status";
    break;
   case "stop":
     iot_target = iot_target + uri_control;
     iot_cmd = "Stop";
    break;
   case "toggle":
     iot_target = iot_target + uri_control;
     iot_cmd = "Toggle";
   break;        
  case "unload":
     iot_target = iot_target + uri_control;
     iot_cmd = "Unload";
  break;
 default:
   console.log("GCOS Unknown directive requested " + directive + ", exiting...");
   return;
}

var user_command = "GCOS CLI Control " + iot_cmd + " Operation Initiated to ";


console.log(user_command + iot_target);

// set content-type header and data as json in args parameter 
var args = {
    data: { 
      "command" :  command_directive,
      "resource" : command_resource,
      "instance" : resource_instance
    },
    headers: { "Content-Type": "application/json" }
    // headers: { "Content-Type": "application/x-www-form-urlencoded" }
};
 
client.post(iot_target, args, function (data, response) {
    // parsed response body as js object 
    // console.log(data);
    // raw response 
    // console.log(response);
});

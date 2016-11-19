// Grand Challenge PI Web OS  (gcos)
//
// Goal of gcos component (web os for mulitple Rpi units to support game and model usage)
//
// a) Enable resources to be access and used by all players
// b) Provide a structure to communicate between pi, and each ones specific resources
// c) Direct pis to be able to provide data back to consumers and to cloud
// d) Provide inventory of functions available on a specific pi
// e) Proivde access control of who can access a given resource
// f) Enable exclusive and shared usage by consumers
//
// 
//
// Static PI URLS based on onboard engineering
// Standardized across all PIs by engineering team
// Not all boards need to have all active, see
//
var module_name = "gcos";

//var debug = require('debug')('http'), http = require('http'), name = module_name;
var debug = require("debug")(module_name);

debug("debug enabled in module: %s", module_name);

var basis_busy = "1";
var basis_available = "0";

var exit_count = 1;

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

// resources - this list should grow very large, always
// synchronize with the standard configuration.json file

var ping                  = "/ping";
var control               = "/ctrl";
var access_control        = "/acl";

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
console.log('GCOS Bootstrap [os:' + os_platform + ' arch:' + os_arch + ']');

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
var instance_name = null;  // value must be from .ini or commandline
var instance_port = null;  // value must be from .ini or commandline
var instance_ip = null;    // value set via config file, set by ini

function help(err) {
  console.log("Command options:");
  console.log(" --verbose/-v) - Verbose Mode at startup");
  console.log(" --name/-n     - Name of instance");
  console.log(" --port/-p     - Override the port setting");
  console.log(" --cfg/c       - Verbose Mode at startup");
}

// NOTE:  it is possible to run more than one gcos on the same PI, especially for testing,
//        and each instance on same system should not interrupt the other's operation, hence
//        -name "player_2" -port "8081" -cfg "player_2.ini"

const cli_optionDefinitions = [
  { name: 'verbose', type: String,  multiple: false, alias: 'v', defaultValue: 'false' },
  { name: 'name',    type: String,  multiple: false, alias: 'n', defaultValue: instance_name },
  { name: 'port',    type: Number,  multiple: false, alias: 'p', defaultValue: instance_port },
  { name: 'cfg',     type: String,  multiple: false, alias: 'c', defaultValue: cfg_file },
  { name: 'help',    type: Boolean, multiple: false, alias: 'h' }
]

var cli_options = null;

try {
   cli_options = commandLineArgs(cli_optionDefinitions);
} catch (e) {
    help(e);
    return("Please enter valid command line to start Grand Challenge OS (GCOS)");
}

var help_option = cli_options.help;

if (help_option == true) {
  help();
  return;
}

debug("Command line option defaults or overrides:" + JSON.stringify(cli_options, null, 4));

try {
 var properties = PropertiesReader(cli_options.cfg);
} catch (e) {
  console.log("Problem parsing property file:" + e);
  throw new Error("Corrupted or not found:" + cli_options.cfg);
}

// load the json confiugration file, override port in file if specitify the commandline

var resource_mappings_file = properties.get('gcos.config');  //Get URL and other paramters

var fs = require('fs');

var json = null;

try {
 json = JSON.parse(fs.readFileSync(resource_mappings_file, 'utf8'));
} catch (e) {
  console.log("Problem parsing config gcos.config attribute:" + e);
  // no use continuing
  return new Error("Corrupted:" + resource_mappings_file);
}

if (cli_options.name == null) {   // if a user does not override, must be in config file
  instance_name = properties.get('gcos.name');   // default
} else {
  instance_name = cli_options.name  // if set, overrides any configuration
}

if (instance_name == null) {
 console.log("GCOS Error - Instance not set in command line or configuraiton files");
 return new Error("GCOS Error - Instance not set in command line or configuraiton files");
}

//  Server bootstrap

console.log("GCOS Version " + gcos_version + " Instance: " + instance_name); 
console.log("GCOS Initializing Resource Mapping: " + resource_mappings_file);

// ----queue cache---------------------------------------------------------------------------
// This section established the lookup cache that correlates a given
// incoming email subject to the subqueue clients will subscribe to.

/* moved out..
 took out 11/15 watch in case problem
var fs = require('fs');

try {
 var json = JSON.parse(fs.readFileSync(resource_mappings_file, 'utf8'));
} catch (e) {
  console.log("GCOS Problem parsing config gcos.config attribute:" + e);
  throw new Error("Corrupted:" + resource_mappings_file);
}

// Setup runtime caches which offer various functions
//  - Higher performance lookup vectors for each query
//  - Direct access arrays (with keys from above) to access basis circuits
//  - Direct access arrays (with keys from above) to access URL circuits

*/

var SortedArrayMap = require("collections/sorted-array-map");

var resource_cache     = SortedArrayMap([]);
var permissions_cache  = SortedArrayMap([]);
var data_routing_cache = SortedArrayMap([]);;

var IT_configuration = "";  // this can be overriden by command line

var instance_name_found = false;

var resource_lookup = [];
var resource_status = [];



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


if (!instance_name_found) {
  console.log("GCOS Instance Name [" + instance_name + "] not configured, must be added to configuration file");
  return new Error("GCOS Instance Name [" + instance_name + "] not configured, must be added to configuration file");
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

console.log("GCOS Instance: " + instance_name + " on " + instance_port + " initializing...");

debug("GCOS Web reference information:" + JSON.stringify(IT_configuration));

// set attributes via json configuraiton file so for the most part data driven

// Restful handling infrastructure

// On windows, this will be mockup, on PI, it will load functions specific to purpose

app.get( IT_configuration.gcos_root_uri + '/', function (req, res) {
  res.send('GCOS version' + gcos_version + " " + instance_name + " on port " +  instance_port);
});

app.get( IT_configuration.gcos_root_uri + ping, function (req, res) {
  res.send('GCOS version' + gcos_version + " " + instance_name + " on port " +  instance_port);
});

/*  move to a control strategy vs. url per resource
app.get( IT_configuration.gcos_root_uri + red_warning_light + "/:id", function (req, res) {
	json_return_data = {
                          'status' : 'on',
                          'brightness'  :  '3',
                          'instance_id' : req.params.id,
                          'host' : req.headers.host,
                          'unit' : instance_name,
                          'port' : instance_port,
                          'url'  : "http://" + req.headers.host + IT_configuration.gcos_root_uri + 
                                   red_warning_light + "/" + req.params.id,
	                   };
	res.send('Light ' + req.params.id + ' state information: ' + JSON.stringify(json_return_data,null,4));
});
*/

app.post( IT_configuration.gcos_root_uri + access_control , function (req, res) {
  json_return_data = {
                          'participant'     : req.body.participant,
                          'request'         : req.body.request,               // allow or disallow
                          'host' : req.headers.host,
                          'unit' : instance_name,
                          'port' : instance_port,
                          'url'  : "http://" + req.headers.host + IT_configuration.gcos_root_uri + 
                                   access_control,
                     };
  res.send(access_control + " " + req.params.participant + ' state information: ' + 
          JSON.stringify(json_return_data,null,4));
});

app.post( IT_configuration.gcos_root_uri + control, function (req, res) {
  json_return_data = {
                          'command'     : req.body.command,                  // on, off, or other new ones
                          'participant' : req.body.participant,
                          'resource'    : req.body.resource,
                          'host'        : req.headers.host,
                          'unit'        : instance_name,
                          'port'        : instance_port,
                          'url'         : "http://" + req.headers.host + IT_configuration.gcos_root_uri + 
                                          control,
                     };

  // resource is the crtical attribute, lookup all other data from configuration for this iteration   
  var client_resource = req.body.resource;
  console.log("Client requested resource [" + client_resource + "]");

  var command = req.body.command;

  // Acquire resource object, anchor to other cache updates
  var resource_object = resource_cache.get(client_resource);

  if (resource_object == null) {
    console.log("Error: Client requested resource [" + client_resource + "] and not found! Resource not found.");
    res.status(404).send("Error: Client requested resource [" + client_resource + "] and not found! Resource not found.");
  }

  console.log("resource object: " + JSON.stringify(resource_object)); 

  // get details
  var resource_basis    = resource_object.basis;
  var resource_instance = resource_object.instance;
  var resource_basis_gpio = resource_object.gpio;

  console.log("  => First touch "  + JSON.stringify(resource_status[resource_basis][resource_instance]));

  if ((resource_basis == null) || (resource_instance == null)) {
      console.log("Error: Client requested resource [" + client_resource + "] and encountered internal error! Validate Configuration.");
      res.status(500).send("Error: Client requested resource [" + client_resource + "] and encountered internal error! Validate Configuration.");
  }     

  // resource and config found ok, denote usage
  var res_count = parseInt(resource_lookup[client_resource].count);
  res_count++;
  resource_lookup[client_resource].count = res_count.toString();    

  // look up capablity and instance from URI

  debug("URL: " + IT_configuration.gcos_root_uri + control + " processing.");
  debug("Data: " + JSON.stringify(req.body));

  // using 

  // PJD TODO  - add concurrency control in name space for each resource, e.g. if (busy) => return 503?
  if ((os_arch == "arm") && (os_platform == "linux")) {
    debug("Arch Specific: linux/arm processing.");
    debug("Resource: "  + client_resource + " processing " + command);
    debug("Resource Status: "  + JSON.stringify(resource_status[resource_basis][resource_instance]));
    if (resource_status[resource_basis][resource_instance].busy == basis_available) {
      resource_metrics_update(client_resource);
      resource_basis_metrics_update(resource_basis, resource_instance);
    } else {
      console.log("Warning: Resource " + client_resource + " busy, ignore " + command + " request");
      resources_mark_reject(client_resource, resource_basis, resource_instance);
      // queueing will be implemented here, but major issue is by the client
      res.status(500).send("Error: Client requested resource [" + client_resource + "] and encountered busy error! Attempt again in future.");
      return;
    }
      
    // disable for now TODO PERRY resource_status[resource_basis][resource_instance].busy = basis_busy;            // lock resoruce basis
    switch (command) {
      case "init":
        console.log("init...");
        resource_status[resource_basis][resource_instance].module = require("./ext/" + resource_basis + ".js");
        json_return_data.response = resource_status[resource_basis][resource_instance].module.init(resource_basis_gpio);
      break;
      case "start":
       var data = null;
       json_return_data.response = resource_status[resource_basis][resource_instance].module.start(data);
      break;
      case "status":
       var data = null;
       json_return_data.response = resource_status[resource_basis][resource_instance].module.status(data);
      break;
      case "stop":
       var data = null;
       json_return_data.response = resource_status[resource_basis][resource_instance].module.stop(data);
      break;
      case "toggle":
       var data = null;
       json_return_data.response = resource_status[resource_basis][resource_instance].module.toggle(data);
      break;        
      case "unload":
       var data = null;
       json_return_data.response = resource_status[resource_basis][resource_instance].module.unload(data);
      break;
      default:
       console.log("Unknown operation requested: " + command);
    }
   }
  resource_status[basis_id][instance_id].busy = basis_available;   // have control, unlock resource basis
  // console.log("End of web method3 for[" + basis_id + "][" + instance_id + "].busy:" + resource_status[basis_id][instance_id].busy);
  res.send(control + " " + req.params.participant + ' state information: ' + JSON.stringify(json_return_data,null,4));
});

console.log("");
console.log("GCOS Ctrl-C to exit.");
console.log("");

app.listen(instance_port, function () {
  console.log("GCOS Instance " + instance_name + " established on port " +  instance_port);
  console.log("GCOS Utilize \"mgcos\" or \"nodejs mgcos\" to manage via command line");
  console.log("GCOS Web access at: http://" + instance_ip + ":" +
               instance_port + IT_configuration.gcos_root_uri + "/welcome");
  console.log("");
  console.log("GCOS Welcome!")
});


function resource_metrics_update(client_res) {

  var res_activated = parseInt(resource_lookup[client_res].activated);
  res_activated++;
  resource_lookup[client_res].activated = res_activated.toString();
}

function resource_basis_metrics_update(res_basis, res_instance) {

  var res_basis_count = parseInt(resource_status[res_basis][res_instance].count);
  res_basis_count++;
  resource_status[res_basis][res_instance].count = res_basis_count.toString();

  var res_basis_actviates = parseInt(resource_status[res_basis][res_instance].activated);
  res_basis_actviates ++;
  resource_status[res_basis][res_instance].activated = res_basis_actviates.toString();
}

function resources_mark_reject(client_res, res_basis, res_instance) {

  var res_rejected = parseInt(resource_lookup[client_res].rejected);
  res_rejected++;
  var res_basis_rejected = parseInt(resource_status[res_basis][res_instance].rejected);
  res_basis_rejected++;
  resource_lookup[client_res].rejected = res_rejected.toString();
  resource_status[res_basis][res_instance].rejected = res_basis_rejected.toString();
}
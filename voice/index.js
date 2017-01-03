// Initial source - https://www.thepolyglotdeveloper.com/2016/08/create-amazon-alexa-skill-nodejs-aws-lambda/

'use strict';

var module_name = "resource_control";

//var debug = require('debug')('http'), http = require('http'), name = module_name;
var debug = require("debug")(module_name);

debug("Debug enabled in module: %s", module_name);

var iotos_version            = "v0.0.4 (mvp4) 01/02/2017";

//Environment Configuration
var mqtt_publish_queue = null;
var config = {};

// IOT Materials

// config property tools
var PropertiesReader = require('properties-reader');

var properties = null;

var voice_control_cfg_file = "./alexa.ini";

try {
 debug("Properties File: " + voice_control_cfg_file);
 properties = PropertiesReader(voice_control_cfg_file);
} catch (e) {
  var message_txt = "Problem parsing property file:" + e;
  console.log(message_txt);
  debug(message_txt);
  throw new Error("Corrupted or not found:" + voice_control_cfg_file);
}

try {
  // pull in configuration data
  config.IOT_BROKER_ENDPOINT = properties.get('voice-control.IOT_BROKER_ENDPOINT');
  config.IOT_BROKER_REGION = properties.get('voice-control.IOT_BROKER_REGION');
  config.IOT_THING_NAME = properties.get('voice-control.IOT_THING_NAME');
  mqtt_publish_queue = properties.get('voice-control.mqtt_publish_queue');
} catch (err) {
  console.log("Problem parsing voice configuation attributes in alexa.ini:", e);
  return;
}

// config.IOT_THING_NAME = config.IOT_THING_NAME + "_vctrl_01";

debug("MQTT Configuration to AWS IoT: ", config);
debug("MQTT Configuration AWS IoT queue: ", mqtt_publish_queue);

//Loading AWS SDK libraries
var AWS = require('aws-sdk');
AWS.config.region = config.IOT_BROKER_REGION;
//Initializing client for IoT
var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});

var Alexa = require('alexa-sdk');

var current_target = null;

var states = {
    START_MODE: '_START_MODE', // User is trying to guess the number. 
    IOTOS_MODE: '_IOTOS_MODE'  // Prompt the user to start or restart the game. 
};

 
const skillName = "Resource Control";

var newSessionHandlers = {
 
     // This will short-cut any incoming intent or launch requests and route them to this handler. 
    'NewSession': function() {
        debug("Start NewSession Intent Request", JSON.stringify(this.event,null,4)); 
        /*
        if(Object.keys(this.attributes).length === 0) { // Check if it's the first time the skill has been invoked 
            this.attributes['endedSessionCount'] = 0;
            this.attributes['iotos_session_counter'] = 0;
        }
        */
        this.handler.state = states.START_MODE;
        debug("Start NewSession Intent Request", JSON.stringify(this.event,null,4));
        this.emit(':ask', 'Welcome to the internet of things voice resource control capability. Say yes to start a resource control session or no to exit this interaction.',
            'Say yes to start a resource control session or no to exit this interaction.');
    },

    'AMAZON.StopIntent': function() {
        debug("Start NewSession StopIntent Request", JSON.stringify(this.event,null,4));        
        this.emit(':tell', 'Thank you for using internet of things operating system, goodbye!');
    },

    "Unhandled": function() {
        debug("Start NewSession Unhandled Request", JSON.stringify(this.event,null,4));
        this.handler.state = states.START_MODE;        
        var promptText = "Welcome to the Internet of Things resource control. Enter command mode by stating yes or state no to quit.";
        var repromptText = "State yes to begin a command session or state no to exit.";
        this.emit(':ask', promptText, repromptText);
    }    
 
};
 
var iotos_handlers = Alexa.CreateStateHandler(states.IOTOS_MODE, {

    'NewSession': function () {
        debug("Start IOTOS New Session Request", JSON.stringify(this.event,null,4));
        this.emit('NewSession'); // Uses the handler in newSessionHandlers 
    },

    "TargetCommand": function () {    // ResourceCommand comes in via this type
        debug("Start IOTOS TartgetCommnad Intent Request", JSON.stringify(this.event,null,4));        
        var target_spoken = null;
        var tcommand_spoken = null;
        var speechOutput = null;

        if (this.event.request.intent.slots.TargetItem.value !== null) {
            target_spoken = this.event.request.intent.slots.TargetItem.value.toLowerCase();
            debug("Resource spoken was: ", target_spoken);
        }
        if (this.event.request.intent.slots.TCommandItem.value !== null) {
            tcommand_spoken = this.event.request.intent.slots.TCommandItem.value.toLowerCase();
            debug("Command spoken was: ", tcommand_spoken);
        }       

        if ((target_spoken !== null) && (tcommand_spoken !== null)) {
            speechOutput = "Target established. I am confirming the request " + tcommand_spoken + " for " + target_spoken;
            current_target = target_spoken;
            // this.attributes['current_target'] = current_target;
            this.handler.state = states.IOTOS_MODE;
        } else {   
            if (target_spoken !== null) {
                    speechOutput = "Understood target " + target_spoken + " missing command, please try again";
            } else {
                    speechOutput = "Understood command " + tcommand_spoken + " missing resource, please try again";
            }
        }
        debug("IOTOS +++++++Speech generated: ", speechOutput);

        var rePromptOutput = "Enter a device and resource control command or no to exit.";        

        this.emit(':ask', speechOutput, rePromptOutput);
    },    

    "ResourceCommand": function () {    // ResourceCommand comes in via this type     
        var resource_spoken = null;
        var command_spoken = null;
        var speechOutput = null;
        var publish_content = null;
        var rePromptOutput = null;
        
        if (current_target == null) {

           debug("Start IOTOS Resource Command Intent Request", JSON.stringify(this.event,null,4));            
           speechOutput = "Target not set, must be stated before a resource command, ask help for information."; 
           rePromptOutput = "Target not set, must be stated before a resource command, ask help for information.";
           this.emit(':ask', speechOutput, rePromptOutput);
           // this.emit(':tell', speechOutput, skillName, speechOutput);

        } else {     

          if (this.event.request.intent.slots.ResourceItem.value !== null) {
            resource_spoken = this.event.request.intent.slots.ResourceItem.value.toLowerCase();
            debug("Resource spoken was: ", resource_spoken);
          }

          if (this.event.request.intent.slots.CommandItem.value !== null) {
            command_spoken = this.event.request.intent.slots.CommandItem.value.toLowerCase();
            debug("Command spoken was: ", command_spoken);
          }       

          if ((resource_spoken !== null) && (resource_spoken !== null)) {

            this.handler.state = states.IOTOS_MODE;
            publish_content = {
                                 "resource_control":  {
                                    "target"   :  current_target,
                                    "resource" :  resource_spoken,
                                    "command"  :  command_spoken
                                 }
                              };

            debug("Voice generated publishable content: ", publish_content);  

            var paramsUpdate = {
                topic       :  mqtt_publish_queue,
                payload     :  JSON.stringify(publish_content),
                qos         :  0
            };

            debug("MQTT request now to be sent, data parameters used: ", paramsUpdate); 
            
            iotData.publish(paramsUpdate, function(err, data) {         
              if (err) {
                var msg_text = "****AWS IoT MQTT Publish Failure submission err: " + err;
                debug(msg_text);
                // console.log(msg_text);
              } else {
                var msg_text = "****AWS IoT MQTT Confirmed Success Request resource";
                debug(msg_text);
                // callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
              }  
            });
            
            speechOutput = "Resource " + resource_spoken + " command " + command_spoken + " Confirmed and Submitted";
            rePromptOutput = "Enter a resource command, restablish target or no to exit.";
            debug(speechOutput);
            this.emit(':ask', speechOutput, rePromptOutput);            

          } else {

            debug("Error understanding command resource request");
            speechOutput = "Resource request not understood, please try again";
            rePromptOutput = "Enter a resource command, restablish target or no to exit.";
            this.emit(':ask', speechOutput, rePromptOutput);  

          }
        } // if target not null
      debug("** IOTOS_MODE ResourceCommand complete...**");
    },

    "SessionEndedRequest": function () {
        debug("Start IOTOS *********Start SessionEnded Request", JSON.stringify(this.event,null,4));  
        // this.attributes['endedSessionCount'] += 1;              
        this.emit('SessionEndedRequest');   
    },

    'AMAZON.YesIntent': function() {
        debug("Start START YesIntent Request", JSON.stringify(this.event,null,4));        
        this.handler.state = states.IOTOS_MODE;
        var promptText = "Welcome to voice command mode. State a command, say help to acquire assistance or state no to exit.";
        var repromptText = "Welcome to voice command mode. State a command, say help to acquire assistance or state no to exit.";
        this.emit(':ask', promptText, repromptText);        
    },    
 
    "AMAZON.HelpIntent": function () {   // Tested, seems to work.
        debug("Start IOTOS ********* Help Request", JSON.stringify(this.event,null,4));
        var speechOutput = "";
        speechOutput += "Here are some things you can state: ";
        speechOutput += "To begin stating voice requests, you must first establish a target device. For example, target alpha, then ";
        speechOutput += "commands can be stated, a few voice examples include, river start, ";
        speechOutput += "start river, ";
        speechOutput += "light start, ";
        speechOutput += "initialize light. ";
        speechOutput += "So how can I help?";
        this.emit(':ask', speechOutput, speechOutput);
    },

    'SessionEndedRequest': function () {
        debug("Start IOTOS ********* End Session Request", JSON.stringify(this.event,null,4));
        // this.attributes['endedSessionCount'] += 1;
        this.emit(':saveState', true); // Be sure to call :saveState to persist your session attributes in DynamoDB 
    },   

    'AMAZON.StopIntent': function() {
        debug("Start IOTOS ********* StopIntent Request", JSON.stringify(this.event,null,4));        
        this.emit(':tell', 'Thank you for using the internet of things operating system control resource voice capability, looking forward to the next time, goodbye!');
    },
 
    "Unhandled": function() {
        debug("Start IOTOS ********* Unhandled Request", JSON.stringify(this.event,null,4));
        var promptText = "Welcome to the Internet of Things resource control. Enter command mode by stating yes or state no to quit.";
        var repromptText = "State yes to begin a command session or state no to exit.";
        this.emit(':ask', promptText, repromptText);
    }    

});

var primary_voice_handlers = Alexa.CreateStateHandler(states.START_MODE, {

    "SessionEndedRequest": function () {
        debug("Start START *********Start SessionEnded Request", JSON.stringify(this.event,null,4));
        // this.attributes['endedSessionCount'] += 1;                
        this.emit('SessionEndedRequest');   
    },

    'AMAZON.YesIntent': function() {
        debug("Start START YesIntent Request", JSON.stringify(this.event,null,4));        
        this.handler.state = states.IOTOS_MODE;
        var promptText = "Welcome to voice command mode. State a command, or help to acquire assistance or state no to exit.";
        var repromptText = "Welcome to voice command mode. State a command, or help to acquire assistance or state no to exit.";
        this.emit(':ask', promptText, repromptText);        
    },
 
    'AMAZON.NoIntent': function() {
        debug("Start START NoIntent Request", JSON.stringify(this.event,null,4));
        // this.handler.state = states.START_MODE;
        this.emit(':tell', 'Thank you for using the internet of things resource control');
    },    

    "AMAZON.HelpIntent": function () {   // Tested, seems to work.
        debug("Start START *********tart Help Request", JSON.stringify(this.event,null,4));
        var promptText = "Welcome to the internet of things voice based resource control. State yes to start a resource control session or no to quit.";
        var repromptText = "State help for assistance, begin issuing voice commands, or state no to exit.";
        this.emit(':ask', promptText, repromptText);
    },

    'AMAZON.StopIntent': function() {
        debug("Start START StopIntent Request", JSON.stringify(this.event,null,4));   
        // this.handler.state = states.START_MODE;             
        this.emit(':tell', 'Thank you for using the internet of things resource control, looking forward to the next time, goodbye!');
    },    
 
    "Unhandled": function() {
        debug("Start START *********Start Unhandled Request", JSON.stringify(this.event,null,4));
        var promptText = "Welcome to the internet of things voice resource control. State yes to start a resource control session or no to quit.";
        var repromptText = "State help for assistance, begin issuing voice commands, or state no to exit.";
        this.emit(':ask', promptText, repromptText);
    }    

});
 
exports.handler = function (event, context) {
  debug("*********Enter Control Resource Handler"); 
  console.log("iotos Alexa Enabled - version " + iotos_version);  
  var alexa = Alexa.handler(event, context);
  try {
    debug("Enter Control Resource Try Block"); 
    alexa.appId = "amzn1.ask.skill.cfcb8da0-b88b-4e37-a607-5ffe0001af54";
    // alexa.dynamoDBTableName = 'iotos_database'; // configure database    
    alexa.registerHandlers(newSessionHandlers, primary_voice_handlers, iotos_handlers);
    alexa.execute();
  } catch (err) {
    debug("Handler Exception Catch Block"); 
    debug("Handler init hit error: ", err);
    console.log("handler init hit error: ", err);
  }
  debug("*********Exit Control Resource Handler");
};

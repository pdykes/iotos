Readme.MD

Internet of Things Operating System (iotos).  This was formally called GCOS.
----------------------------------------------------------------------------

This solution provides organizations with many pi instances to quickly enable a distributed
control and programming model.  The user can dynanmically instantiate extension code (in ext
directory) across the network, manage each circuit without having to be physicaly near the
Pi and attached circuits, and can enable the remote pis to report data to endpoints over
the network which are interested in the results.

iotos can run on windows and linux, pi circuit specific functions only operate on the pi. The 
tests were done on windows 7 with node 6.9 above (Node 7 is best). Will widen out later.

A youtube video set is pending to setup, operate and extend.

Setup Preperation (if you have node -v >= 6.9 you can skip this)

Node Setup  (this only needs to be done once!)
----------------------------------------------

Node is the base programming language for this solution, and you must be able to run "node -v", 
and verify you have version 6.9 or higher.

 - See the bringup.txt if your pi systems are not on the pixel release on the pis, suggested.

 - If on linux and have node 10.29 (node -v), need to upgrade, we can talk in class how to upgrade,
   net:

```
   sudo apt-get remove nodered
   sudo apt-get remove npm
   sudo apt-get remove nodejs
```   

 - Pixel and arm7 or later (Latest Pi B)

    - Visit this nodesource:  https://github.com/nodesource/distributions
    - Select the Debian (Pixel is a Debian version) commands.  

    - Then when done with nodejs 6.9 or 7.0 or later install, upgrade npm

       - nodejs -v (or node -v)   [if not in path, fix that first]
       - npm install npm

 - arm6 (still use Pixel), the following is required

   - download latest nodejs (6.91 at the time of this writing) from nodejs.org
   - cd /usr/local
   - sudo mkdir nodeX.YZ
   - cd nodeX.YZ
   - sudo tar -xvf <image you downloaded>
   - cd (go to home directory where you will run node from)
   - Update PATH to reference to /usr/local/nodeX.YZ/bin to .bashrc and .profile
   - Debug using node -v or nodejs -v, if does not work, make it so...



Setup Git (do only once)
------------------------

- If you open a window, and "git --v" fails, you can skip to Double Check Dependencies.
- Download from git hub (install and run git on pi)
   - Download git for windows (google - download windows git, install) and pi (see above if did not already, e.g. apt-get)
   - Download node for windows (google - windowss 64 bit msi installer, install)

Double Check Dependencies (if these do not work, repeat steps above)
--------------------------------------------------------------------

   - Open new a shell window (new is important, your path will be updated to find new tools!)
       Issue the commands to see if tools installed ok (your "toolchain")
      - node -v  (getting 6.91 or higher is good)  [if not found, reinstall node]
      - npm -v (getting 3.+ is good)  [intalled with node]
      - git --v (yes, two dashes, should 2.7.x or higher) [if not found, reinstall git]

Key Concpets
------------

      - Create your rasperry pi circuits, the default we use for testing below:
        - GPIO 24 -> led (long leg) -> led (shortleg) -> 220K ohm resister -> ground
        - This is called "red_warning_light" resource for basic version, and also,
          "red_warn_publish_light" same circuit but demonstrates reporting data to 
          cloud server as operations are performed on target circuit.
      - iotos server will run on the Raspberry Pi, which will probably have breadboard
        and circuits to be contorled
      - You will install iotos on each pi, and share the configuration.json file across
        all of them
      - The iotos.js file will be started on each Pi once the confiugration.json is
        established, copied to each unit and will support your specific application
      - The manage.js command can be used to control from one device all Pis in the iotos
        environment.  manage.js can be ran on windows to control a set of pis, seems like
        a popular configuration as I work with students. For windows, use git to pull down
        and in the iotos directory, before issuing "npm install", update the package.son
        as described below

Install iotos
-------------

   - For each pi or windows system involved in the solution...

   - Validate node, and other software preqreqs via Double Checking text above

   - Open a window
      - Create a proejct directory in the file system, e.g.
          mkdir projects
          cd projects

   - Pull the code from github with your git command 
         (this will create a iotos subdirectory with the code)
      - git clone https://github.com/pdykes/iotos  (you may have to run twice if not ran every before)
      - cd iotos     (created by git command above, fyi)

      - [on windows only - reminder, only useful for management command, server must run on Pi]  
          - Use notepad or another editor, edit the package.json file and remove the single "onoff"
            line.

```
              "dependencies": {
                "body-parser": "^1.15.2",
                "cfenv": "^1.0.3",
                "collections": "^5.0.5",
                "command-line-args": "^3.0.3",
                "debug": "^2.3.2",
                "express": "^4.14.0",
                "node-rest-client": "^2.0.1",  
                "onoff": "^1.1.1",                    <- remove this line, save the file (on winows only)
                "os": "^0.1.1",
                "properties-reader": "0.0.15"
```               

      - npm install  (npm wil install all the dependencies

   - create a cirucit on GPIO, we use a basic LED circuit on gpio port 24
   - (optional) set debug on if you wish (see below)
   - See start the server below, or if brave:
        - nodejs  iotos.js    (on pi only, just starts pi circuit server, 
                               also, could be node or nodejs, depends on install level)
                               This starts the server, you should see "Welcome to iotos"
   		  - TODO command line not ready yet, install in Chrome web store the Postman application
   - To test managing the solution, see the management command examples below

Advanced Debugging
------------------

- To enable debug
   - cd working directory 
      - background: manage.js is the CLI for managing all the pis/circuits,
      - background: iotos.js is the server module to run on PI, 
      - background: and led_light is example IoT extension in ext\ directory
   - Windows
   		set DEBUG=manage
   - Pi (debian)
      export DEBUG=manage,iotos,led_light

   - Debug lines will be colored


Server Start Example (do this on PI)
------------------------------------

  - open a window (once)
  - cd projects\iotos direcotry (once, if you have not pulled the code, etc... see above)
  - use ifconfig (linux), and find the ip address of the unit (lan, wireless lan, etc..)
  - edit configuration.json
     - Update this section for player_1_pi (assume one pi is called player_1_pi for this readme)

```     
         {
          "player_1_pi": {
             "resources": {
                "internal_IT" : {
                    "ip"             : "192.168.1.111",    <- change your ip in this location
                    "port"           : "8085",
                    "iotos_root_uri" : "/api/v01",
                    "secure"     : "true"

```                    

     - save the file...
  - npm install npm    (just make sure have latest npm)
  - npm install
  - node iotos.js   (may need to use "nodejs" vs. "node")

```

prompt:~/projects/iotos $ nodejs iotos.js
iotos Bootstrap [os:linux arch:arm]
iotos Version v0.0.2 11/10/2016 Instance: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos Instance: player_1_pi on 8085 initializing...

iotos Ctrl-C to exit.

iotos Instance player_1_pi established on port 8085
iotos Utilize "miotos" or "nodejs miotos" to manage via command line
iotos Web access at: http://192.168.1.111:8085/api/v01/welcome

iotos Welcome!

```

   - Congratulations, you now are able to issue management commnads.

Install and Setup iotos http reporting to another http server
-------------------------------------------------------------

- On windows, only the management command line supported (can do this on linux/pi as well) 
  for management operations
- On raspberry pi, the server "for that node" and the management application is supported
  This server will run iotos and it will load modules to interact with resources and circuits

- When running the management command line on windows, open the iotos\package.json file and remove
  the "onoff" package.json entry (leave all others in place!).

- The latest release also offers a prototype target to get events that occur and simulate
  forwarded status to another real-time server endpoint

  - To prepare to run the test endpoint (install iotos as above on new targer server (can be windows))
    - open a window on a linux or pi system
    - change directory to project diretory (e.g. ..\projects for example) 
    - clone the source (git clone... see below)
    - cd projects\iotos 
    - npm install  (if you get an error, first try "npm install npm", secondly, 
                    if on windows, see package.json trick above, then retry this 
                    command)
    - nodejs event_emitter_web_app.js   

  - To configure and try out:
    - Note the ip address of where this test endpoint is running (ipconfig, ifconfig)
    - Change the project_dir\iotos\configuration.json file:

```

        "restful": {
          "type"    : "restful",
          "root_url"  : "192.168.1.14:8756/gameserver",
          "secure"  : "false"
         },

```         

       Substitute 192.168.1.14 to your ip address of the server event_emitter_web_app.js
       is running on.,

  - To test this out using the sample"
    - You can use the same LED Circuit we use for test
    - Start the iotos server on pi with led circuit
         - cd projects\iotos
         - (if have not installed prereqs - issue a "npm install", do only once)
         - nodejs iotos.js  (server should start)
    - In a second window on PI or on a windows box, each of the manage commands
          should result in data being forwarded to the event_emitter_web_app.js example

```          

         cd projects\iotos
         nodejs manage.js -t player_1_pi -r red_warn_publish_light -d init
         nodejs manage.js -t player_1_pi -r red_warn_publish_light -d start
         nodejs manage.js -t player_1_pi -r red_warn_publish_light -d toggle

```
         
Command line function
---------------------

Manage - Initialize
-------------------

node manage.js -t player_1_pi -d init -r red_warning_light
----------------------------------------------------------

- Output

```

Management Command [os:linux arch:arm]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Init request operation initiated to http://192.168.1.111:8085/api/v01/control
{
    "command": "init",
    "resource": "red_warning_light",
    "host": "192.168.1.111:8085",
    "unit": "player_1_pi",
    "port": "8085",
    "url": "http://192.168.1.111:8085/api/v01/control",
    "active": true,
    "init_message": "Resource red_warning_light Resource Basis led_light for instance 1 initialized.",
    "response": {
        "module": "led_light",
        "method": "init",
        "status": "OK",
        "return_code": "200"
    },
    "config_message": "Resource red_warning_light Resource Basis led_light for instance 1 configured."
}


```


Manage - Start
--------------

node manage.js -t player_1_pi -d start -r red_warning_light
-----------------------------------------------------------

```

Management Command [os:linux arch:arm]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Start request operation initiated to http://192.168.1.111:8085/api/v01/control
{
    "command": "start",
    "resource": "red_warning_light",
    "host": "192.168.1.111:8085",
    "unit": "player_1_pi",
    "port": "8085",
    "url": "http://192.168.1.111:8085/api/v01/control",
    "response": {
        "module": "led_light",
        "method": "start",
        "status": "tbd",
        "return_code": "200"
    }
}

```


Manage - Toggle
---------------

node manage.js -t player_1_pi -d toggle -r red_warning_light
------------------------------------------------------------

```

Management Command [os:linux arch:arm]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Toggle request operation initiated to http://192.168.1.111:8085/api/v01/control
{
    "command": "toggle",
    "resource": "red_warning_light",
    "host": "192.168.1.111:8085",
    "unit": "player_1_pi",
    "port": "8085",
    "url": "http://192.168.1.111:8085/api/v01/control",
    "response": {
        "module": "led_light",
        "method": "toggle",
        "status": "tbd",
        "return_code": "200"
    }
}

```

Manage - Help
-------------

node manage.js --help
---------------------

```

Management Command [os:linux arch:arm]
Command options:
 --verbose/-v    - Verbose Mode at startup
 --directive/-d  - Directive mode*
 --resource/-r   - Name of resource*
 --port/-p       - Target port override
 --targethost/-t - Target host override
 --configFile/-f - Configuration file
 --help/-h       - Help

 * required

 ```


-------------------------------------------------------------------------------------------

Reference Information
---------------------

- GPIO Library

  After a pretty lenthy review, iotos utilizes Raspberry Pi GPIO library is the "on/off" package.
  This is for a few reasons:

    - npm install is supported, allowing easy install and bringup for new folks
        npm install --save onoff 
    - supports nearly all the GPIO programming model (iotos can let you use other models as well) 
    - well used and many examples on the web using this library and includes several good libraries

  See https://github.com/fivdi/onoff  for more information on github. This knowledge will be useful 
  for more advanced work.  iotos tries to unleash the solution, not contain it. Thus, you should be
  able to extend iotos once you get more experienced.


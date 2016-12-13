Readme.MD

Internet of Things Operating System (iotos).  This was formally called iotos.
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

Node is required and you must be able to run "node -v", and see a version 6.9 or higher.

a) See the bringup.txt if your pi systems are not on the pixel release on the pis, suggested.

b) If on linux and have node 10.29 (node -v), need to upgrade, we can talk in class how to upgrade,
   net:

   sudo apt-get remove nodered
   sudo apt-get remove npm
   sudo apt-get remove nodejs

c) Pixel and arm7 or later (Latest Pi B)

   Visit this nodesource:  https://github.com/nodesource/distributions

   Select the Debian (Pixel is a Debian version) commands.  

   Then when done with nodejs 6.9 or 7.0 or later install, upgrade npm

   i) nodejs -v (or node -v)   [if not in path, fix that first]
   ii) npm install npm

 d) arm6 (still use Pixel), the following is required

    (need to add to path manually)

    i) download latest nodejs (6.91 at the time of this writing) from nodejs.org
    ii) cd /usr/local
    iii) sudo mkdir nodeX.YZ
    iv) cd nodeX.YZ
    v) sudo tar -xvf <image you downloaded>
    vi) cd (go to home directory where you will run node from)
    vii) Update PATH to reference to /usr/local/nodeX.YZ/bin to .bashrc and .profile
    viii) Debug using node -v or nodejs -v, if does not work, make it so...


Install and Setup iotos on PI and Windows
-----------------------------------------

- On windows, only the managmeent command line supported (can do this on linux/pi as well) 
  for management operations
- On raspberry pi, the server "for that node" and the management application is supported
  This server will run iotos and it will load modules to interact with resources and circuits

- When running the management command line on windows, open the iotos\package.json file and remove
  the "onoff" package.json entry (leave all others in place!).

- The latest release also offers a prototype target to get events that occur and simulate
  forwarded status to another real-time server endpoint

  To prepare to run the test endpoint (restful http target in this version)
    - open a window on a linux or pi system
    - change directory to project diretory (e.g. ..\projects for example) 
    - clone the source (git clone... see below)
    - cd projects\iotos 
    - npm install  (if you get an error, first try "npm install npm", then retry this command)
    - nodejs event_emitter_web_app.js   

  To configure and try out:
    - Note the ip address of where this test endpoint is running (ipconfig, ifconfig)
    - Change the project_dir\iotos\configuration.json file:

        "restful": {
          "type"    : "restful",
          "root_url"  : "192.168.1.14:8756/gameserver",
          "secure"  : "false"
         },

       Substitute 192.168.1.14 to your ip address of the server event_emitter_web_app.js
       is running on.,

  To test this out using the sample"
    - You can use the same LED Circuit we use for test
    - i) Start the iotos server on pi with led circuit
         - cd projects\iotos
         - (if have not installed prereqs - issue a "npm install", do only once)
         - nodejs iotos.js  (server should start)
    - ii) In a second window on PI or on a windows box, each of the manage commands
          should result in data being forwarded to the event_emitter_web_app.js example
         - cd projects\iotos
         - nodejs manage.js -t player_1_pi - red_warn_publish_light -d init
         - nodejs manage.js -t player_1_pi - red_warn_publish_light -d start
         - nodejs manage.js -t player_1_pi - red_warn_publish_light -d toggle


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
         node -v  (getting 6.91 or higher is good)  [if not found, reinstall node]
         npm -v (getting 3.+ is good)  [intalled with node]
         git --v (yes, two dashes, should 2.7.x or higher) [if not found, reinstall git]

Install iotos

   - Open a window
      - Create a proejct directory in the file system, e.g.
          mkdir projects
          cd projects

   - Pull the code from github with your git command 
         (this will create a iotos subdirectory with the code)
      - git clone https://github.com/pdykes/iotos  (you may have to run twice if not ran every before)
      - cd iotos     (created by git command above, fyi)

      - [if on windows only]  
          - Use notepad or another editor, edit the package.json file and remove the single "onoff"
            line.

      - npm install  (npm wil install all the dependencies

   - create a cirucit on GPIO, we use a basic LED circuit on gpio port 24
   - set debug on if you wish (see below)
   - nodejs  iotos.js    (on pi only, just starts pi circuit server, 
                          also, could be node or nodejs, depends on install level)
                         This starts the server, you should see "Welcome to iotos"
   		- TODO command line not ready yet, install in Chrome web store the Postman application
   - To test, see the management command examples below

(for advanced use)

- To enable debug
   - cd working directory (manage is the CLI, iotos is the server on PI, and led_light is example IoT extension in ext\)
   - Windows
   		set DEBUG=manage
   - Pi (debian)
        export DEBUG=manage,iotos,led_light

   - Debug lines will be colored

- Server Start Example

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node iotos.js

...

iotos Wecome!
         
- Command line function

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js -d init -r red_warning_light


Management Command [os:win32 arch:x64]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Control Init Operation Initiated to http://192.168.1.111:8085/api/v01/ctrl

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js -d start -r red_warning_light


Management Command [os:win32 arch:x64]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Control Start Operation Initiated to http://192.168.1.111:8085/api/v01/ctrl

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js -d toggle -r red_warning_light


Management Command [os:win32 arch:x64]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Control Toggle Operation Initiated to http://192.168.1.111:8085/api/v01/ctrl

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js -d toggle -r red_warning_light


Management Command [os:win32 arch:x64]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Control Toggle Operation Initiated to http://192.168.1.111:8085/api/v01/ctrl


C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js -d unload -r red_warning_light


Management Command [os:win32 arch:x64]
iotos Version v0.0.2 11/10/2016 Target host: player_1_pi
iotos Initializing Resource Mapping: configuration.json
iotos Port assigned from config file: 8085
iotos IP Address assigned from config file: 192.168.1.111
iotos CLI Control Unload Operation Initiated to http://192.168.1.111:8085/api/v01/ctrl

C:\data\projects\iot\school\gc\deviceteam\iotos\mvp1>node manage.js --help


Management Command [os:win32 arch:x64]
Command options:
 --verbose/-v    - Verbose Mode at startup
 --directive/-d  - Directive mode*
 --resource/-r   - Name of resource*
 --port/-p       - Target port override
 --targethost/-t - Target host override
 --configFile/-f - Configuration file
 --help/-h       - Help

 * required


-------------------------------------------------------------------------------------------

Reference Information

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


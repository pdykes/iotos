Readme.MD

Can run on windows and linux, pi control specific functions only operate on the pi.

The tests were done on windows 7 with node 6.9 above (Node 7 is best).


Setup Env Prep (if you have node -v >= 6.9 you can skip this)

a) See the bringup.txt if your systems are not on the pixel release on the pis, suggested.
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


Install and Setup GCOS on PI and Windows

- On windows, you will run the command line (can do this on linux/pi as well) for management
- On raspberry pi, you will run gcos and it will load modules to interact with resources and circuits


- Download from git hub (install and run git on pi)
   - Download git for windows (google - download windows git, install) and pi (see above if did not already, e.g. apt-get)
   - Download node for windows (google - windowss 64 bit msi installer, install)
   - Open new a shell window (new is important, your path will be updated to find new tools!)
       Issue the commands to see if tools installed ok (your "toolchain")
         node -v  (getting 6.91 or higher is good)  [if not found, reinstall node]
         npm -v (getting 3.+ is good)  [intalled with node]
         git --v (yes, two dashes, should 2.7.x or higher) [if not found, reinstall git]
   - Create the expected code directories
      - Open a shell
      - Make a projects directory
          mkdir projects
          cd projects
   - Pull the code from github with your git command
      - git target https://github.com/pdykes/gcos  (you may have to run twice if not ran every before)
      - git will create a sub directory gcos
      - cd gcos  (created by git command above)
      - [if on windows only]  
          - on the windows start icon
          - search for "powershell" 
          - right click on the entry and select "Run as adminstrator"
          - npm install windows-build-tools
          - exit the windows
      - open a new shell window (not a powershell)
      - cd to the projcts\gcos created above
         e.g. cd projects
              cd gcos
      - npm install (npm wil install all the dependencies, windows-build-tools was required for windows)
   - create a cirucit on GPIO, to start LED circuit on gpio port 24
   - set debug on if you wish (see below)
   - nodejs  gcos.js (on windows, just starts server, and on linux, could be node or nodejs, depends on install level)
   		- This starts the server, you should see "Welcome to GCOS"
   		- TODO command line not ready yet, install in Chrome web store the Postman application
   - To test, go back your pc, open the pdf file download and view the post man gui follow to setup to run commands


- To enable debug
   - cd working directory
   - Windows
   		set DEBUG=gcos,led_light
   - Pi (debian)
        export DEBUG=gcos,ld_light

   - Debug lines will be colored
         




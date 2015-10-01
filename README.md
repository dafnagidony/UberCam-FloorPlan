# Uber for Sensors - Floor Plan Editor

Link to the app: http://ec2-52-23-208-244.compute-1.amazonaws.com/
## Description

This is a sub project of [Uber for Sensors](https://docs.google.com/document/d/1iCdPLnrTx7dLEkuvSs0zBoIcKUV__PhV3spDvkmlavM/edit#heading=h.twwe03toifxi "Title") - Mobile robotic virtual sensor platform with on-demand dispatch for a Robot as a Service (RaaS) - system.

This is an open source Node.js application with extensive use of D3.js library.

In order to navigate the robot to a specific location inside a building, an SVG floorplan of the building needs to be provided. Once the floorplan is loaded to the system, it needs to be edited in order to provide the necessary information for the robot's navigation:

* Mark objects which don't interrupt the robot's movement.
* Mark the robot's docking station and destination points.
* Set the floorplan's physical scale.
* Add obstacles such as walls.

## API 
The robot's UI obtains the necessary information for navigation from a JSON document.

* `http://localhost:8080/robot/`  Provide data of all the floor plans in the system.
* `http://localhost:8080/robot/:id`   Provide data of specific floor plan. 

The robot's floor plan is encoded in the JSON document as a URL to the corresponding file on the filesystem.



## Installation
* install [Node.js](https://nodejs.org/ "Title")
* Install [PostgreSQL](http://www.postgresql.org/download/ "Title")

Download this repo, or fork/clone and install the node libraries:
```
$ git clone https://github.com/dafnagidony/UberCam-FloorPlan
$ cd UberCam-FloorPlan 
$ npm install
```
Build the postgreSQL database:

1. Create new postgreSQL  supeuser:
    ```
    $ CREATE USER ubercam SUPERUSER;
    ```
2. Create a new database  and restore the dump file:
    ```
    $ createdb -T template0 ubercam
    $ psql ubercam < dump_file
    ```

Create a folder to save the floor plans:
```
$ mkdir -p public/images
```

Execute the `server.js` to start the server as follows:
```
$ node server.js
```
Verify the Output. Server has started
```
Listening on 8080
```
Open http://localhost:8080/ in your browser.

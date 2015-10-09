var express = require("express");
var fs = require("fs");
var md5 = require('md5');
var path = require('path');
var pg = require('pg');
var mustacheExpress = require('mustache-express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var app = express();

var contString = "postgres://ubercam:@localhost/ubercam"
var client = new pg.Client(contString);
client.connect();
app.use(cookieParser());
app.use(expressSession({secret:'ubercam secret'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'files')));


app.get('/',function(req,res){
  client.query("SELECT * from users WHERE user_name='some_user'",function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    req.session.userId = result.rows[0].user_id;
    client.query("SELECT * FROM floorplans_table WHERE user_id = $1 ",[req.session.userId], function(err, result) {
      var data_arr = [];
      if (result && result.rowCount > 0) {
        if(err) {
          return console.error('error running query', err);
        } 
        for (var i=0; i< result.rowCount; i++) {
          var data = {};
          data["building"] = result.rows[i].attributes.building;
          data["floor"] = result.rows[i].attributes.floor;
          data_arr.push(data);
        }
      }
      res.render("main.mustache", {dropdown_data: data_arr});
    });
  });    
});

// add new file to the
app.post('/new',function(req,res){
  var floor_num = req.body.floor;
  var building_name = req.body.building_name; 
  var file_type = req.body.floorplan.split('.')[1];
  var image_name = md5(req.body.file_content)+ "." +file_type;
  req.session.image_name = image_name;
  req.session.building_name = building_name;
  req.session.floor_num = floor_num;
  req.session.attributes_arr = {scale_length: -1, scale_unit: "", poi:[]};
  var attributes = '{"poi": [], "scale_unit": "", "scale_length": -1, "floor": '+floor_num+', "building": "' + building_name+'"}';
  client.query("SELECT * FROM floorplans_table WHERE user_id = $1 AND attributes  @> $2::jsonb",[req.session.userId,'{\"floor\":'+floor_num +',\"building\": \"'+ building_name+'\"}'], function(err, result) {
    if(err) {
        return console.error('error running query', err);
      } 
    if (result && result.rowCount > 0) {
      
      res.redirect('/?error=Floor plan already exists&name=' + result.rows[0].image_name);
    }
    else {
      client.query("SELECT * FROM floorplans_table WHERE image_name = $1", [image_name], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        } 
        if (result && result.rowCount == 0) {
          fs.writeFileSync('public/images/'+ image_name, req.body.file_content); 
        }
      });
      
      client.query("INSERT INTO floorplans_table (image_id, image_name,user_id,attributes) VALUES (DEFAULT, $1, $2, $3) RETURNING image_id AS id",[image_name, req.session.userId,attributes], function(err, result) {
       
          req.session.image_id = result.rows[0].id;
          res.redirect('/?success=yes&name=' + image_name);      
      }); 
    }
  });
});


app.post('/load', function(req,res){
  var floor_num = req.body.floor;
  req.session.floor_num = floor_num;
  var building_name = req.body.building_name;
  req.session.building_name = building_name;
 
  client.query("SELECT * FROM floorplans_table WHERE user_id = $1 AND attributes  @> $2::jsonb",[req.session.userId,'{\"floor\":'+floor_num +',\"building\": \"'+ building_name+'\"}'], function(err, result) { 
      if(err) {
        return console.error('error running query', err);
      }
      if (result && result.rowCount > 0) {
      req.session.attributes_arr = result.rows[0].attributes;
      var image_name = result.rows[0].image_name;
      req.session.image_id = result.rows[0].image_id;
      req.session.image_name = image_name;
      req.session.robot_name = result.rows[0].robot_view;
      req.session.attributes_arr = result.rows[0].attributes;
      res.redirect('/?name=' + image_name);
    }
    else {
      res.redirect('/?load_error=Floor plan doesn\'t exist' );
    }
  });
});

//post
app.get('/delete',function(req,res){ 
   //delete from DB
  client.query("DELETE FROM floorplans_table WHERE image_id = $1 ", [req.session.image_id] ,function(err) {
    if(err) {
    return console.error('error running query', err);
    }
  }); 
  req.session.image_id = "";
  client.query("SELECT * FROM floorplans_table WHERE image_name = $1",[req.session.image_name], function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    if (result && result.rowCount == 0) {
      //delete from file system
      var filePath = './public/images/'+req.session.image_name; 
      fs.unlinkSync(filePath);   
    } 
  });
  if (req.session.robot_name != undefined) {
    client.query("SELECT * FROM floorplans_table WHERE robot_view = $1",[req.session.robot_name], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result && result.rowCount == 0) {
        //delete from file system
        var filePath = './public/images/'+req.session.robot_name; 
        fs.unlinkSync(filePath);
      } 
    });
  }        
  res.redirect('/?delete=true');
});

app.get('/edit_temp', function(req,res){ 
  var minute = 60 * 1000;
  res.cookie('scale_length', req.session.attributes_arr.scale_length);
  res.cookie('scale_unit', req.session.attributes_arr.scale_unit);
  res.cookie('poi', JSON.stringify(req.session.attributes_arr.poi) ,{ maxAge: minute });
 res.redirect('/edit/?image_name='+ req.session.image_name);
});

app.get('/edit', function(req,res){
  res.render("edit_floorplan.mustache",{building_name: req.session.building_name, floor_num: req.session.floor_num});
});

app.post('/update', function(req,res){
  var file_type = req.session.image_name.split('.')[1];
  var image_name = md5(req.body.floorplan_content)+ "." +file_type;
  var prev_image_name = req.session.image_name;
  var prev_robot_name = req.session.robot_name;
  req.session.image_name = image_name;
  var robot =req.body.floorplan_robot_view;
  var robot_name = md5(robot)+ "." +file_type;
  req.session.robot_name = robot_name;
  fs.writeFileSync('public/images/'+ robot_name, robot); 
  fs.writeFileSync('public/images/'+ image_name, req.body.floorplan_content); 
  var scale_length = req.body.floorplan_scale_length;
  var scale_unit = req.body.floorplan_scale_unit;
  var poi_arr =req.body.floorplan_poi;
  var update_attributes = '{"poi": '+ poi_arr + ',"scale_unit": "'+ scale_unit+'", "scale_length":'+scale_length+', "floor": '+req.session.floor_num+', "building": "' + req.session.building_name+'"}';
  client.query("UPDATE floorplans_table SET image_name = $3, robot_view=$4, attributes =$2 WHERE image_id = $1",[req.session.image_id, update_attributes, image_name, robot_name]);
  if (prev_image_name != undefined) {
    client.query("SELECT * FROM floorplans_table WHERE image_name = $1", [prev_image_name], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      } 
      if (result && result.rowCount == 0) {
        fs.unlinkSync('./public/images/'+prev_image_name);
      }
    });
  }
  
  if (prev_robot_name != undefined) {
    client.query("SELECT * FROM floorplans_table WHERE robot_view = $1", [prev_robot_name], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      } 
      if (result && result.rowCount == 0) {
       fs.unlinkSync('./public/images/'+prev_robot_name);
      }
    });    
  }
  res.redirect("/?update=true");
});

app.get('/robot/:id', function(req,res){
  var image_id = req.params.id;
     client.query("SELECT * FROM floorplans_table WHERE image_id = $1 ", [image_id] ,function(err, result) {
    if(err) {
    return console.error('error running query', err);
    }
    var doc = {
      'image_id': result.rows[0].image_id,
      'image': req.protocol + '://' + req.get('host') +"/images/"+result.rows[0].image_name,
      'robot_view': req.protocol + '://' + req.get('host') +"/images/"+result.rows[0].robot_view,
      'poi': result.rows[0].attributes.poi,
      'scale_unit': result.rows[0].attributes.scale_unit,
      'scale_length': result.rows[0].attributes.scale_length,
      'building_name': result.rows[0].attributes.building,
      'floor_number': result.rows[0].attributes.floor
    };
    res.json(doc); 
  });  
});

app.get('/robot', function(req,res){
     client.query("SELECT * FROM floorplans_table WHERE user_id = $1 ", [req.session.userId] ,function(err, result) {
    if(err) {
    return console.error('error running query', err);
    }
    var doc_arr = [];
    for (var i=0; i< result.rowCount; i++) {
      var doc = {
        'image_id': result.rows[i].image_id,
        'image': req.protocol + '://' + req.get('host') +"/images/"+result.rows[i].image_name,
        'robot_view': req.protocol + '://' + req.get('host') +"/images/"+result.rows[i].robot_view,
        'poi': result.rows[i].attributes.poi,
        'scale_unit': result.rows[i].attributes.scale_unit,
        'scale_length': result.rows[i].attributes.scale_length,
        'building_name': result.rows[i].attributes.building,
        'floor_number': result.rows[i].attributes.floor
      };
      doc_arr.push(doc)
    }
    res.json(doc_arr); 
  });  
});

//*Run the server.*/
var port = 8080;
app.listen(port,function(){
    console.log('Listening on ' + port);
});



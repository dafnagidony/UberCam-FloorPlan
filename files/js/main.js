$( document ).ready(function() {
   
  var arr_data = $('#result2').html().trim().split(",");
  var building_arr = [];
  var floor_arr = [];
  for (var i=0; i< arr_data.length-1;i+=2) {
    building_arr.push(arr_data[i].trim());
    floor_arr.push(arr_data[i+1].trim());
  }
  
  function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
  }

  var building_arr_unique = building_arr.filter( onlyUnique ); 

  for (var i=0; i< building_arr_unique.length;i++) {
    var template =  '<option value="'+building_arr_unique[i]+'">'+building_arr_unique[i]+'</option>';
    $('#building_open').append(template);
  }
  
  document.getElementById("floor_open").disabled = true;

  $('[data-toggle="popover"]').popover({container:'body', html:true}); 
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  var error = "";
  var success="";
  var load_error = "";
  var deleteVar = "";
  var updateVar = "";
  var img_name = "";
  var input_alert = document.getElementById("input-alert");
  

  $("#building_open").change(function(){
    event.preventDefault();  
    var building_select = $( "#building_open option:selected" ).text();
    var f=[];
    var found = building_arr.filter(function(item, index) { 
      if (item == building_select){
         f.push(index);
         return true;
      }
      else {
        return false;
      }
       });   
    
    var new_floor_arr = [];
    for(var j=0; j<f.length; j++) {
      new_floor_arr.push(floor_arr[f[j]]); 
    }
    $('#floor_open').empty();
    $('#floor_open').append(' <option value="" disabled selected> -- select an option -- </option>');
    document.getElementById("floor_open").disabled = false;
    for (var k=0; k< new_floor_arr.length;k++) {
       var template =  '<option value="'+new_floor_arr[k]+'">'+new_floor_arr[k]+'</option>';
      $('#floor_open').append(template);
    }

  });
 

  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    switch(pair[0]) {
      case 'error':
        error = pair[1];
        break;
      case 'name':
        img_name = pair[1];
        break;
      case 'success':
        success = pair[1];
        break;
      case 'load_error':
        load_error = pair[1];
        break;
        case 'delete':
          deleteVar = pair[1];
          break;
        case 'update':
          updateVar = pair[1];
          break;  
    }
  }
  var alert_msg = document.getElementById("main-alert");
  if (success !="") {
    $('#saveModal').modal('show');
    alert_msg.className = "alert alert-success";
    alert_msg.innerHTML = "Floor plan is saved";
    var edit_btn_save = document.getElementById("edit_save");
    edit_btn_save.setAttribute('href','/edit_temp');
  }
  if (error != "") {
    $('#saveModal').modal('show');
    var error = error.replace(/%20/g, " ");
    alert_msg.className = "alert alert-danger";
    alert_msg.innerHTML = error;
  }

  if (img_name != "") {
    var show_image = document.getElementById("show_image");
    show_image.src = "/images/" + img_name; 
  }
  if (img_name != "" && error == "" & success =="") {
     $('#loadModal').modal('show');
     var load_image = document.getElementById("load_image");
     load_image.src = "/images/" + img_name; 
     var delete_btn = document.getElementById("delete");
     delete_btn.setAttribute('href','/delete');  
     var edit_btn_load = document.getElementById("edit_load");
     edit_btn_load.setAttribute('href','/edit_temp');
  }
  if (load_error != "") {  
    input_alert.innerHTML = "No floor plan was found."
    input_alert.className = "alert alert-danger";
    input_alert.style.opacity = "1";  
  }
  if (deleteVar != "" || updateVar != "") {
    var msg = (deleteVar != "") ? "deleted" : "updated";
    input_alert.innerHTML = "Floor plan was successfully " + msg + "."
    input_alert.className = "alert alert-success";
    input_alert.style.opacity = "1";  
  }
  
});


function validateSaveForm() {
  var field_arr = ["building_name", "floor", "floorplan"];
  var message_arr = ["Building name", "Floor number", "Floor plan file"];
  var input_alert = document.getElementById("input-alert");
  input_alert.className = "alert alert-danger";
  input_alert.innerHTML = "";
  for (var i=0; i<field_arr.length; i++) {
    var x = document.forms["saveForm"][field_arr[i]].value;
    if (x == null || x == "") {
    input_alert.innerHTML = message_arr[i] + " must be filled out." 
    input_alert.style.opacity = "1";  
    return false;
    }
    else {
      input_alert.style.opacity = "0"; 

    }
  }
  var floorplan_name = document.forms["saveForm"]["floorplan"].value;
  if (floorplan_name.split(".")[1] != 'svg') {
    input_alert.innerHTML = "File must be SVG type" 
    input_alert.style.opacity = "1";  
    return false;
  }   
}

function validateLoadForm() {
  var field_arr = ["building_name", "floor"];
  var message_arr = ["Building name", "Floor number"];
  var input_alert = document.getElementById("input-alert");
  input_alert.className = "alert alert-danger";
  input_alert.innerHTML = "";
  for (var i=0; i<field_arr.length; i++) {
    var x = document.forms["loadForm"][field_arr[i]].value;
    if (x == null || x == "") {
    input_alert.innerHTML = message_arr[i] + " must be filled out." 
    input_alert.style.opacity = "1";  
    return false;
    }
    else {
      input_alert.style.opacity = "0"; 

    }
  }   
}
	
function get_file_content() {
  var file = document.getElementById("uploadFile").files[0];
  
  if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
     //   console.log(evt.target.result);
        document.getElementById("file_content").value = evt.target.result;
       //  console.log(evt.target.result);
      }
      reader.onerror = function (evt) {
        //  document.getElementById("fileContents").innerHTML = "error reading file";
        console.log("error");
      }
  }
}


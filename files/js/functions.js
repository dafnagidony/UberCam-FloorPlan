//map svg node to d3 data array
function map_svg(node,attr_arr) {
	var child_nodes = node.childNodes;
	for (var i = 0; i < child_nodes.length; i++) {
		var patt1 = /\n/;
		if (child_nodes[i].data && child_nodes[i].data.search(patt1) != -1) {
    	continue;
  	}
		if (child_nodes[i].hasChildNodes()) { //parent nodes
		 	attr_arr.push(child_nodes[i].attributes);
		 	map_svg(child_nodes[i],attr_arr);
		 	attr_arr = [];
		 	continue;
    }
  	else  { //children nodes	
    	if (child_nodes[i].tagName == "path" || child_nodes[i].tagName == "polygon"|| child_nodes[i].tagName == "rect"){
		    var element = child_nodes[i];	 
		    var str = {};
		    var element_attr = {};
		    for (var k=0; k< attr_arr.length; k++) {
		    	for (var j=0; j< attr_arr[k].length; j++) {
		    		element_attr[attr_arr[k][j].name] = attr_arr[k][j].value;
		    	}
		    }	
				for(var j=0; j<element.attributes.length; j++) {
					if (element.attributes[j].name in element_attr) {
						element_attr[element.attributes[j].name] += element.attributes[j].value;
					}
					else {
						element_attr[element.attributes[j].name] = element.attributes[j].value;
					}		 
				}
			  if ("transform" in element_attr) {
			    var transform = element_attr["transform"];
			    delete element_attr["transform"];
			    var arr_of_string = transform.split(",");
			    str["x"] = parseInt(arr_of_string[0].split("(")[1]);
		    	str["y"] = parseInt(arr_of_string[1].split(")")[0]);
			  }
			  else {
			    str["x"] = 0;
			    str["y"] = 0;
			  }
			  str["type"] = element.tagName;
			  switch(element.tagName) {
				  case "path":
				    str["d"] = element_attr["d"];
				    delete element_attr["d"];
				    break;
				  case "polygon":
		        str["d"] = element_attr["points"];
		        delete element_attr["points"];
		        break;
				  case "rect":
		        str["d"] = [element_attr["x"],element_attr["y"],element_attr["width"],element_attr["height"]];
		        delete element_attr["x"];
		        delete element_attr["y"];
		        delete element_attr["width"];
		        delete element_attr["height"];
		        break;  
				}	
				if ("class" in element_attr) {
					var class_arr = (element_attr["class"]).split(" ");
					if (class_arr.indexOf("state") == -1) {
						class_arr.push("state");
					} 
					str["class"] =class_arr.join(" ");
					delete element_attr["class"];
				}
				else {
					str["class"] = "state";
				}

				var g_state_style_parse = [];
				var g_state_style = getStyle('g.state').split(';');
				for (var k=0; k < g_state_style.length; k +=1) {
					var tmp = g_state_style[k].split(":");
					if (g_state_style[k] != "") {
						g_state_style_parse.push(tmp[0].trim(),tmp[1].trim());
					}		
				}

				var new_style_str = "";
				var orig_style = element_attr["style"].split(';');
				for (var k=0; k < orig_style.length; k +=1) {
					var orig_style_parse = orig_style[k].split(":");
					var orig_index = g_state_style_parse.indexOf(orig_style_parse[0].trim());
					if (orig_index == -1) {
						new_style_str += orig_style_parse[0] +":"+orig_style_parse[1]+";";
					}
					
				}

				str["style"] = ("style" in element_attr) ? new_style_str : "";
				delete element_attr["style"];
				var attr_str="";
				for(var key in element_attr) {
					attr_str += key +":"+element_attr[key] + ";";		 
				}		
				str["style"] += attr_str; 
			  data.push(str);
		  }
	    else {
	    	ignored_nodes.push(child_nodes[i]);
	    	continue;
	    }
	    attr_arr = [];
	    continue;
    }
	}
}

// clone a node tree
function clone(obj) {
	var copy;
	if (null == obj || "object" != typeof obj) return obj;
	if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
    }
    return copy;
	}
	if (obj instanceof Object) {
		copy = {}; 
  	for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
 	 }
 	 return copy;
 	}
 	if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
    }
    return copy;
	}
}
 
function find_xy(d,parent_node) {
	var temp = parent_node.getAttribute("transform").split(",");
	var t_x = parseInt(temp[0].split("(")[1]);
	var t_y = parseInt(temp[1].split(")")[0]);
	if (parent_node.childNodes[0].tagName == 'rect') {
		var min_x = parseInt(d.d[0]) + t_x;
		var min_y = parseInt(d.d[1]) + t_y;
		var max_x = parseInt(d.d[0])+parseInt(d.d[2]) + t_x;
		var max_y = parseInt(d.d[1])+parseInt(d.d[3]) + t_y;
		return [min_x, min_y, max_x, max_y]; 
	}	
	var min_x = 950;
	var min_y = 600;
	var max_x = 0;
	var max_y = 0;
	var points_arr = path_find_cordinations(d.d);
	for (var i=0; i < points_arr.length; i+=2) {
		var tmp_x = parseInt(points_arr[i]) + t_x;
		var tmp_y = parseInt(points_arr[i+1]) + t_y;
		
		if ( tmp_x < min_x) {
			min_x = tmp_x;
		}
		if ( tmp_y < min_y) {
			min_y = tmp_y;
		}
		if ( tmp_x > max_x) {
			max_x = tmp_x;
		}
		if ( tmp_y > max_y) {
			max_y = tmp_y;
		}
	}
	return [min_x, min_y, max_x, max_y]; 
}

function on_drag(d,i,node) {
  var selection = d3.selectAll( '.selected');  
	selection.each(function(state_data,i) {
  	var arr = node.childNodes[0].getAttribute("x_y").split(",");
  	arr[0] = parseInt(arr[0]) + d3.event.dx;
  	arr[1] = parseInt(arr[1]) + d3.event.dy;
  	arr[2] = parseInt(arr[2]) + d3.event.dx;
  	arr[3] = parseInt(arr[3]) + d3.event.dy;
  	node.childNodes[0].setAttribute("x_y", arr.toString()); 
  });		    
  if( selection[0].indexOf(node)==-1) {
      selection.classed( "selected", false);
      selection = d3.select(node);
      selection.classed( "selected", true);
  }
  selection.attr("transform", function( d, i) {
      d.x += d3.event.dx;
    	d.y += d3.event.dy;
      return "translate(" + [ d.x,d.y ] + ")"

  })
	d3.event.sourceEvent.stopPropagation();
}

function getStyle(className) {
	var classes = document.styleSheets[0].cssRules;
	for (var x = 0; x < classes.length; x++) {
    if (classes[x].selectorText == className) {
      return classes[x].style.cssText;
    }
  }
}

function generate_robot_view() {
	d3.selectAll( 'g.selected').classed( "selected", false);
	var svg_robot = document.getElementById("floorplan_robot").getElementsByTagName("svg");
	var floorplan_svg = document.getElementById("floorplan").getElementsByTagName("svg");
	while (svg_robot[0].hasChildNodes()) {   
		svg_robot[0].removeChild(svg_robot[0].firstChild);
	}
	for(var k=0;k < floorplan_svg[0].childNodes.length; k++) {
		if (floorplan_svg[0].childNodes[k].className != "" && floorplan_svg[0].childNodes[k].className != undefined) {
			var elem_class = floorplan_svg[0].childNodes[k].className.baseVal;
			var elem_class_arr = elem_class.split(" ");
			if (elem_class_arr.indexOf("virtual") == -1 && elem_class != "") {
				var cln = floorplan_svg[0].childNodes[k].cloneNode(true);
				svg_robot[0].appendChild(cln);
			}
		}
	}
}

function writeCss(floorplanName) {
	var allElements = document.getElementById(floorplanName).getElementsByTagName("g");
	for (var i=0; i < allElements.length; i++) {
		var g_elem_class = allElements[i].className.baseVal.split(" ");
		var  g_elem_class_filter = g_elem_class.filter(function( obj ) {
			return (obj != "");
		});
		var classText = "";
		var className = "";
		var style_tmp;
		for (j=0; j< g_elem_class_filter.length; j++) {
			if (g_elem_class_filter[j] == "virtual") {
				className = "g.state.virtual";
			}
			else if (g_elem_class_filter[j] == "state") {
				className = "g.state";
			}
			else {
				className = g_elem_class_filter[j];
			}
			style_tmp = getStyle(className);
			if (style_tmp != undefined) {
				classText += getStyle(className) ;
			}
		}	
		if (classText != "") {
			var classTextArr = classText.split(";");
			var elemOrigStyleArrSplit = [];
			if (allElements[i].getAttribute("style") != null) {
				var elemOrigStyleArr = allElements[i].getAttribute("style").split(";");
				for (var k=0; k< elemOrigStyleArr.length-1; k++) {
					var tmp = elemOrigStyleArr[k].split(":");
					elemOrigStyleArrSplit.push(tmp[0].trim(),tmp[1].trim());
				}
			}
			for (var j=0; j< classTextArr.length-1; j++) {
				var classTextArrSplit = classTextArr[j].split(":");
				console.log(classTextArrSplit);
				var index_in_orig_style = elemOrigStyleArrSplit.indexOf(classTextArrSplit[0].trim());
				if (index_in_orig_style != -1) {	
					elemOrigStyleArrSplit[index_in_orig_style+1] = classTextArrSplit[1];
				}	
				else {
					elemOrigStyleArrSplit.push(classTextArrSplit[0].trim(),classTextArrSplit[1].trim());
				}				
			}	
			var new_style = "";
			for (var k=0; k < elemOrigStyleArrSplit.length; k+=2) {
			//	console.log(new_style);
				new_style +=( elemOrigStyleArrSplit[k].trim()+ ":" + elemOrigStyleArrSplit[k+1].trim() + ";");
			}

			allElements[i].setAttribute('style', new_style);			
		}
//	allElements[i].removeAttribute('origin_style');
	allElements[i].childNodes[0].removeAttribute('x_y');
	}
}

function sort_data(in_data) {
	var path_data = [];
	var polygon_data = [];
	var rect_data=[];
	for (var i=0; i< in_data.length; i++) {
		switch (in_data[i].type) {
			case "path":
				path_data.push(in_data[i]);
				break;
			case "polygon":
				polygon_data.push(in_data[i]);
				break;
			case "rect":
				rect_data.push(in_data[i]);
				break;
		}
	}
	return {"path_data": path_data, "polygon_data": polygon_data, "rect_data": rect_data};
}

function press_button(button_name,draw_enable) {
	document.getElementById("floorplan").style.cursor = "auto";
	draw_enable = !draw_enable;
		if (draw_enable) {
			button_name.parentNode.className = button_name.parentNode.className + " pressed"
		}
		else {
			button_name.parentNode.className = "button-icon";
		}
		
	return draw_enable;
}

function enable_buttons(isSelected) {
  if (isSelected) {
  	document.getElementById('delete').parentNode.className = "button-icon";
  	document.getElementById('virtual').parentNode.className = "button-icon";
  }
  else {
  	document.getElementById('delete').parentNode.className = "button-icon disabled";
  	document.getElementById('virtual').parentNode.className = "button-icon disabled";
  }
}

function disable_scale_form_input(input) {
	document.getElementById('meter_input').disabled = input;
	document.getElementById('feet_input').disabled = input;
	document.getElementById('length_input').disabled = input;
	document.getElementById('submit_scale').disabled = input;
}

function path_find_cordinations(s) {
	var a_match = /[A]/i;
	var numbers = /\d+/g;
	var m;
	var points_arr = [];
	var new_s = s;
	if (a_match.test(s)) {
		new_s = s.slice(0,a_match.exec(s).index);
	}
		while ((m = numbers.exec(new_s)) != null) {
  		points_arr.push(m[0]);
		}	
	return(points_arr);
}

function display_visual_scale(scale_unit, scale_length) {
	if (scale_unit && scale_length) {
		document.getElementById("scale_bar").innerHTML = '';
	var text_unit_num = 1;	
	if (scale_unit == 'feet') {
		scale_length = scale_length / 3.28084;
	}
	var bar_length = scale_length* svg_canvas_width_ratio ;
	while (bar_length > 100) { 
		bar_length = bar_length/10;
		text_unit_num = text_unit_num / 10;
	}
	while (bar_length < 40) { 
		bar_length = bar_length*5;
		text_unit_num = text_unit_num * 5;
	}
	var scale_svg = d3.select("#scale_bar").append("svg")
		.attr("width", 80)
		.attr("height", 50)
		.append("text")  
		.attr("x", 0)
		.attr("y", 15)
		.text(text_unit_num+ " " + scale_unit )
		.attr("font-family", "sans-serif")
		.attr("font-size", "14px")
		.attr("fill", "black");
	
	var scale_svg = d3.select("#scale_bar").append("svg")
		.attr("width", bar_length)
		.attr("height", 50)
		.append("path")
		.attr("d", "M0,0 L0,10 L"+ bar_length+",10 L"+bar_length+",0")
		.style("stroke", "black")
		.style("fill", "none")
		.style("stroke-width", "4");
	}
}

function create_mark_on_floorplan(p, current_node, type) {
	var translate_arr = [];
	var str = current_node.parentNode.getAttribute('transform');
	if (str == null) {
		translate_arr = [0,0];
	}
	else {
		translate_arr[0] = str.split(",")[0].toString().split("(")[1];
		translate_arr[1] = str.split(",")[1].toString().split(")")[0];
	}
	if (p[0] <0) {p[0] = 0;};
	if (p[1] <0) {p[1] = 0;};
	var x_poi = (p[0]+parseInt(translate_arr[0]));
	var y_poi = (p[1]+parseInt(translate_arr[1]));
	var poi_mark = add_icon(x_poi, y_poi, type)
	return [x_poi, y_poi, poi_mark];
}

function add_icon(x_poi, y_poi, type) {
	var poi_mark = document.createElement('i');
	if (type == "poi") {
		poi_mark.className = "fa fa-map-marker fa-2x";
		poi_mark.style.left = x_poi * svg_canvas_width_ratio - 6 + "px";
		poi_mark.style.top = y_poi * svg_canvas_width_ratio - 21 + "px";
	}
	else {
		poi_mark.className = "fa fa-times fa-2x";
		poi_mark.style.left = x_poi * svg_canvas_width_ratio - 9.25 + "px";
		poi_mark.style.top = y_poi * svg_canvas_width_ratio - 13.5 + "px";
	}
	poi_mark.style.fontSize = "1.5em";
	poi_mark.style.position = "absolute";
	
	document.getElementById('floorplan').appendChild(poi_mark);
	return poi_mark;

}

function read_poi_cookie () {
	var read_cookie = getCookie("poi");
	if (read_cookie.length > 1) {
		var str = read_cookie;
	}
	else {
		var str = "[]";
	}
	str = str.replace(/\%5B/g, '[');
	str = str.replace(/\%7B/g, '{');
	str = str.replace(/\%22/g, '"');
	str = str.replace(/\%3A/g, ':');
	str = str.replace(/\%2C/g, ',');
	str = str.replace(/\%5D/g, ']');
	str = str.replace(/\%7D/g, '}');
	str = '{"poi": ' + str + "}";
	return(str);    	
}

function display_poi() {
	var poi_arr = read_poi_cookie();
  var poi_obj = JSON.parse(poi_arr);	
  for (var i=0; i< poi_obj["poi"].length;i++) {
  	var poi_name = poi_obj["poi"][i]['name'];
  	var poi_type = poi_obj["poi"][i]['type'];
  	var x_poi = poi_obj["poi"][i]['cordinates'][0];
  	var y_poi = poi_obj["poi"][i]['cordinates'][1];
  	var poi_mark = add_icon(x_poi, y_poi, "poi")
  	var t = document.createTextNode(poi_name);
		poi_mark.appendChild(t);			
  }
  var floorplan_poi_serialize = JSON.stringify(poi_obj["poi"]);
	document.getElementById("floorplan_poi").value = floorplan_poi_serialize;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function radio_buttons_off() {
	rect_selection = true;
	rect_selection = press_button(rect_selection_button,rect_selection);
	draw_path_enable = true; 
	draw_path_enable = press_button(draw_line_button,draw_path_enable);
	draw_polygon_enable = true;
	draw_polygon_enable = press_button(draw_polygon_button,draw_polygon_enable);
	scale_button_enable = true;
	scale_button_enable = press_button(scale_button,scale_button_enable);
	poi_enable = true;
	poi_enable = press_button(poi_button,poi_enable);
}

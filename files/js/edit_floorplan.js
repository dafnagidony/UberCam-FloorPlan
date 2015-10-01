$(document).ready(function(){
	$('[data-toggle="tooltip"]').tooltip({html: true}); 
	$('[data-toggle="tooltip"]').mouseleave(function(){
    $('[data-toggle="tooltip"]').tooltip('hide');
	});
	var query = window.location.search.substring(1);
  var image_name = query.split("image_name=")[1];      		
	var floorplan_svg = document.getElementById("floorplan").getElementsByTagName("svg");
	var svg_robot = document.getElementById("floorplan_robot").getElementsByTagName("svg");
	var button_select_disable = true;
	var a = document.getElementById("alphasvg");
	var scale_length = getCookie("scale_length");
	var scale_unit = getCookie("scale_unit");
	document.getElementById('floorplan_name').value = image_name;
	document.getElementById('alphasvg').data = "/images/" + image_name;	
	document.getElementById("floorplan_scale_unit").value = scale_unit;
	document.getElementById("floorplan_scale_length").value = scale_length;
	window.poi_enable = false;
	window.rect_selection = false;
	window.draw_polygon_enable = false;
	window.draw_path_enable = false;
	window.scale_button_enable = false;
	var poi_cordinates;
	var scale_cordinates;	
	a.addEventListener("load",function(){
  	var svgDoc = a.contentDocument; //get the inner DOM of alpha.svg	
  	data = [];
  	ignored_nodes = [];
  	var svg_node = svgDoc.getElementsByTagName("svg")[0];
  	map_svg(svg_node, []); //extract data from svg 
  	var svg_data = [];
  	var floorplan_width = parseInt(window.getComputedStyle(document.getElementById("floorplan")).getPropertyValue('width').split('px')[0]);
  	if (svg_node.getAttribute('viewBox') == null ) {
  		svg_canvas_width_ratio = 1;
  		var svg_height = svg_node.height.baseVal.value;
  		var viewBox = "0,0,"+ floorplan_width+","+svg_height;
  	}
  	else {
  		svg_canvas_width_ratio = floorplan_width / (parseInt(svg_node.viewBox.baseVal.width)-parseInt(svg_node.viewBox.baseVal.x));
  		var svg_height = (parseInt(svg_node.viewBox.baseVal.height)-parseInt(svg_node.viewBox.baseVal.y)) * svg_canvas_width_ratio;
  		var viewBox = svg_node.viewBox.baseVal.x+ " "+svg_node.viewBox.baseVal.y+ " "+svg_node.viewBox.baseVal.width+ " "+svg_node.viewBox.baseVal.height;
  	}
  	display_visual_scale(scale_unit, scale_length);
  	display_poi();
  	svg_data.push({"width" : floorplan_width, "height": svg_height, "viewBox": viewBox});
		var original_data = clone(data);
		var canvas = d3.select("#floorplan").append("svg")
				.data(svg_data)
				.attr("height",function(d) { return d.height;})
				.attr("width",function(d) { return d.width;})
				.attr("viewBox", function(d) {return d.viewBox;});

		d3.select("#floorplan_robot").append("svg")
			.data(svg_data)
			.attr("height",function(d) { return d.height;})
			.attr("width",function(d) { return d.width;})
			.attr("viewBox", function(d) {return d.viewBox;});

		var refreshGraph = function() {
			var data_arr = sort_data(data);
			var gStates_rect = canvas.selectAll("g.state.rect").data(data_arr.rect_data);
			var gState_rect = gStates_rect.enter().append( "g")
	    .attr({
	        transform   : function(d) { return "translate("+ [d.x,d.y] + ")";},
	        class       : function(d) { return d.class;},
	        style: function(d) {return d.style;}
	    });
			var gStates_polygon = canvas.selectAll("g.state.poly").data(data_arr.polygon_data);
			var gState_polygon = gStates_polygon.enter().append( "g")
	    .attr({
	        transform : function(d) { return "translate("+ [d.x,d.y] + ")";},
	        class     : function(d) { return d.class;},
	        style: function(d) {return d.style;}   
	    });

			var gStates_path = canvas.selectAll("g.state.path").data(data_arr.path_data);
			var gState_path = gStates_path.enter().append( "g")
	    .attr({
	        transform : function(d) { return "translate("+ [d.x,d.y] + ")";},
	        class     : function(d) { return d.class;},
	        style: function(d) {return d.style;}
	    });

	    gState_rect.append( "rect")
				.data(data_arr.rect_data)
		    .attr("x", function (d) { return d.d[0];})
		    .attr("y", function (d) { return d.d[1];})
		    .attr("width", function (d) { return d.d[2];})
		    .attr("height", function (d) { return d.d[3];})
		    .attr("x_y", function (d) { return find_xy(d,this.parentNode); })
		    .on( "click", function( d, i) {
		    	if (scale_button_enable && scale_cordinates.length < 2) {
		    		var p = d3.mouse( this);
		    		scale_cordinates.push(create_mark_on_floorplan(p,this, "scale"));
		    		if (scale_cordinates.length == 2) {
		    			$('#scaleModal').modal('show');
		    		}
		    	}
		    	else if(poi_enable) {
		    		var p = d3.mouse( this);
		    		poi_cordinates = create_mark_on_floorplan(p,this, "poi");
		    		$('#poiModal').modal('show');
		    	}
		    	else {
		    		var g = this.parentNode;
	    			var isSelected = !(d3.select(g).classed( "selected"));
          	d3.select(g).classed( "selected", isSelected);
          	enable_buttons(isSelected);
		    	}
        })
		    .on("mouseover", function(){
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", true);
	    	})
	    	.on("mouseout", function() { 
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", false);
	    	})
	    	var drag = d3.behavior.drag()
	    	.on("dragstart", function() {
  				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				})
				.on("drag", function( d, i) { on_drag(d,i,this)});
				gState_rect.call( drag);


	    gState_polygon.append( "polygon")
				.data(data_arr.polygon_data)
		    .attr("points", function (d) { return d.d; })
		    .attr("x_y", function (d) { return find_xy(d,this.parentNode); })
		    .on( "click", function( d, i) {
		    	if (scale_button_enable && scale_cordinates.length < 2) {
		    		var p = d3.mouse( this);
		    		scale_cordinates.push(create_mark_on_floorplan(p,this, "scale"));
		    		if (scale_cordinates.length == 2) {
		    			$('#scaleModal').modal('show');
		    		}
		    	}
          else if (poi_enable){
		    		var p = d3.mouse( this);
		    		poi_cordinates = create_mark_on_floorplan(p,this, "poi");
		    		$('#poiModal').modal('show');
		    	}
		    	else {
          	var g = this.parentNode;
	    			var isSelected = !(d3.select(g).classed( "selected"));
          	d3.select(g).classed( "selected", isSelected);
          	enable_buttons(isSelected);
          }
        })
		    .on("mouseover", function(){
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", true);
	    	})
	    	.on("mouseout", function() { 
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", false);
	    	})
	    	var drag = d3.behavior.drag()
	    	.on("dragstart", function() {
  				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				})
				.on("drag", function( d, i) { on_drag(d,i,this)});
				gState_polygon.call( drag);

			gState_path.append( "path")
				.data(data_arr.path_data)
		    .attr("d", function (d) { return d.d; })
		    .attr("x_y", function (d) { return find_xy(d,this.parentNode); })
		    .on( "click", function( d, i) {
		    	if (scale_button_enable && scale_cordinates.length < 2) {
		    		var p = d3.mouse( this);
		    		scale_cordinates.push(create_mark_on_floorplan(p,this, "scale"));
		    		if (scale_cordinates.length == 2) {
		    			$('#scaleModal').modal('show');
		    		}
		    	}
          else if (poi_enable){
		    		var p = d3.mouse( this);
		    		poi_cordinates = create_mark_on_floorplan(p,this, "poi");
		    		$('#poiModal').modal('show');
		    	}
		    	else {
          	var g = this.parentNode;
	    			var isSelected = !(d3.select(g).classed( "selected"));
          	d3.select(g).classed( "selected", isSelected);
          	enable_buttons(isSelected);
          }
        })
        .on("mouseover", function(){
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", true);
	    	})
	    	.on("mouseout", function() { 
	    			var g = this.parentNode;
	    			d3.select( g).classed( "mouseOver", false);
	    	});
	    	var drag = d3.behavior.drag()
	    	.on("dragstart", function() {
  				d3.event.sourceEvent.stopPropagation(); // silence other listeners
				})
				.on("drag", function( d, i) { on_drag(d,i,this)});
				gState_path.call( drag);

				canvas
				.on( "mousedown", function() {
					var p = d3.mouse( this);
					if (poi_enable) {
		    		poi_cordinates = create_mark_on_floorplan(p,this, "poi");
		    		$('#poiModal').modal('show');
					}
					if (scale_button_enable && scale_cordinates.length < 2) {
		    		var p = d3.mouse( this);
		    		scale_cordinates.push(create_mark_on_floorplan(p,this, "scale"));
		    		if (scale_cordinates.length == 2) {
		    			$('#scaleModal').modal('show');
		    		}
		    	}
					if (rect_selection) {
				    d3.selectAll( 'g.selected').classed( "selected", false);
			      enable_buttons(true);
				    canvas.append( "rect")
				    	.attr({
				        class   : "selection",
				        x       : p[0],
				        y       : p[1],
				        width   : 0,
				        height  : 0,
				        start_x : p[0],
				        start_y : p[1]
				    })
				    .style("fill" ,"transparent")
				    .style("stroke" ,"grey")
				    .style("stroke-width" ,"1px")
				  }
				  else if (draw_path_enable) {
				  	canvas.append("path")
				  		.attr({
				  			class: "draw_path",
				  			m: "M"+  p[0] + ","+ p[1]
				  		})
				  }
				  else if (draw_polygon_enable) {
				  	var draw_polygon = canvas.select("polygon.draw_polygon");
			    	if (!draw_polygon.empty()) {
			    		 var temp = draw_polygon.attr("points") + " " + p[0] + ","+ p[1];
		        		draw_polygon.attr({"start" : temp});
			    	}
			    	else {
					  	canvas.append("polygon")
					  		.attr({
					  			class: "draw_polygon",
					  			start: p[0] + ","+ p[1]
					  		})
				  	}
				  }
				})
				.on( "mousemove", function() {
					var p = d3.mouse( this);
			    var s = canvas.select( "rect.selection");
			    var draw_path = canvas.select("path.draw_path");
			    var draw_polygon = canvas.select("polygon.draw_polygon");
			    if (!draw_polygon.empty()) {
		        var temp = draw_polygon.attr("start") + " " + p[0] + ","+ p[1];
		        draw_polygon.attr({points : temp});
			    }
			    if (!draw_path.empty()) {	
		        var temp = draw_path.attr("m") + " L" + p[0] + ","+ p[1];
		        draw_path.attr({d : temp});
			    }
			    if( !s.empty()) {    
			        var d = {
			                x       : parseInt( s.attr( "x")),
			                y       : parseInt( s.attr( "y")),
			                width   : parseInt( s.attr( "width")),
			                height  : parseInt( s.attr( "height")),
			                start_x : parseInt( s.attr( "start_x")),
			                start_y : parseInt( s.attr( "start_y"))
			            },
			            move = {
			                x : p[0] - d.start_x,
			                y : p[1] - d.start_y
			            };

							if (move.x < 0) {
								 d.x = p[0];
								 d.width = -move.x;
							}
							else {
								d.width = move.x;  
							}

			       if (move.y < 0) {
								 d.y = p[1];
								 d.height = -move.y;
							}
							else {
								d.height = move.y;
							}
			        s.attr( d);
			            // deselect all temporary selected state objects
			        d3.selectAll( 'g.state.selection.selected').classed( "selected", false);
			        enable_buttons(false);   
			        d3.selectAll('g.state').each( function( state_data, i) {
			        	var element_x_y = this.childNodes[0].getAttribute("x_y").split(",");
			            if( 
			                !d3.select( this).classed("selected") && 
			                    d.x <= element_x_y[2] && d.y <= element_x_y[3] &&
			                    d.x+d.width >= element_x_y[0] && d.y+d.height >= element_x_y[1]
			            ) {
			                d3.select( this)
			                .classed( "selection", true)
			                .classed( "selected", true);
			        				enable_buttons(true);
          
			            }
			        });      
			    }
			})
			.on( "mouseup", function() {
		    canvas.selectAll( "rect.selection").remove();
		    d3.selectAll( 'g.state.selection').classed( "selection", false);
		    var draw_path = canvas.select("path.draw_path");
			    if (!draw_path.empty()) {
			    	var str = {};
			    	str["d"] = draw_path.attr("d"); 
    				str["x"] = 0;
    				str["y"] = 0;
    				str["type"] = "path";
    				str["class"] = "state";
    				data.push(str); 
				  	canvas.selectAll( "path.draw_path").remove();
				  	canvas.selectAll("g.state").remove();
				  	refreshGraph();
			    }
			  var draw_polygon = canvas.select("polygon.draw_polygon");
			    if (!draw_polygon.empty()) {
			    	var p = d3.mouse( this);
			    	var temp = draw_polygon.attr("start") + " " + p[0] + ","+ p[1];
		        draw_polygon.attr({points : temp});
			    }
			})	
			.on( "contextmenu", function() {
				d3.event.preventDefault();
				var draw_polygon = canvas.select("polygon.draw_polygon");
			    if (!draw_polygon.empty()) {
			    	var str = {};
			    	str["d"] = draw_polygon.attr("points"); 
    				str["x"] = 0;
    				str["y"] = 0;
    				str["type"] = "polygon";
    				str["class"] = "state";
    				data.push(str); 
				  	canvas.selectAll( "polygon.draw_polygon").remove();
				  	canvas.selectAll("g.state").remove();
				  	refreshGraph();
			    }
			})  
	  };

	  refreshGraph();

	  var delete_button = document.getElementById("delete");
		delete_button.addEventListener('click', function (event) {
			event.preventDefault();
		  data = data.filter(function( obj ) {
  			return obj != canvas.selectAll("g.state.selected").datum();
			});
			canvas.selectAll("g.state.selected").remove();

  	});
	   
	  var undo_button = document.getElementById("undo");
		undo_button.addEventListener('click', function (event) {
			data = clone(original_data);
			canvas.selectAll("g.state").remove();
			event.preventDefault();
			refreshGraph();
  	});

  	window.scale_button = document.getElementById("scale");
		scale_button.addEventListener('click', function (event) {
			event.preventDefault();
			radio_buttons_off();
			scale_cordinates = [];
			scale_button_enable = press_button(scale_button,scale_button_enable);
			d3.selectAll( 'g.selected').classed( "selected", false);
			enable_buttons(false);
			if (scale_button_enable){
				document.getElementById("floorplan").style.cursor = "cell";
			}
			else {
				document.getElementById("floorplan").style.cursor = "auto";
			}
  	});
		
		close_scale_buttons = document.getElementsByClassName("close_scale");
 		for(var i=0;i<close_scale_buttons.length;i++){
        close_scale_buttons[i].addEventListener('click', function (event) {
        	scale_cordinates[0][2].parentNode.removeChild(scale_cordinates[0][2]);
        	scale_cordinates[1][2].parentNode.removeChild(scale_cordinates[1][2]);
        	scale_cordinates = [];
        	scale_button_enable = true;
					scale_button_enable = press_button(scale_button,scale_button_enable);
        });
        
    }
		
		var submit_scale_button = document.getElementById("submit_scale");
		submit_scale_button.addEventListener('click', function (event) {
			if ($('input[name="length"]').val() != 0 ) {
				$('#scaleModal').modal('hide');
				scale_cordinates[0][2].parentNode.removeChild(scale_cordinates[0][2]);
				scale_cordinates[1][2].parentNode.removeChild(scale_cordinates[1][2]);
				scale_unit = $('input[name="unit"]:checked').val();	
				var length =  Math.sqrt(Math.pow(parseInt(scale_cordinates[0][0])-parseInt(scale_cordinates[1][0]), 2) + Math.pow(parseInt(scale_cordinates[0][1])-parseInt(scale_cordinates[1][1]), 2));
				if (scale_unit == 'feet') {
					length = length / 0.3048;
				}
				scale_length =  length / $('input[name="length"]').val();
				document.getElementById("floorplan_scale_length").value = scale_length.toString();
				document.getElementById("floorplan_scale_unit").value = scale_unit;
				display_visual_scale(scale_unit, scale_length);
	      scale_cordinates = [];
	      $('input[name="length"]').val("");
	      scale_button_enable = true;
				scale_button_enable = press_button(scale_button,scale_button_enable);
			}
		});
 

 		submit_poi_button = document.getElementById("submit_poi");
 		submit_poi_button.addEventListener('click', function (event) {
			$('#poiModal').modal('hide');
			var poi_name = $('input[name="poi_name"]').val();
			var poi_type = $('input[name="poi_type"]').val();
			$('input[name="poi_name"]').val("");
			$('input[name="poi_type"]').val("");
			var t = document.createTextNode(poi_name);
    	poi_cordinates[2].appendChild(t);
    	var poi_arr = read_poi_cookie();
    	var poi_obj = JSON.parse(poi_arr);	
			poi_obj["poi"].push({cordinates: [poi_cordinates[0],poi_cordinates[1]],type: poi_type, name: poi_name});		
			var floorplan_poi_serialize = JSON.stringify(poi_obj["poi"]);
			document.getElementById("floorplan_poi").value = floorplan_poi_serialize;
			
		});

 		close_poi_buttons = document.getElementsByClassName("close_poi");
 		for(var i=0;i<close_poi_buttons.length;i++){
        close_poi_buttons[i].addEventListener('click', function (event) {
        	poi_cordinates[2].parentNode.removeChild(poi_cordinates[2]);
        });
    }

	var virtual_button = document.getElementById('virtual');
		virtual_button.addEventListener('click', function (event) {	
			event.preventDefault();
			var sel_arr = document.getElementsByClassName("selected");
			for (var i=0; i< sel_arr.length; i++) {	
				var virtual = d3.select(sel_arr[i]).classed( "virtual");		
				d3.select(sel_arr[i]).classed( "virtual", !virtual);	
			}
			d3.selectAll( 'g.selected').classed( "selected", false);	
			enable_buttons(false);
  	}, false);

		
		window.draw_line_button = document.getElementById('draw_line');
		draw_line_button.addEventListener('click', function (event) {	
			event.preventDefault();
			radio_buttons_off();
			draw_path_enable = press_button(draw_line_button,draw_path_enable);
			d3.selectAll( 'g.selected').classed( "selected", false);
			enable_buttons(false);
  	}, false);

		
		window.draw_polygon_button = document.getElementById('draw_polygon');
		draw_polygon_button.addEventListener('click', function (event) {	
			event.preventDefault();
			radio_buttons_off();
			draw_polygon_enable = press_button(draw_polygon_button,draw_polygon_enable);
			d3.selectAll( 'g.selected').classed( "selected", false);
			enable_buttons(false);
  	}, false);

		
	  window.rect_selection_button = document.getElementById("rect_selection");
		rect_selection_button.addEventListener('click', function (event) {
			event.preventDefault();
			radio_buttons_off();
			rect_selection = press_button(rect_selection_button,rect_selection);
			d3.selectAll( 'g.selected').classed( "selected", false);
			enable_buttons(false);
  	});

		
		for (var i=0; i<ignored_nodes.length;i++) {
			floorplan_svg[0].appendChild(ignored_nodes[i]);		
		}
		
		
		
		window.poi_button = document.getElementById("poi");
		poi_button.addEventListener('click', function (event) {
			event.preventDefault();
			d3.selectAll( 'g.selected').classed( "selected", false);
			radio_buttons_off();
			poi_enable = press_button(poi_button,poi_enable);
			if (poi_enable){
				document.getElementById("floorplan").style.cursor = "cell";
			}
			else {
				document.getElementById("floorplan").style.cursor = "auto";
			}
		});


		var display_robot_btn = document.getElementById('display_robot_btn');
		display_robot_btn.addEventListener('click', function (event) {
			generate_robot_view();
			event.preventDefault();
		});

		//write to file
		var floorplan_scale_unit = document.getElementById("floorplan_scale_unit").value;
		var submit_button = document.getElementById('submit_button');
		submit_button.addEventListener('click', function (event) {
			d3.selectAll( 'g.selected').classed( "selected", false);
			generate_robot_view();
			writeCss("floorplan");
			writeCss("floorplan_robot");
			for (var k=0; k< svg_node.attributes.length; k++) {	
				floorplan_svg[0].setAttribute(svg_node.attributes[k].name, svg_node.attributes[k].value);	
			}
			var svg_xml = (new XMLSerializer).serializeToString(floorplan_svg[0]);	
			document.getElementById('floorplan_content').value = svg_xml;
			var svg_robot_xml = (new XMLSerializer).serializeToString(svg_robot[0]);	
			document.getElementById('floorplan_robot_view_content').value = svg_robot_xml;	
  	}, false);
  });
});
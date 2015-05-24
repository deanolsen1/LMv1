// Javascript for map page

 function SizeMe(map) {
	//Dynamically Resize Body
	$("body").height($(window).outerHeight()-40);
	$("body").width($(window).outerWidth());
	
	var iBodyWidth = $("body").width();
	var iBodyHeight = $("body").height();
	var iMenuOffset = 40;
	var iSubMenuOffset = 151;
	var iVCRHeight = 49;
	var iVCROffset = 20;
	
	$("#map").height($("body").height() - $("#map").offset().top);
	$("#menu").height($("#map").height() - iMenuOffset);
	$("#vcr-controls").css("top",($("#map").offset().top + $("#map").height()- iVCRHeight -iVCROffset) + "px")
	$("#SubjectiveMarkers").height($("#menu").height() - iSubMenuOffset);
	map.invalidateSize();
}


$(document).ready(function() {
	var markers;
    var SMFilter = [];
	var PageFilter = [];
	var thisPage = 9; //sets the first page of the counter to page 9
	var speed; //controls the interval of the increase/decrease speed functions.  
		//Speed acts as the inverse of time.  Increase in speed value == increase in pause
	var interval; //variable that holds several values for info data and speed


    L.mapbox.accessToken = 'pk.eyJ1Ijoiam9zaHVhLWFybXN0cm9uZyIsImEiOiJZM3dMR3pnIn0.6ZxWqnDdV6s-Tx9F6XKd1w';

    var map = L.mapbox.map('map', 'deanolsen1.m93pgn91', 
    	{zoomControl : false, 
    	//removed attribution from bottom of map to credits page
    	attributionControl: false});

       	map.setView([41.8369, -97.6847], 4);

	// extra way of zooming in -- has plus button and minus button for zooming
    new L.Control.Zoom({ position: 'topright' }).addTo(map);
	
	$(window).resize(function () { $("#sliderContainer").css("margin-right","0px"); $("#temporal-legend").css("margin-right","0px"); SizeMe(map) });
	 SizeMe(map);

    //load json data onto basemap; create tools
	$.getJSON("data/lmtest1.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info, data);
			createSliderUI(info.pages, info, data);
            menuSelection(info.SMs, info, data);
            updateMenu(info, data);
            sequenceInteractions(info, data);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

    //dynamically created checkbox options with the number of markers after the option
	function menuSelection(SMs, info, data) {
        var SMOptions = [];
        SMOptions.sort();
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" name=\"SMFilter\" value=\""+ CleanFName(SMs[index]) +"\">" + SMs[index] + " &nbsp;&#40;" + info.SMCount[SMs[index]] + "&#41;" + "</input>");
        };
        SMOptions.sort();


        //everytime click on the option, trigger the update Menu function
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
        $("#SubjectiveMarkers").on("click", function(event) {
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

		//selectall/ unselectall botton
  		$("#checkAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = true;                        
            });
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

        $("#uncheckAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = false;                        
            });
            updateMenu(info, data);
        });  

		//change map view to match initial view above. function to reset map view when button is clicked - center on 10th Arron.

		$("#resetMapBtn").click(function(event) {   
            map.setView([48.874, 2.358], 15);
        	});
    }
	
    function CleanFName(s){
		//Strip spaces, nonalphanumeric, and make lower
		return s.replace(/\s/g,"").replace(/[^a-zA-Z 0-9]+/g, '').toLowerCase();
	}
	

    //Store the checked option in filter, count number of checkbox selection, call createPropSymbols function
    function updateMenu(info, data){
       	SMFilter = [];
       	$( "input:checkbox[name=SMFilter]:checked").each(function(){
           SMFilter.push(CleanFName($(this).val()));
       	});

		$("#checkedNum").html(SMFilter.length + "<i>&nbsp;&nbsp;SMs selected</i>"
			 // <br>(&nbsp;&nbsp;)<i>&nbsp;&nbsp;=&nbsp;&nbsp;times cited in text</i>"
			)		
        createPropSymbols(info, data);
    }
    // Minimize menu toggle switch
        $(".buttonMin").click(function() {
    		$(this).toggleClass("btn-plus");
        	$("div.scroll").slideToggle();
    })


    //update pageline 
	function updatePages(info, data) {
		PageFilter = [];
		$( "input:output[name=PageFilter]:input change").each(function(){
			PageFilter.push($(this).val());
		});

	createPropSymbols(info, data);
	}

    //process geojson data; create required arrays
    function processData(data) {
        var pages = [];
        var pageTracker = [];
        var SMs = []
        var SMTracker = [];
        var SMCount = {};

        for (var feature in data.features) {
			var properties = data.features[feature].properties;

            //process page properties and store it in page Tracker array
            if (pageTracker[properties.Page] === undefined) {
                pages.push(properties.Page);
                pageTracker[properties.Page] = 1;
            }

            //process SM properties and store it in SM Tracker array
            if (SMTracker[properties.SM] === undefined) {
                SMs.push(properties.SM);
                SMTracker[properties.SM] = 1;
            }

            //process SM properties and count the number of each subjective markers
            if (SMCount[properties.SM] === undefined) {
            	SMCount[properties.SM] = 1;
            }
            else {
            	SMCount[properties.SM] += 1;
            }
		}
        return { 
            SMs : SMs,
            pages : pages.sort(function(a,b){return a - b}),
            SMCount : SMCount
        };
    };

    //function to create symbols
    function createPropSymbols(info, data, currentPage, speed) {
        if (map.hasLayer(markers)){
            map.removeLayer(markers);
        	};

       //filter to load the markers that are in selected pages or in check box
		markers = L.geoJson(data, {
            filter: function(feature, layer) {
			if (currentPage){
			//if page number matches currentPage, put feature on map
			if (feature.properties.Page == currentPage){
					return true;
			} else {
					return false;
					}
			} else {
				if ($.inArray(CleanFName(feature.properties.SM),SMFilter) !== -1) {  
                   return true;
            } else {
					return false;
				};
			}
        },

        //opacity of markers, transition time for black circle to appear
		pointToLayer: function(feature, latlng) {
			return L.circle(latlng, 100,{
                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
                    weight: 3,
				    fillOpacity: .4

                }).on({

					mouseover: function(e) {
						this.openPopup();
						//black ring around markers
						this.setStyle({color: '#000000'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: '#000000'});
					}
				});
			}
		}).addTo(map);
		updatePropSymbols();

	} // end createPropSymbols()

	

    //marker size, popup
    function updatePropSymbols() {
		markers.eachLayer(function(layer) {
			var props = layer.feature.properties;
			// size of circle markers
			var	radius = 100;
			var	popupContent = "<i><b>" + props.title + "</b></i>" + " <br>"+ props.description +"<br>page " + props.Page ;
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,10) });
            layer.options.color = PropColor(props.SM);
            layer.options.fillColor = PropColor(props.SM);
		});
	} // end updatePropSymbols


    //create the page timeline, chronological order of events
	function createSliderUI(Pages, info, data) {
		var sliderControl = L.control(
			//move slider to bottom right
			{ position: 'bottomright'} );

		sliderControl.onAdd = function(map) {
			var slider = L.DomUtil.create("input", "range-slider");
			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(slider)
				.attr({'type':'range', 
                       'max': Pages[Pages.length-1], 
                       'min':Pages[0], 
                       'step': 1,
					   'width' : 4,
                       'value': String(Pages[0])})

		        .on('input change', function() {
					createPropSymbols(info, data, this.value);
					//text for slider bar
		            $(".temporal-legend").text("on Page " + this.value);
		        });
			return slider;
		}
		sliderControl.addTo(map);
		createTemporalLegend(Pages [0]);
	} 

    //create page line time VCR control, starts out with pause button hidden until user clicks play button
	function sequenceInteractions(info, data) {
		$(".pause").hide();
		//play behavior
		$(".play").click(function(){
				$(".pause").show();
				$(".play").hide();
				map.setView([48.876, 2.357], 15);
				clearInterval(interval);
				speed = 150;
				animateMap(info, data, speed); 
				menuSelection(info.SMs, info, data);
				updateMenu();
			});

		//pause behavior; hides pause button if displayed and shows play button, stops all map action 
		$(".pause").click(function(){
				$(".pause").hide();
				$(".play").show();			
				stopMap(info, data, speed); 
			});

		//step behavior; stops map hides pause button if displayed and shows play button, increments data etc. by 1
		$(".step").click(function(){
			stopMap();
				$(".pause").hide();
				$(".play").show();
				step(info, data);
			});

		//back behavior; stops map hides pause button if displayed and shows play button, decrements data etc by 1
		$(".back").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				goBack(info, data);
			});

		//back behavior; stops map and changes buttons to cue user to change
		$(".back-full").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				backFull(info, data);
			});

		//full forward behavior - hides buttons and goes to end of timeline
		$(".step-full").click(function(){
				$(".pause").hide();
				$(".play").show();
				stepFull(info, data);
			});

		//decrease speed behavior, increases speed by 1/10 sec per click by lowering the interval 
		$(".faster").click(function(){
				if (speed>100) {
					speed = speed-100;
					clearInterval(interval);
					animateMap(info, data, speed); 
				}
				else (speed = 150);
				//extra code to ensure slider data progress at 1/4 second delay 
				//since initial speed starts at 250, changing by 100 would enable 
				//user to go outside of the bounds of either increase or decrease 
				//function by speed=50.  This handles that potential error 
			});

		//increase speed behavior, decreases speed by 1/10th sec per click by lowering the interval
		$(".slower").click(function(){
			if (speed<1000) {
			speed = speed+100;
			clearInterval(interval);
			animateMap(info, data, speed); 
			console.log(speed);
			}
			else {speed = 250};
			//extra code to ensure slider data progresses at 1/4 second delay 
			//since initial speed starts at 250, changing by 100 would enable 
			//user to go outsiude of the bounds of either increase or decrease 
			//function by speed=50.  This handles that potential error
			});
	}

	// create map animation
	function animateMap (info, data, speed) {
		interval = setInterval(function(){step(info, data)},speed);
	}
	//gives ability for map to stop in place by changing the speed and clearing the interval 
	function stopMap(info, data, speed){
		speed = 0;
		clearInterval(interval);
	}

	//function to set the counter and timeline back 1 without going past the first page (9)
	function goBack(info, data, speed){
		if (thisPage >9) {
			thisPage--; 
		}; 
		createPropSymbols(info, data, thisPage, speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "on Page " + thisPage);
	}

	//function to allow counter and data to increment by one
	function goForward(info, data, speed){
		thisPage++; 
		createPropSymbols(info, data, thisPage, speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "on Page " + thisPage);
	}
	//function to allow counter and data to increment by one
	function step(info, data, speed){
		if (thisPage <238) {
			thisPage++; 
			};
		createPropSymbols(info, data, thisPage,speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "on Page " + thisPage);
	}

	//takes the user to the last page (238)
	function stepFull(info, data, speed){
		thisPage=238; 
		createPropSymbols(info, data, thisPage);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "on Page " + thisPage);
	}

	//vcr control to first page, pg 9--book starts on pg 9
	function backFull(info, data, speed){
		thisPage=9; 
		createPropSymbols(info, data, thisPage);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "on Page " + thisPage);
	}

    //add page number demonstration 
	function createTemporalLegend(startTimestamp, speed) {
		var temporalLegend = L.control(
			//position to bottom right
			{ position: 'bottomright' });
		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}
		temporalLegend.addTo(map);
		$(".temporal-legend").text("on Page " + startTimestamp);
	}	
});
//end code


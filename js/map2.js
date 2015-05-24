// Javascript for map page


 function SizeMe(map) {
	//Dynamically Resize Body
	$("body").height($(window).outerHeight()-40);
	$("body").width($(window).outerWidth());
	
	var iBodyWidth = $("body").width();
	var iBodyHeight = $("body").height();
	var iMenuOffset = 40;
	var iSubMenuOffset = 161;
	//var iVCRHeight = 49;
	//var iVCROffset = 60;
	
	$("#map").height($("body").height() - $("#map").offset().top);
	$("#menu").height($("#map").height() - iMenuOffset);
	$("#SubjectiveMarkers").height($("#menu").height() - iSubMenuOffset);
	map.invalidateSize();
}

$(document).ready(function() {
	var markers;
	var iZoomNum = 0;
    var SMFilter = [];
	var PageFilter = [];
	var thisPage = 9; //sets the first page of the counter to page 9
	var interval; //variable that holds several values for info data and speed

    L.mapbox.accessToken = 'pk.eyJ1Ijoiam9zaHVhLWFybXN0cm9uZyIsImEiOiJZM3dMR3pnIn0.6ZxWqnDdV6s-Tx9F6XKd1w';

    var map = L.mapbox.map('map', 'joshua-armstrong.lghag6gh', 
    	{	zoomControl : false, 
    		opacity: 1.0,
	    	attributionControl: false});

       	map.setView([48.874, 2.358], 15);
		
	//Setup and initialize dynamic document resize functionality
	//In lieu of a better solution - the margin and removal is a hack to keep the vcr looking nice

	$(window).resize(function () { $("#sliderContainer").css("margin-right","0px"); $("#temporal-legend").css("margin-right","0px"); SizeMe(map) });
	 SizeMe(map);

    //load json data onto basemap; create tools
	$.getJSON("data/Locationsfrench.geojson")
		.done(function(data) {
			var info = processData(data);
			createPropSymbols(info, data);
			createSliderUI(info.pages, info, data);
            menuSelection(info.SMs, info, data);
            updateMenu(info, data);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

    //dynamically created checkbox options with the number of markers after the option
	function menuSelection(SMs, info, data) {
        var SMOptions = [];
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" name=\"SMFilter\" value=\""+ CleanFName(SMs[index]) +"\">" + SMs[index] + "&nbsp;&#40;" + info.SMCount[SMs[index]] + "&#41;" + "</input>");
        };
        SMOptions.sort();


        //everytime click on the option, trigger the update Menu function
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
        $("#SubjectiveMarkers input").on("click", function(event) {
            updateMenu(info, data);
        });

		//selectall/ unselectall botton
  		$("#checkAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = true;                        
            });
            updateMenu(info, data);
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

    //Store the checked option in filter, count number of checkbox selection, call createPropSymbols function
    function updateMenu(info, data){
       	SMFilter = [];
       	$( "input:checkbox[name=SMFilter]:checked").each(function(){
           SMFilter.push(CleanFName($(this).val()));
       	});

		//Remove old map info
		$( "input:checkbox[name=SMFilter]").not(":checked").each(function(){
			$("." + CleanFName($(this).val())).remove();
       	});

		$("#checkedNum").html(SMFilter.length + "<i>&nbsp;&nbsp;SMs selected</i> ")		
        createPropSymbols(info, data);
    }

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

	function CleanFName(s){
		//Strip spaces, nonalphanumeric, and make lower
		return s.replace(/\s/g,"").replace(/[^a-zA-Z 0-9]+/g, '').toLowerCase();
	}
	
	function GetZOb(f){
		//console.log(f);
		f.latlng =  new L.LatLng(f.target._animateToCenter.lat,f.target._animateToCenter.lng)
		$.extend(f,map.latLngToContainerPoint(f.latlng));
		return f;
	}
	
    //function to create symbols
    function createPropSymbols(info, data, currentPage, speed,isVCROrSlider) {
        //console.log(info)
        //console.log(data)
		

        if (map.hasLayer(markers)){
            map.removeLayer(markers);
        	};
			
		//if we are playing we should only show one at a time;
	    if(isVCROrSlider) {
		 	$("#dvAllMyZooms").empty();
		}
		
		//For bounding later
		var arrCoord = [];
		
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
				if ($.inArray(CleanFName(feature.properties.SM),SMFilter) != -1) {  
                   return true;
            } else {
					return false;
				};
			}
        },
        //opacity of markers, transition time for black circle to appear
		pointToLayer: function(feature, latlng) {
				arrCoord.push([latlng.lat,latlng.lng]);
			    //To keep the map program happy - not visible
				var circle = L.circle(latlng, 200,{
                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
					stroke: false,
                    weight: 2,
                    clickable: true,
				    fillOpacity: 0.0,
					opacity: 0.0
                });
			
				var e = map.latLngToContainerPoint(latlng);
				e.latlng = latlng;
				var fName = CleanFName(feature.properties.SM)
				var createZoom = function(e) { 
						//generate id instance
						var idZ = "zoomlens" + iZoomNum;
						var idO = "olay" + iZoomNum;
						var idM = "zoommap" + iZoomNum++;
						
						//append html
						$("#dvAllMyZooms").append("<div id='"+idZ+"' class='zoomlens "+fName+" overlay'><div id='"+idO+"' class='overlay rotater'><div class='overlay rotater'><div id='"+idM+"' class='zoommap overlay'></div></div></div><div id='border' class='overlay'></div></div>");
		
						//grab on page object
						var oZlens = document.getElementById(idZ);
						
						//Boiler Plate Setup
						var zmap = L.mapbox.map(idM, 'joshua-armstrong.lgha7h01', {
							opacity: 1.0,
							attributionControl: false,

						}).setView([48.874, 2.358], 15);
						map.dragging.disable();
						map.touchZoom.disable();
						map.doubleClickZoom.disable();
						map.scrollWheelZoom.disable();

						
						zoomIt = function(e) {
							if (zmap._loaded) zmap.setZoom(map.getZoom(15));
						};


						updateLens = function(e) {
							oZlens.style.top = (e.y )  + 'px';
							oZlens.style.left = (e.x ) + 'px';
							zmap.setView(e.latlng, map.getZoom(15), true);
						};
						
						map.on("zoomend",function (){ 
							updateLens(e)
							zoomIt(e);	
						})
						
						map.on("dragend",function (){ 
							updateLens(e)
							zoomIt(e);	
						})
						
						//Create Lens
						updateLens(e)
						zoomIt(e);	
					};
					
			createZoom(e);	
			return circle;
				
		
				
			}
		}).addTo(map);
		updatePropSymbols();
		
	} 	// end createPropSymbols()


	//color of markers
    function PropColor(SM) {
        return "#CC2B0A";
    }

    //marker size, popup
    function updatePropSymbols() {

		markers.eachLayer(function(layer) {
			console.log(layer);
			
		});
	} // end updatePropSymbols


    //create the page timeline, chronological order of events
	function createSliderUI(Pages, info, data) {

		
		var slider = $("#mySlider");
					$(slider).attr({'type':'range', 
                       'max': Pages[Pages.length-1], 
                       'min':Pages[0], 
                       'step': 1,
					   'width' : 4,
                       'value': String(Pages[0])});
					   
			$(slider).css("width","500px")
					   
			$(slider).on('input change', function(e) {
					//text for slider bar
		            $(".temporal-legend").text("on page " + this.value);
		        });	 
				
			$(slider).on('change', function(e) {
				    createPropSymbols(info, data, this.value,null,true);
					//text for slider bar
		            $("#temporalLegend").text("on page " + this.value);
		        });	 
		
		
		
		createTemporalLegend(Pages [0]);
	} 

    //add page number demonstration 

	function createTemporalLegend(startTimestamp, speed) {
		var temporalLegend = L.control(
			//position to bottom right
			{ position: 'bottomright' });
		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create("output", "temporalLegend");
			return output;
		}
		temporalLegend.addTo(map);
		$("#temporalLegend").text("on page " + startTimestamp);
	}	// end createTemporalLegend()
});
//end code


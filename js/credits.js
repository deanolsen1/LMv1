//Javascript for Credits page

 function SizeMe(map) {
	//Dynamically Resize Body
	$("body").height($(window).outerHeight()-40);
	$("body").width($(window).outerWidth());
	
	var iBodyWidth = $("body").width();
	var iBodyHeight = $("body").height();
	var iMenuOffset = 38;
	var iSubMenuOffset = 151;
	var iVCRHeight = 49;
	var iVCROffset = 30;
	
	$("#map").height($("body").height() - $("#map").offset().top);
	$("#menu").height($("#map").height() - iMenuOffset);
	$("#vcr-controls").css("top",($("#map").offset().top + $("#map").height()- iVCRHeight -iVCROffset) + "px")
	$("#SubjectiveMarkers").height($("#menu").height() - iSubMenuOffset);
	map.invalidateSize();
};


$(document).ready(function() {
	$('img').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 500);
});

 $(document).ready(function() {
 	$('h1').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 500);
 });

 $(document).ready(function() {
 	$('h2').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 500);
 });
$(document).ready(function() {
 	$('body p').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 500);
 });
$(document).ready(function() {
 	$('.nav').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 500);
 });

// accordion function on credits

function openFirstPanel(){
  $('.accordion > dd:first-child').next().addClass('active').slideDown();
}

(function($) {
  var allPanels = $('.accordion > dd').hide();
  
  openFirstPanel();
	$('.accordion > dt > a').click(function() {
      	$this = $(this);
      	$target =  $this.parent().next();
    
      if($target.hasClass('active')){
        $target.removeClass('active').slideUp(); 

      } else {
        allPanels.removeClass('active').slideUp();
        $target.addClass('active').slideDown();
      }
    return false;
  });

})(jQuery);

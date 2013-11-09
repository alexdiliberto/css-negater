var target = 0;

// Re-present the list of negated URLs to the user.
$(function() {
	var sources = [];
	if (/previous=([^&]*)/.test(document.cookie)) {
		sources = document.cookie.match(/previous=([^&]*)/)[1].split('~~~');
	}
	for (var i = 0; i < sources.length; i++) {
		$('<iframe src="'+unescape(sources[i])+'&exclude=1"></iframe>').appendTo('#iframe-target');
	}
});

$('#parse').on('submit', function(e) {
  var $this = $(this);
  var url = $('#url').val();
  target++;
  this.target = "output"+target;
  $('<iframe id="output'+target+'" name="output'+target+'"></iframe>').prependTo('#iframe-target');
  var options = $('input[type=checkbox]');
  var optionsArray = new Array(options.length);
  options.each(function(index, checkbox) {
    optionsArray[index] = +checkbox.checked;
  });
  $('#options').val(parseInt(optionsArray.join(""), 2));
});

// TODO: Create a bookmarklet that will allow you to embed the negation CSS?

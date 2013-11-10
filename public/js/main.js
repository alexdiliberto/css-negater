var target = 0;

// Re-present the list of negated URLs to the user.
$(function() {
	var sources = [];
	if (/previous=([^&]*)/.test(document.cookie)) {
		sources = document.cookie.match(/previous=([^&]*)/)[1].split('~~~');
	}
	for (var i = 0; i < sources.length; i++) {
    // TODO: Add clear button.
    // TODO: Add delete button.
		$('<div class="result"><iframe scrolling="no" src="'+unescape(sources[i])+'&exclude=1"></iframe></div>').appendTo('#iframe-target');
	}
});

$('#parse').on('submit', function(e) {
  var $this = $(this);
  var url = $('#url').val();
  target++;
  this.target = "output"+target;
  // TODO: Add clear button.
  // TODO: Add delete button.
  $('<div class="result"><iframe scrolling="no" id="output'+target+'" name="output'+target+'"></iframe></div>').prependTo('#iframe-target');
  var options = $('input[type=checkbox]');
  var optionsArray = new Array(options.length);
  options.each(function(index, checkbox) {
    optionsArray[index] = +checkbox.checked;
  });
  $('#options').val(parseInt(optionsArray.join(""), 2));

  // TODO: Scroll to iframe.
});

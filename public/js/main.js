var target = 0;

$(function() {
	var sources = [];
	if (/previous=([^&]*)/.test(document.cookie)) {
		sources = document.cookie.match(/previous=([^&]*)/)[1].split('~~~');
	}
	for (var i = 0; i < sources.length; i++) {
		$('<iframe src="'+unescape(sources[i])+'&exclude=1"></iframe>').appendTo('body');
	}
});

$('#parse').on('submit', function(e) {
  var $this = $(this);
  var url = $('#url').val();
  target++;
  this.target = "output"+target;
  // FIXME: invert the append order (prepend).
  $('<iframe id="output'+target+'" name="output'+target+'"></iframe>').appendTo('body');
  var options = $('input[type=checkbox]');
  var optionsArray = new Array(options.length);
  options.each(function(index, checkbox) {
    optionsArray[index] = +checkbox.checked;
  });
  $('#options').val(parseInt(optionsArray.join(""), 2));
});

// TODO: Store and provide a way to share the generated negation CSS?
// TODO: Create a bookmarklet that will allow you to embed the negation CSS?
// TODO: Capture the list of negated CSS URLs per user and re-present them to the user.
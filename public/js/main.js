$('#parse').on('submit', function(e) {
	// TODO: Trigger an analytics event.
	$this = $(this);
	$.get(this.action, $this.serialize()).done(function(response) {
		// TODO: Output this to the page in a textarea.
		console.log(response);
	});
	e.preventDefault();
});

// TODO: provide a one-click copy button for the textarea contents.

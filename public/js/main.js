$('#parse').on('submit', function(e) {
	// TODO: Trigger an analytics event.
	$this = $(this);
	$.get(this.action, $this.serialize()).done(function(response) {
		// TODO: Allow the user to queue up multiple textarea outputs.
		// TODO: Scroll to the top of the textarea once it has loaded.
		// TODO: provide a one-click copy button for the textarea contents.
		$('#output').val(response).show();
	});
	e.preventDefault();
});

// TODO: Provide a way to share the generated negation CSS?
// TODO: Create a bookmarklet that will allow you to embed the negation CSS?
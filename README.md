# Ember PDFJS Addon

This addon will add [PDFJS](https://mozilla.github.io/pdf.js/) to your `ember-cli` project.

## Installation

Within your `ember-cli` project:

* `ember install ember-pdfjs`

This will add a `pdf-document` component to your application that will dynamically render only 4 pages at a time as you scroll, and unload any other pages from the DOM.

## Usage

In a template, just do:

````
{{pdf-document src=[model.src]}}
````
or
````
{{pdf-document src="/path/to/your.pdf"}}
````

NOTE: you will get errors and it will not load if you try to link to something not hosted on your domain.

At the time of this writing, each page of the PDF will render, with the text layer created and tacked on after the `canvas` element.

## Caveats
This project is nascent, and needs your help! ;)

The goals of this project are spelled out in [Issues](https://github.com/mysterlune/ember-pdfjs/issues/2). If there are recommendations that you need for own project, likely they will benefit others.

Please contribute!

## Running Tests

* `ember test`

## Contributing
Fork and PR, please ;)
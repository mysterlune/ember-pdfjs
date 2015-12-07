# Ember PDFJS Addon

This addon will add [PDFJS](https://mozilla.github.io/pdf.js/) to your `ember-cli` project.

## Installation

Within your `ember-cli` project:

* `ember install ember-pdfjs`

This will add a `pdf-page` component to your application

## Usage

In a template, just do:

````
{{pdf-page src=[the location]}}
````

At the time of this writing, the first page of the PDF will render, with the text layer dumbly created and tacked on after the `canvas` element.

## Caveats
This project is nascent, and needs your help! ;)

The goals of this project are spelled out in [Issues](https://github.com/mysterlune/ember-pdfjs/issues/2). If there are recommendations that you need for own project, likely they will benefit others.

Please contribute!

## Running Tests

* `ember test`

## Contributing
Fork and PR, please ;)
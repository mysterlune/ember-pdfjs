# Ember PDFJS Addon

This addon will add [PDFJS](https://mozilla.github.io/pdf.js/) to your `ember-cli` project.

## Installation

Within your `ember-cli` project:

* `ember install ember-pdfjs`

This will add a `pdf-document` component to your application.

Scrolling causes new pages to render and old pages to expire from the DOM. Only 4 pages will be rendered at any given time. This results in quick load times of very large PDFs.

Each page that renders will first render a `canvas` with the PDF and then render a `$textLayer` div that overlays the `canvas` with selectable text.

Pages unload by doing `this.$().html('');` as they scroll out of view.


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


## Caveats
This project is nascent, and needs your help! ;)

The goals of this project are spelled out in [Issues](https://github.com/mysterlune/ember-pdfjs/issues/2). If there are recommendations that you need for own project, likely they will benefit others.

Please contribute!

## Running Tests

* `ember test`

## Contributing
Fork and PR, please ;)
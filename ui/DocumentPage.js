'use strict';

var Component = require('substance/ui/Component');
var JATSImporter = require('../converter/JATSImporter');
var JATSExporter = require('../converter/JATSExporter');
var jQuery = require('substance/util/jquery');
var DocumentSession = require('substance/model/DocumentSession');
var ScientistReader = require('./ScientistReader');
var ScientistWriter = require('./ScientistWriter');

/*
  Loads and displays a ScientistArticle

  Renders ScientistReader on mobile and ScientistWriter on the desktop
*/
function DocumentPage() {
  Component.apply(this, arguments);
}

DocumentPage.Prototype = function() {

  this.getInitialState = function() {
    return {
      documentSession: null,
      error: null
    };
  };

  this.didMount = function() {
    // load the document after mounting
    this._loadDocument(this.props.documentUrl);
  };

  this.willReceiveProps = function(newProps) {
    if (newProps.documentUrl !== this.props.documentUrl) {
      this.dispose();
      this.state = this.getInitialState();
      this._loadDocument(newProps.documentUrl);
    }
  };

  this._loadDocument = function() {
    jQuery.ajax(this.props.documentUrl, {
      dataType: 'text'
    })
    .done(function(data){
      var importer = new JATSImporter();
      var doc = importer.importDocument(data);
      var documentSession = new DocumentSession(doc);

      console.log('documentSession', documentSession);


      this.setState({
        documentSession: documentSession
      });
    }.bind(this))
    .fail(function(xhr, status, err) {
      console.error(err);
      this.setState({
        error: new Error('Loading failed')
      });
    }.bind(this));
  };

  // Rendering
  // ------------------------------------

  this.render = function($$) {
    var el = $$('div').addClass('sc-document-page');

    if (!this.state.documentSession) {
      return el;
    }

    if (this.state.error) {
      el.append('ERROR: ', this.state.error.message);
    }

    // Display reader for mobile and writer on desktop
    if (this.props.mobile) {
      el.append(
        $$(ScientistReader, {
          documentSession: this.state.documentSession
        }).ref('scientistReader')
      );
    } else {
      el.append(
        $$(ScientistWriter, {
          documentSession: this.state.documentSession,
          onSave: function(doc, changes, cb) {
            var exporter = new JATSExporter();
            var xml = exporter.exportDocument(doc);
            if (this.props.onSave) {
              this.props.onSave(xml);
            }
            cb(null);
          }.bind(this)
        }).ref('scientistWriter')
      );
    }
    return el;
  };
};

Component.extend(DocumentPage);
module.exports = DocumentPage;
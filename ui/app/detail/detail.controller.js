/* global vkbeautify */
(function () {

  'use strict';

  angular.module('app.detail')
    .controller('DetailCtrl', DetailCtrl);

  DetailCtrl.$inject = ['doc', '$stateParams', 'MLRest', 'ngToast',
                        '$state', '$scope', 'x2js'];

  // TODO: inject vkbeautify
  function DetailCtrl(doc, $stateParams, MLRest, toast, $state, $scope, x2js) {
    var ctrl = this;

    var uri = $stateParams.uri;

    var contentType = doc.headers('content-type').split(/;/)[0];
    var encodedUri = encodeURIComponent(uri);

    /* jscs: disable */
    if (contentType.lastIndexOf('application/json', 0) === 0) {
      /*jshint camelcase: false */
      ctrl.xml = vkbeautify.xml(x2js.json2xml_str(
          { xml: doc.data }
      ));
      ctrl.json = doc.data;
      ctrl.type = 'json';
    } else if (contentType.lastIndexOf('application/xml', 0) === 0) {
      ctrl.xml = vkbeautify.xml(doc.data);
      /*jshint camelcase: false */
      ctrl.json = x2js.xml_str2json(doc.data).xml;
      ctrl.type = 'xml';
      /* jscs: enable */
    } else if (contentType.lastIndexOf('text/plain', 0) === 0) {
      ctrl.xml = doc.data;
      ctrl.json = {'Document' : doc.data};
      ctrl.type = 'text';
    } else if (contentType.lastIndexOf('application', 0) === 0 ) {
      ctrl.xml = 'Binary object';
      ctrl.json = {'Document type' : 'Binary object'};
      ctrl.type = 'binary';
    } else {
      ctrl.xml = 'Error occured determining document type.';
      ctrl.json = {'Error' : 'Error occured determining document type.'};
    }

    function deleteDocument() {
      MLRest.deleteDocument(uri).then(function(response) {
        // TODO: not reached with code coverage yet!

        // create a toast with settings:
        toast.create({
          className: 'warning',
          content: 'Deleted ' + uri,
          dismissOnTimeout: true,
          timeout: 2000,
          onDismiss: function () {
            //redirect to search page
            $state.go('root.search');
          }
        });
      }, function(response) {
        toast.danger(response.data);
      });
    }

  //   var graphEvents = {
  //     oncontext: function(params) {
  //       var canvasLocation = document.getElementById('myGraph').getBoundingClientRect();
  //       var pointerDOM = params.pointer.DOM;

  //       var x = canvasLocation.x + pointerDOM.x;
  //       var y = canvasLocation.y + pointerDOM.y;
  //       var rightClickMenu = document.getElementById('rightclickmenu').style;

  //       rightClickMenu.top = y + 'px';
  //       rightClickMenu.left = x + 'px';
  //       rightClickMenu.position = 'absolute';
  //       rightClickMenu['z-index'] = 1;
  //       ctrl.clickedNode = params.nodes[0];

  //       var element = document.getElementById('rightclickmenu');
  //   if (window.CustomEvent) {
  //     var new_event = new params.event.constructor(params.event.type, params.event)
  //     element.dispatchEvent(new_event);
  //   } else if (document.createEvent) {
  //       var ev = document.createEvent('HTMLEvents');
  //       ev.initEvent('contextmenu', true, false);
  //       element.dispatchEvent(ev);
  //   } else { // Internet Explorer
  //       element.fireEvent('oncontextmenu');
  //   }

  //       $scope.$apply();


  //       return params.event.preventDefault();
  //     }

  //   };

  // $scope.menuOptions = [
  //     {
  //         text: 'Center here',
  //         click: function ($itemScope, $event, modelValue, text, $li) {
  //           console.log('Clicked node: ' + ctrl.clickedNode);
  //           console.log('Recenter the map.');
  //         }
  //     },
  //     {
  //         text: 'Find related files',
  //         click: function ($itemScope, $event, modelValue, text, $li) {
  //           console.log('Clicked node: ' + ctrl.clickedNode);
  //           console.log('Put your service call to the related files here and populate the submenu');
  //         }
  //     }
  //   ];


    angular.extend(ctrl, {
      doc : doc.data,
      uri : uri,
      contentType: contentType,
      fileName: uri.split('/').pop(),
      viewUri: '/v1/documents?uri=' + encodedUri + '&format=binary&transform=sanitize',
      downloadUri: '/v1/documents?uri=' + encodedUri + '&format=binary&transform=download',
      delete: deleteDocument
      // customEvents: graphEvents      
    });
  }
}());

/* global MLSearchController */
(function () {
  'use strict';

  angular.module('app.search')
    .controller('SearchCtrl', SearchCtrl);

  SearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory', '$http', '$q', '$window', 'MLRest'];

  // inherit from MLSearchController
  var superCtrl = MLSearchController.prototype;
  SearchCtrl.prototype = Object.create(superCtrl);

  function SearchCtrl($scope, $location, searchFactory, $http, $q, $window, $mlRest) {
    var ctrl = this;
    // ctrl.rmenu;
    ctrl.suggestions = new Array();
    ctrl.isGraph = false;

    ctrl.graphSearch = function search(ids) {
            return $http.get('/v1/resources/visjs?rs:subject=' + encodeURIComponent(ids[0]) + '&rs:show-instances=' + ctrl.showInstances)
            .then(
              function(response) {
                ctrl.showInstances = false;
                return response.data;
              },
              function(failure) {
                ctrl.showInstances = false;
                throw failure;
              }
            );
          };

    ctrl.graphEvents = {
          // onload: function(network) {
          //   ctrl.network = network;
          //  },
          oncontext: function(params) {
            var canvasLocation = document.getElementById('myGraph').getBoundingClientRect();
            var pointerDOM = params.pointer.DOM;

            var x = canvasLocation.x + pointerDOM.x;
            var y = canvasLocation.y + pointerDOM.y;
            var rightClickMenu = document.getElementById('rightclickmenu').style;

            rightClickMenu.top = y + 'px';
            rightClickMenu.left = x + 'px';
            rightClickMenu.position = 'absolute';
            rightClickMenu['z-index'] = 1;
            // ctrl.clickedNode = params.nodes[0];
            ctrl.clickedNode = ctrl.network.getNodeAt(pointerDOM);

            var element = document.getElementById('rightclickmenu');
            if (window.CustomEvent) {
              var new_event = new params.event.constructor(params.event.type, params.event)
              element.dispatchEvent(new_event);
            } else if (document.createEvent) {
                var ev = document.createEvent('HTMLEvents');
                ev.initEvent('contextmenu', true, false);
                element.dispatchEvent(ev);
            } else { // Internet Explorer
                element.fireEvent('oncontextmenu');
            }

            $mlRest.sparql(`
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              PREFIX ea: <http://lab.bah.com/ontologies/enterprisearchitecture/ea.owl#>
              SELECT DISTINCT ?label ?url where { 
              ?s <http://lab.bah.com/ontologies/enterprisearchitecture/ea.owl#relatedTo> <` + ctrl.clickedNode + `>;
               rdfs:label ?label ;
               ea:hasUrl ?url .

            }`).then(function(response) {
              response = response;
              let t = [];
              // response.data.results.bindings.map(r => 
              //     (
              //       t.push(
              //       [r.label.value, function() {
              //         return function() {$window.open(r.url.value, '_blank');}}])
              //     )
              // );
              ctrl.relatedResponse = response.data.results.bindings;

              response.data.results.bindings.map(r => 
                  (
                      t.push(
                        {
                          "text": r.label.value,
                          "click":  function() {
                            $window.open(r.url.value, '_blank'); }
                        }
                      )
                  )
              );

    // {
    //     text: 'Object-Select',
    //     click: function ($itemScope, $event, modelValue, text, $li) {
    //         $scope.selected = $itemScope.item.name;
    //     }
    // },

              console.log(t);
              ctrl.relatedDocs = t;
              console.log(ctrl.relatedDocs); 

            });

            $scope.$apply();

            return params.event.preventDefault();
          }

        };

      // ctrl.customEvents: graphEvents;
      ctrl.myList = [{"title":"a", "run": "ok"}, {"title":"b", "run": "not ok"}];
      ctrl.relatedDocs = [];
      $scope.menuOptions = [
          {
            "text": "Make Center Node",
            "click": function ($itemScope, $event, modelValue, text, $li) {
                console.log('Clicked node: ' + ctrl.clickedNode);
                console.log('Recenter the map.');
                ctrl.isGraph = true;
                ctrl.graphUris = [ctrl.clickedNode];
                return $q.when({});
              }
          }, 
          
          // {
          //   "text": function($itemScope, $event, modelValue, text, $li) {
          //     ctrl.relatedDocs.map(a => a.text);
          //   },
          //   "click": function($itemScope, $event, modelValue, text, $li) {
          //     ctrl.relatedDocs.map(a => a.click);
          //   }
          // },

// works
          // {
          //     "text": "ok",
          //     // "click": function() {alert ("hi")},
          //     "children": [
          //       {"text": "ok",
          //       "click": function() {alert ("hi")}},
          //       {"text": "ok",
          //       "click": function() {alert ("hi")}}
          //     ]
          // },
            
// doen'st work but seems like it should
            // {
            //     "text": "Related documents",
            //     "children": function() {

            //       ctrl.relatedResponse.map(r => 
            //         (
            //             {
            //               "text": r.label.value,
            //               "click":  function() {
            //                 // $window.open(r.url.value, '_blank'); }
            //                 r.url.value 
            //               }
            //             }
                      
            //         )
            //       ).toArray()

            //     }
                
            // },

            {
                "text": "Related documents",
                "children": [
                  {
                    "text": "Filesystem: Intake Business Area Extract",
                    "click": function() {$window.open("http://52.41.245.255:3000/v1/documents?uri=Intake_TransitionView_TechRoadmap.pdf", '_blank')}
                  },
                  {
                    "text": "Webservice link to github",
                    "click": function() {$window.open("https://github.com/marklogic/entity-services/blob/master/entity-services/src/main/xdmp/entity-services/entity-services.ttl", '_blank')}
                  },
                  {
                    "text": "Sharepoint: Intake Transition View Tech Roadmap",
                    "click": function() {$window.open("http://52.41.245.255:3000/v1/documents?uri=Intake_TransitionView_TechRoadmap.pdf", '_blank')}
                  }                                    

                ]
            },

// incomplete
            // {
            //     "text": "Related documents", 
            //     "children":

            // },

          // {
          //   "text": "Find Related Information",
          //   function ($itemScope, $event, modelValue, text, $li)
          //     ["1.doc", function() {
          //         return $http.get('http://localhost:3000/v1/resources/visjs?rs:subject=http%3A%2F%2Flab.bah.com%2Fontologies%2Fenterprisearchitecture%2Fea.owl%23ModernizedEFile&related=true')
          //         .then(
          //           function(response) {
          //             return console.log(response.data);
          //           }
          //         );
          //       }

          //     ],
          //     ["2.pdf", function() {$window.open("http://localhost:3000/v1/documents?uri=Intake_Business%20Area_Kbextract.pdf", '_blank');}]
          //     // function ($itemScope, $event, modelValue, text, $li) {
          //     //   console.log('Clicked node: ' + ctrl.clickedNode);
          //     //   console.log('Put your service call to the related files here and populate the submenu');
          //     //   console.log($itemScope);
          //     //   console.log(modelValue);
          //     //   console.log(text);
          //     //   console.log($li);

          //     // }
          // ]
          // },
           { 
              "text": "Show instances",
              "click": function ($itemScope, $event, modelValue, text, $li) {
                  console.log('Clicked node: ' + ctrl.clickedNode);
                  console.log('Recenter the map.');
                  ctrl.isGraph = true;
                  ctrl.showInstances = true;
                  ctrl.graphUris = [ctrl.clickedNode];
                  return $q.when({});
                }
            }
        ];

    // ctrl.graphEvents = {oncontext: function(params) {
    //     console.log("Hi...oncontext is working", params);
        
        
    //     // ctrl.rmenu = new BootstrapMenu('#demo1Box', {
    //     //   actions: [{
    //     //       name: 'Action',
    //     //       onClick: function() {
    //     //         toastr.info("'Action' clicked!");
    //     //       }
    //     //     }, {
    //     //       name: 'Another action',
    //     //       onClick: function() {
    //     //         toastr.info("'Another action' clicked!");
    //     //       }
    //     //     }, {
    //     //       name: 'A third action',
    //     //       onClick: function() {
    //     //         toastr.info("'A third action' clicked!");
    //     //       }
    //     //   }]
    //     // });

    //     var coordinates = params.pointer.DOM;
    //     var targetNode = $scope.network.getNodeAt(coordinates);
    //     console.log(targetNode);
    //     if (targetNode) {
    //       $location.path('/detail' + targetNode);
    //       $scope.$apply();
    //     }
    //     return params.event.preventDefault();

    //     }

    //   };

    superCtrl.constructor.call(ctrl, $scope, $location, searchFactory.newContext({
      pageLength: 12
    }));

    ctrl.getBinary = function(uri) {
      return uri.substring(0, uri.lastIndexOf("."));
    };

    ctrl.search = function() {

        var graphObj = ctrl.suggestions.filter(suggestion => ctrl.qtext === suggestion.label)[0];
        //ctrl.graphUris = graphObj.iri ? [graphObj.iri] : [];
        if (graphObj && graphObj.iri) {
          ctrl.graphUris = [graphObj.iri];
        } else ctrl.graphUris = [] ;

        if (ctrl.suggestions.length && ctrl.graphUris) {
          //do a sparql q to get the related concepts
          //return a promise q.when
          ctrl.isGraph = true;
          return $q.when({});
        } else { // I'm hoping this returns the original search results/view
            ctrl.isGraph = false;
            ctrl.suggestions = [];
            ctrl.graphUris = [];
            return superCtrl.search.apply(ctrl, arguments);
        }
    };

    ctrl.suggestAdvanced = function(qtext) {
      // return searchService.suggest(qtext);
        return $http.get('/v1/resources/suggestAdvanced', {params: {'rs:qtext': qtext }}).then(
          function(response) {
            var results = response.data.suggestions;
            // if (results && results.length) {
            //   results.unshift(qtext);
            // }
            ctrl.suggestions = results;
            return results.map(suggestion => suggestion.label);
          }
        );   
    };

    ctrl.init();

    ctrl.setSnippet = function(type) {
      ctrl.mlSearch.setSnippet(type);
      ctrl.search();
    };

  }
}());

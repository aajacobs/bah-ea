xquery version "1.0-ml";

module namespace resource = "http://marklogic.com/rest-api/resource/visjs";

import module namespace kl = "http://leis.irad/visjs" at "/ext/mlpm_modules/visjs-graph/visjs-lib.xqy";

import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace sem = "http://marklogic.com/semantics" at "/MarkLogic/semantics.xqy";

declare namespace rapi = "http://marklogic.com/rest-api";

declare function resource:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  let $subject := map:get($params, "subject")
  let $expand := map:get($params, "expand") = "true"
  let $showInstances := map:get($params, "show-instances") = "true"
  let $relatedFiles := fn:head((map:get($params, "related"), fn:false()))
  return
    if ($relatedFiles) then
      kl:get-related($subject)
    else
      kl:build-graph($subject, $expand, $showInstances)
};



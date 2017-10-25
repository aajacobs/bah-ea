
(: REST transform for document-filtering binaries at ingest. :)

xquery version "1.0-ml";
module namespace trans = "http://marklogic.com/rest-api/transform/extract-text";

declare namespace html = "http://www.w3.org/1999/xhtml";

declare function trans:transform(
  $context as map:map,
  $params as map:map,
  $content as document-node()
) as document-node()
{
  let $uri := map:get($context, "uri")
  let $filter := xdmp:document-filter($content)
  let $metadata :=
      for $meta in $filter//html:meta
      return
        element { $meta/@name } {
          data($meta/@content)
        }
  let $doc :=
    element doc {
      element metadata {
        $metadata
      },
      element content {
        $filter//*:body
      }
    }
  let $_ := xdmp:document-insert($uri || ".xml", $doc,
      <options xmlns="xdmp:document-insert">  
      <collections>
        <collection>ea</collection>
        <collection>data</collection>
      </collections>
      </options>)
  return $content

};
xquery version "1.0-ml";
module namespace bah = "http://marklogic.com/bah";
declare namespace html = "http://www.w3.org/1999/xhtml";

declare function bah:transform(
 $content as map:map,
 $context as map:map
 ) as map:map*
{

  let $uri := map:get($content, "uri")
  let $filter := xdmp:document-filter(map:get($content, "value"))
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

(: return (
   map:put($content, "value",
     document {
       $root/preceding-sibling::node(),
       element {fn:name($root)} {
         attribute { fn:QName("", "NEWATTR") } {$attr-value},
         $root/@*,
         $root/node()
         },
         $root/following-sibling::node()
       }
       ), $content
   ):)
};
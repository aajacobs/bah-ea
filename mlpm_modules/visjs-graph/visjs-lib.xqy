xquery version "1.0-ml";

module namespace visjs = "http://leis.irad/visjs";


declare option xdmp:mapping "false";


declare function visjs:get-instances($type) {

  sem:sparql(
        concat("
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX bah: <http://lab.bah.com/ontologies/enterprisearchitecture/ea.owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

              select ?label $uri where {
              ?uri a ?type ; 
              rdfs:label ?label .
            }
        "),
        map:new((
          map:entry("type", sem:iri($type))
        ))
      )
};

declare function visjs:get-related($subject)
{
  sem:sparql(
        concat("
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          SELECT DISTINCT ?label where { 
            ?s <http://lab.bah.com/ontologies/enterprisearchitecture/ea.owl#relatedTo> ?o
            ;
               rdfs:label ?label .
          }
        "),
        map:new((
          map:entry("o", sem:iri($subject))
        ))
      )
};

declare function visjs:build-graph(
  $subjects,
  $is-expand as xs:boolean,
  $show-instances as xs:boolean
  )
{
  let $subject-iris := $subjects ! sem:iri(.)
  
  (:
  if (subject-iris eq class) then 
  {   {
          ?s ?p ?subject
        }
  }
  :)
  let $edge-triples := sem:sparql(
    concat("
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT DISTINCT
        ?subject
        (COALESCE(?predicateLabel, ?predicateUri) AS ?predicate)
        ?predicateUri
        ?object
      WHERE {
        {
          ?subject ?predicateUri ?object .
          FILTER( ?subject = ?subjects )
        } UNION {
          ?subject ?predicateUri ?object
          FILTER( ?object = ?revSubjects )
        }
        {
          ?s ?p ?subject
        }
        OPTIONAL {
          ?predicateUri rdfs:label ?predicateLabel .
        }
        ", visjs:sparql-filter($show-instances), "
        FILTER( isUri( ?object ) )
      }
    "),
    map:new((
      map:entry("subjects", $subject-iris),
      map:entry("revSubjects", $subject-iris)
    ))
  )
  let $node-uris := distinct-values((
    $edge-triples ! map:get(., "subject"),
    $edge-triples ! map:get(., "object")
  ))

  let $nodes := json:to-array(
    for $node-uri in $node-uris
    let $node-data := sem:sparql(
      concat("
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT DISTINCT
          (COALESCE(?subjectLabel, ?subject) AS ?label)
          (COALESCE(?subjectType, 'unknown') AS ?type)
        WHERE {
          {
            ?subject ?predicateUri [] .
          }
          OPTIONAL {
            ?subject rdfs:label ?subjectLabel .
          }
          OPTIONAL {
            ?subject rdf:type ?subjectType .
          }
        }
      "),
      map:new((
        map:entry("subject", sem:iri($node-uri))
      ))
    )
    let $_ := xdmp:log("node-uri")
    let $_ := xdmp:log($node-uri)
    let $_ := xdmp:log("NODE_DaTA")
    let $_ := xdmp:log($node-data)
    where (($node-uri ne "http://www.w3.org/2002/07/owl#Class" and $node-uri ne "http://www.w3.org/2002/07/owl#Thing"))
    
    return xdmp:to-json(map:new((
      map:entry("id", $node-uri),
      map:entry("label", fn:head((map:get($node-data[1], "label"), $node-uri))),
      map:entry("group", fn:head((map:get($node-data[1], "type"), $node-uri))),
      map:entry("edgeCount", visjs:get-edge-count($node-uri))
    )))
  )

  let $_ := xdmp:log($nodes)

  let $edges := json:to-array(
    for $edge-data in $edge-triples
    let $id := "edge-" || map:get($edge-data, "subject") || "-" || map:get($edge-data, "object")
    let $label := xdmp:url-decode(tokenize(
      map:get($edge-data, "predicate"),
      "[/#]"
    )[last()])
    return xdmp:to-json(map:new((
      map:entry("id", $id),
      map:entry("from", map:get($edge-data, "subject")),
      map:entry("to", map:get($edge-data, "object")),
      map:entry("label", $label),
      map:entry("type", map:get($edge-data, "predicateUri"))
    )))
  )

  return
    document {
      xdmp:to-json(
        map:new((
          map:entry("nodes", $nodes),
          map:entry("edges", $edges)
        ))
      )
    }

};

declare function visjs:get-types($subjects as xs:string*) as node()*
{
  <x>{cts:triples($subjects ! sem:iri(.), sem:iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"))}</x>/*
};

declare private function visjs:retrieve-type(
  $types as node()*,
  $uri as xs:string
) as xs:string?
{
  ($types[sem:subject = $uri]/sem:object/string(), "unknown")[1]
};

declare private function visjs:get-label($subject as xs:string) as xs:string
{
  let $tokens := tokenize($subject, "/")
  return
    if (count($tokens) = 1) then $subject
    else $tokens[last() - 1] || "/" || $tokens[last()]
};

declare private function visjs:sparql-filter() as xs:string
{
  visjs:sparql-filter(false())
};

declare private function visjs:sparql-filter(
  $show-instances as xs:boolean
) as xs:string
{
  if ($show-instances) then
    " FILTER( ?predicateUri = rdf:type ) "
  else
    " FILTER( !( ?predicateUri = (rdfs:label, rdf:type) ) ) "
};

declare private function visjs:get-edge-count($subject) as xs:int
{

  let $params := map:new( map:entry("subject", sem:iri($subject)) )
  let $q := fn:concat(
    "
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT (COUNT(DISTINCT ?object) AS ?count)
    WHERE {
      {
        ?subject ?predicateUri ?object . ",
    visjs:sparql-filter(),
    "
      }
      UNION
      {
        ?object ?predicateUri ?subject .",
        visjs:sparql-filter(),
      "}
      FILTER( ?subject != ?object)
    }
    ")
  
  let $count := 
      map:get(sem:sparql($q, $params), "count")

  return $count
};

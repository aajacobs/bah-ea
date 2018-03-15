
function get(context, params) {
  context.outputTypes = ["application/json"];
  context.outputStatus = [200, 'Ok'];
  
  let qtext = params.qtext;

  const q = 
  `
  PREFIX cts: <http://marklogic.com/cts#>

  select ?instanceLabel ?classLabel ?instance where { 
      ?class <http://www.w3.org/2000/01/rdf-schema#subClassOf>  <http://www.w3.org/2002/07/owl#Thing> . 
      ?instance a ?class . 
      ?class <http://www.w3.org/2000/01/rdf-schema#label> ?classLabel . 
      ?instance <http://www.w3.org/2000/01/rdf-schema#label> ?instanceLabel .
      FILTER (
        cts:contains(?instanceLabel, cts:word-query(lcase("*${qtext}*"))) ||
        cts:contains(?classLabel, cts:word-query(lcase("*${qtext}*")))
      )
    }
  `;

  let eaPrefix = "http://lab.bah.com/ontologies/enterprisearchitecture/ea.owl#";
  let suggestions = [];
  let sparqlResults = sem.sparql(q).toArray();
  sparqlResults.map(obj => {
      
    suggestions.push(
      {
        "label": obj.classLabel + ":" +  obj.instanceLabel,
        "iri": obj.instance
      }
    );
    
    if (!suggestions.map(l => l.label).includes(obj.classLabel)) {
        suggestions.push({
          "label": obj.classLabel,
          "iri": eaPrefix + obj.classLabel
        });
      }
  });

  return {"suggestions": suggestions};
};

exports.GET = get;
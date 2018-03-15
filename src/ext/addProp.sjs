function addProp(content, context)
{
   const propVal = (context.transform_param == undefined)
   ? "UNDEFINED" : context.transform_param;
   if (xdmp.nodeKind(content.value) == 'document' &&
     content.value.documentFormat == 'JSON') {
   // Convert input to mutable object and add new property
   const newDoc = content.value.toObject();
   newDoc.NEWPROP = propVal;
   // Convert result back into a document
   content.value = xdmp.unquote(xdmp.quote(newDoc));
  }
  return content;

};

exports.addProp = addProp;
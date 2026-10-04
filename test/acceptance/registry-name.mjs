// Public unauthenticated query: no npm login, token, or account mutation.
const response=await fetch('https://registry.npmjs.org/redue',{
  signal:AbortSignal.timeout(20000),headers:{accept:'application/json'}});
if(response.status===404){
  console.log('Exact public npm redue: HTTP 404; no published package observed. This does not reserve the name or establish publishing rights.');
}else if(response.ok){
  const value=await response.json();
  console.log(JSON.stringify({registry:'https://registry.npmjs.org/redue',http:response.status,
    name:value.name,description:value.description,repository:value.repository,
    latest:value['dist-tags']?.latest}));
  throw Error('Exact npm package exists; review ownership/collision before publication.');
}else throw Error(`Exact registry check unresolved: HTTP ${response.status}`);

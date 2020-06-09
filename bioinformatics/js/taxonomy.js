///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_standard_taxonomy(genus, species) {
  return new Promise(function(resolve, reject) {
    if (typeof(genus) === "undefined" || typeof(species) == "undefined") { return { }; }
    let api_address = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
    let terms       = "db=taxonomy";
    terms += "&term=" + genus + "+" + species;
    terms += "&retmax=100000&retmode=json";
    terms += "&api_key=" + api_key.NCBI;
    API_POST(terms, api_address, update_taxonomy_1, false);
    ///////////////////////////////////////////////////////////////////////////
    // METHOD /////////////////////////////////////////////////////////////////
    function update_taxonomy_1(json) {
      if (typeof(json) == 'undefined') { return; }
      let obj = JSON.parse(json);
      if (typeof(obj.esearchresult.idlist[0]) == "undefined") { hideSpinner(); return; }
      uid = obj.esearchresult.idlist[0];
      let api_address = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
      let terms       = "db=taxonomy";
      terms += "&id=" + uid;
      terms += "&retmax=100000&retmode=json";
      terms += "&api_key=" + api_key.NCBI;
      API_POST(terms, api_address, update_taxonomy_2, false);
    } // end function
    ///////////////////////////////////////////////////////////////////////////
    // METHOD /////////////////////////////////////////////////////////////////
    function update_taxonomy_2(json) {
      if (typeof(json) == 'undefined') { return; }
      let obj = JSON.parse(json);
      if (typeof(obj.result.uids[0]) == "undefined") { hideSpinner(); return; }
      let uid = obj.result.uids[0];
      let taxid = obj.result[uid].taxid;
      let api_address = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
      let terms       = "db=taxonomy";
      terms += "&id=" + taxid;
      terms += "&api_key=" + api_key.NCBI;
      API_POST(terms, api_address, update_taxonomy_3, false);
    } // end function
    ///////////////////////////////////////////////////////////////////////////
    // METHOD /////////////////////////////////////////////////////////////////
    function update_taxonomy_3(xml) {
      if (typeof(xml) == 'undefined') { return; }
      hideSpinner();
      let obj = parseXml(xml);
      if (typeof(obj.TaxaSet[1].Taxon.LineageEx.Taxon) == "undefined") { return; }
      let NCBI_taxonomy = obj.TaxaSet[1].Taxon.LineageEx.Taxon;
      NCBI_taxonomy = taxonomy_completion(NCBI_taxonomy);
      const taxonomy = {
        kingdom: "",
        phylum: "",
        class: "",
        order: "",
        family: "",
        genus: "",
        species: ""
      }; // end object
      for (let i = 0; i < NCBI_taxonomy.length; i++) {
        if (NCBI_taxonomy[i].Rank["#text"] == "kingdom") { taxonomy.kingdom = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "phylum" ) { taxonomy.phylum  = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "class"  ) { taxonomy.class   = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "order"  ) { taxonomy.order   = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "family" ) { taxonomy.family  = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "genus"  ) { taxonomy.genus   = NCBI_taxonomy[i].ScientificName["#text"]; }
        if (NCBI_taxonomy[i].Rank["#text"] == "species") { taxonomy.species = NCBI_taxonomy[i].ScientificName["#text"]; }
      } // end for loop
      resolve(taxonomy);
    } // end function
    ///////////////////////////////////////////////////////////////////////////
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function taxonomy_completion(taxonomy) {
  for (let index = 0; index < taxonomy.length; index++) {
    if ((taxonomy[index].Rank['#text'] == "order") && (taxonomy[index].ScientificName['#text'] == "Testudines")) {
      let taxa = { "Rank": { "#text": "class" }, "ScientificName": { "#text": "Reptilia" } };
      taxonomy.push(taxa);
    } // end if
  } // end for loop
  return taxonomy;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function taxonomy_resolution(name, rank) {
  rank = rank.toLowerCase();
  switch(rank) {
    case 'kingdom': {
      if (name == 'Metazoa'       ) { name = 'Animalia'; }
      if (name == 'Viridiplantae' ) { name = 'Plantae';  }
      if (name == 'Chlorobionta'  ) { name = 'Plantae';  }
      if (name == 'Chlorobiota'   ) { name = 'Plantae';  }
      if (name == 'Chloroplastida') { name = 'Plantae';  }
      if (name == 'Phyta'         ) { name = 'Plantae';  }
      if (name == 'Cormophyta'    ) { name = 'Plantae';  }
      if (name == 'Cormobionta'   ) { name = 'Plantae';  }
      if (name == 'Euplanta'      ) { name = 'Plantae';  }
      if (name == 'Telomobionta'  ) { name = 'Plantae';  }
      if (name == 'Embryobionta'  ) { name = 'Plantae';  }
      if (name == 'Metaphyta'     ) { name = 'Plantae';  }
      break;
    } // end case
    case 'phylum': {
      if (name == 'Streptophyta') { name = 'Pinophyta'; }
      break;
    } // end case
    case 'class': {
      if (name == 'Actinopteri') { name = 'Actinopterygii'; }
      break;
    } // end case
    case 'order': {
      if (name == 'Perciformes') { name = 'Scorpaeniformes'; }
    } // end case
    case 'family': {
      if (name == 'Sebastidae') { name = 'Scorpaenidae'; }
      break;
    } // end case
    case 'genus': { break; }
    case 'species': { break; }
  } // end switch
  return name;
} // end function
///////////////////////////////////////////////////////////////////////////////

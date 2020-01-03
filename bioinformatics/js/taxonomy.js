///////////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////

function taxonomy_completion(taxonomy) {

    for (let index = 0; index < taxonomy.length; index++) {

        if ((taxonomy[index].Rank['#text'] == "order") && (taxonomy[index].ScientificName['#text'] == "Testudines")) {

            let taxa = { "Rank": { "#text": "class" }, "ScientificName": { "#text": "Reptilia" } };
            taxonomy.push(taxa);

        } // end if

    } // end for loop

    return taxonomy;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

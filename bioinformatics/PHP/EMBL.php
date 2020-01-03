<?php

///////////////////////////////////////////////////////////////////////////////////////////////////

function initialize_EMBL() {

    $EMBL = array();
    $EMBL['identification']['primary_accession_number'] = '';
    $EMBL['identification']['sequence_version_number'] = '';
    $EMBL['identification']['topology'] = '';
    $EMBL['identification']['molecule_type'] = '';
    $EMBL['identification']['data_class'] = decode_Data_Class('STD');
    $EMBL['identification']['taxonomic_division'] = decode_Taxonomic_Division('UNC');
    $EMBL['identification']['sequence_length'] = '';
    $EMBL['accession_number'] = array();
    $EMBL['project_identifier'] = '';
    $EMBL['date_created'] = '';
    $EMBL['date_updated'] = '';
    $EMBL['description'] = '';
    $EMBL['keywords'] = '';
    $EMBL['organism_species'] = '';
    $EMBL['organism_classification'] = '';
    $EMBL['organelle'] = '';
    $EMBL['reference'] = array();
    $EMBL['database_cross-reference']['database_identifier'] = '';
    $EMBL['database_cross-reference']['primary_identifier'] = '';
    $EMBL['database_cross-reference']['secondary_identifier'] = '';
    $EMBL['comments'] = '';
    $EMBL['assembly_header'] = '';
    $EMBL['contig'] = '';
    $EMBL['feature_table_header'] = '';
    $EMBL['feature_table'] = '';
    $EMBL['sequence_header']['length'] = '';
    $EMBL['sequence_header']['A'] = '';
    $EMBL['sequence_header']['C'] = '';
    $EMBL['sequence_header']['G'] = '';
    $EMBL['sequence_header']['T'] = '';
    $EMBL['sequence_header']['other'] = '';
    $EMBL['sequence'] = '';

    return $EMBL;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function decode_Data_Class($data_class) {

    $dc = array(
        "CON" => "Entry constructed from segment entry sequences; if unannotated, annotation may be drawn from segment entries",
        "PAT" => "Patent",
        "EST" => "Expressed Sequence Tag",
        "GSS" => "Genome Survey Sequence",
        "HTC" => "High Thoughput CDNA sequencing",
        "HTG" => "High Thoughput Genome sequencing",
        "WGS" => "Whole Genome Shotgun",
        "TSA" => "Transcriptome Shotgun Assembly",
        "STS" => "Sequence Tagged Site",
        "STD" => "Standard"
    ); // end array

    return $dc[$data_class];

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function decode_Taxonomic_Division($taxonomic_division) {

    $td = array(
        "PHG" => "Bacteriophage",
        "ENV" => "Environmental Sample",
        "FUN" => "Fungal",
        "HUM" => "Human",
        "INV" => "Invertebrate",
        "MAM" => "Other Mammal",
        "VRT" => "Other Vertebrate",
        "MUS" => "Mus musculus",
        "PLN" => "Plant",
        "PRO" => "Prokaryote",
        "ROD" => "Other Rodent",
        "SYN" => "Synthetic",
        "TGN" => "Transgenic",
        "UNC" => "Unclassified",
        "VRL" => "Viral"
    ); // end array

    return $td[$taxonomic_division];

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function open_EMBL($filename) {

    // local variables
    $handle             =   NULL;       // [NOT EDITABLE | AUTOUPDATE] the EMBL file handle
    $EMBL               =   array();    // [NOT EDITABLE | AUTOUPDATE] the EMBL data structure array
    $line               =   '';         // [NOT EDITABLE | AUTOUPDATE] an entire line of the EMBL file
    $code               =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the EMBL file line
    $previousCode       =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the previous line
    $entry              =   0;          // [NOT EDITABLE | AUTOUPDATE] the entry number
    $substring          =   NULL;       // [NOT EDITABLE | AUTOUPDATE] an array of substrings
    $reference_number   =   '';         // [NOT EDITABLE | AUTOUPDATE] the current reference number
    $featureKey         =   '';         // [NOT EDITABLE | AUTOUPDATE] the current feature key
    $previousFeatureKey =   '';         // [NOT EDITABLE | AUTOUPDATE] the previous feature key
    $location           =   '';         // [NOT EDITABLE | AUTOUPDATE] the feature location / description

    // file-specific arrays
    $data_class         =   array("PAT", "EST", "GSS", "HTC", "HTG", "WGS", "TSA", "STS", "STD");
    $taxonomic_division =   array("PHG", "ENV", "FUN", "HUM", "INV", "MAM", "VRT", "MUS", "PLN", "PRO", "ROD", "SYN", "TGN", "UNC", "VRL");

    // open the file
    $handle = fopen($filename, "r") or die("Unable to open file!");

    while(!feof($handle)) {

        $previousCode = $code;
        $line  = fgets($handle);
        $code  = substr($line, 0, 2);  if ($code == '  ') { $code = $previousCode; } if ($code == '') { break; }
        $line  = substr($line, 5);
        if ($code !== 'FT') { $line  = preg_replace('/\s+/', ' ', trim($line)); }

        switch($code) {

            case 'XX': { $previousCode = ''; break; }
            case '//': { $previousCode = ''; $entry++; break; }
            case 'ID': {
                $EMBL[$entry]['identification']['primary_accession_number'] = '';
                $EMBL[$entry]['identification']['sequence_version_number'] = '';
                $EMBL[$entry]['identification']['topology'] = '';
                $EMBL[$entry]['identification']['molecule_type'] = '';
                $EMBL[$entry]['identification']['data_class'] = decode_Data_Class('STD');
                $EMBL[$entry]['identification']['taxonomic_division'] = decode_Taxonomic_Division('UNC');
                $EMBL[$entry]['identification']['sequence_length'] = '';
                $substring = explode(';', $line);
                $EMBL[$entry]['identification']['primary_accession_number'] = $substring[0];
                if (strpos(end($substring), "BP") !== FALSE) { $EMBL[$entry]['identification']['sequence_length'] = ltrim(rtrim(end($substring), '.'), ' '); }
                foreach($substring as $key => $value) {
                    $value = ltrim($value);
                    if(strpos($value, "SV") === 0) { $EMBL[$entry]['identification']['sequence_version_number'] = $value; }
                    if (($value == "circular") || ($value == "linear")) { $EMBL[$entry]['identification']['topology'] = $value; }
                    if ((strpos($value, 'DNA') !== FALSE) || (strpos($value, 'RNA') !== false)) { $EMBL[$entry]['identification']['molecule_type'] = $value; }
                    foreach ($data_class as $dc) { if ($value == $dc) { $EMBL[$entry]['identification']['data_class'] = decode_Data_Class($dc); } }
                    foreach ($taxonomic_division as $td) { if ($value == $td) { $EMBL[$entry]['identification']['taxonomic_division'] = decode_Taxonomic_Division($td); } }
                } // end foreach
                break;
            } // end case

            case 'AC': {
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                foreach($substring as $key => $value) { if($value !== '') { $EMBL[$entry]['accession_number'][$key] = $value; } }
                break;
            } // end case

            case 'PR': {
                $EMBL[$entry]['project_identifier'] = rtrim($line, ';');
                break;
            } // end case

            case 'DT': {

                if ($code == $previousCode) { $EMBL[$entry]['date_updated'] = $line; }
                else { $EMBL[$entry]['date_created'] = $line; }
                break;
            } // end case

            case 'DE': {
                if ($code == $previousCode) { $EMBL[$entry]['description'] = $EMBL[$entry]['description'].' '.$line; }
                else { $EMBL[$entry]['description'] = $line; }
                break;
            } // end case

            case 'KW': {
                if ($code == $previousCode) { $EMBL[$entry]['keywords'] = $EMBL[$entry]['keywords'].' '.$line; }
                else { $EMBL[$entry]['keywords'] = $line; }
                break;
            } // end case

            case 'OS': {
                if ($code == $previousCode) { $EMBL[$entry]['organism_species'] = $EMBL[$entry]['organism_species'].' '.$line; }
                else { $EMBL[$entry]['organism_species'] = $line; }
                break;
            } // end case

            case 'OC': {
                if ($code == $previousCode) { $EMBL[$entry]['organism_classification'] = $EMBL[$entry]['organism_classification'].' '.$line; }
                else { $EMBL[$entry]['organism_classification'] = $line; }
                break;
            } // end case

            case 'OG': {
                $EMBL[$entry]['organelle'] = $line;
                break;
            } // end case

            case 'RN': {
                $line = rtrim($line, ']');
                $line = ltrim($line, '[');
                $reference_number = $line;
                break;
            } // end case

            case 'RC': {
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['comment'] = $EMBL[$entry]['reference'][$reference_number]['comment'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['comment'] = $line; }
                break;
            } // end case

            case 'RP': {
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['positions'] = $EMBL[$entry]['reference'][$reference_number]['positions'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['positions'] = $line; }
                break;
            } // end case

            case 'RX': {
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['cross-reference'] = $EMBL[$entry]['reference'][$reference_number]['cross-reference'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['cross-reference'] = $line; }
                break;
            } // end case

            case 'RG': {
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['group'] = $EMBL[$entry]['reference'][$reference_number]['group'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['group'] = $line; }
                break;
            } // end case

            case 'RA': {
                $line = rtrim($line, ';');
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['authors'] = $EMBL[$entry]['reference'][$reference_number]['authors'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['authors'] = $line; }
                break;
            } // end case

            case 'RT': {
                $line = rtrim($line, ';');
                $line = rtrim($line, '"');
                $line = ltrim($line, '"');
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['title'] = $EMBL[$entry]['reference'][$reference_number]['title'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['title'] = $line; }
                break;
            } // end case

            case 'RL': {
                if ($code == $previousCode) { $EMBL[$entry]['reference'][$reference_number]['location'] = $EMBL[$entry]['reference'][$reference_number]['location'].' '.$line; }
                else { $EMBL[$entry]['reference'][$reference_number]['location'] = $line; }
                break;
            } // end case

            case 'DR': {
                $EMBL[$entry]['database_cross-reference']['database_identifier'] = '';
                $EMBL[$entry]['database_cross-reference']['primary_identifier'] = '';
                $EMBL[$entry]['database_cross-reference']['secondary_identifier'] = '';
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                if (isset($substring[0]) && !empty($substring[0])) { $EMBL[$entry]['database_cross-reference']['database_identifier'] = $substring[0]; }
                if (isset($substring[1]) && !empty($substring[1])) { $EMBL[$entry]['database_cross-reference']['primary_identifier'] = $substring[1]; }
                if (isset($substring[2]) && !empty($substring[2])) { $EMBL[$entry]['database_cross-reference']['secondary_identifier'] = $substring[2]; }
                break;
            } // end case

            case 'CC': {
                if ($code == $previousCode) { $EMBL[$entry]['comments'] = $EMBL[$entry]['comments'].' '.$line; }
                else { $EMBL[$entry]['comments'] = $line; }
                break;
            } // end case

            case 'AH': {
                $EMBL[$entry]['assembly_header'] = $line;
                break;
            } // end case

            case 'AS': {
                if ($code == $previousCode) { $EMBL[$entry]['assembly_information'] = $EMBL[$entry]['assembly_information'].' '.$line; }
                else { $EMBL[$entry]['assembly_information'] = $line; }
                break;
            } // end case

            case 'CO': {
                if ($code == $previousCode) { $EMBL[$entry]['contig'] = $EMBL[$entry]['contig'].' '.$line; }
                else { $EMBL[$entry]['contig'] = $line; }
                break;
            } // end case

            case 'FH': {
                if ($code == $previousCode) { $EMBL[$entry]['feature_table_header'] = $EMBL[$entry]['feature_table_header'].' '.$line; }
                else { $EMBL[$entry]['feature_table_header'] = $line; }
                break;
            } // end case

            case 'FT': {
                if ($code == $previousCode) { $EMBL[$entry]['feature_table'] = $EMBL[$entry]['feature_table'].$line; }
                else { $EMBL[$entry]['feature_table'] = $line; }
                break;
            } // end case

            case 'SQ': {
                if ($code == $previousCode) {
                    $line = str_replace(' ', '', $line);
                    $line = preg_replace('/[0-9]+/', '', $line);
                    $line = strtoupper($line);
                    $EMBL[$entry]['sequence'] = $EMBL[$entry]['sequence'].$line;
                } // end if
                else {
                    $EMBL[$entry]['sequence_header']['length'] = '';
                    $EMBL[$entry]['sequence_header']['A'] = '';
                    $EMBL[$entry]['sequence_header']['C'] = '';
                    $EMBL[$entry]['sequence_header']['G'] = '';
                    $EMBL[$entry]['sequence_header']['T'] = '';
                    $EMBL[$entry]['sequence_header']['other'] = '';
                    $substring = explode(';', $line);
                    foreach($substring as $key => $value) {
                        $substring[$key] = rtrim($value, ';');
                        $substring[$key] = ltrim($substring[$key], 'Sequence ');
                        $substring[$key] = ltrim($substring[$key], ' ');
                    } // end foreach
                    if (isset($substring[0]) && !empty($substring[0])) { $EMBL[$entry]['sequence_header']['length'] = rtrim($substring[0], ' BP'); }
                    if (isset($substring[1]) && !empty($substring[1])) { $EMBL[$entry]['sequence_header']['A']      = rtrim($substring[1], ' A'); }
                    if (isset($substring[2]) && !empty($substring[2])) { $EMBL[$entry]['sequence_header']['C']      = rtrim($substring[2], ' C'); }
                    if (isset($substring[3]) && !empty($substring[3])) { $EMBL[$entry]['sequence_header']['G']      = rtrim($substring[3], ' G'); }
                    if (isset($substring[4]) && !empty($substring[4])) { $EMBL[$entry]['sequence_header']['T']      = rtrim($substring[4], ' T'); }
                    if (isset($substring[5]) && !empty($substring[5])) { $EMBL[$entry]['sequence_header']['other']  = rtrim($substring[5], ' other'); }

                } // end else
                break;
            } // end case

            default: {

                if ($code == $previousCode) { $EMBL[$entry][$code] = $EMBL[$entry][$code].' '.$line; }
                else { $EMBL[$entry][$code] = $line; }
                break;

            } // end default

        } // end switch

    } // end while

    // close the file
    fclose($handle);

    return $EMBL;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function open_EMBL_to_database($filename, $mysqli) {

    // local variables
    $handle             =   NULL;       // [NOT EDITABLE | AUTOUPDATE] the EMBL file handle
    $EMBL               =   array();    // [NOT EDITABLE | AUTOUPDATE] the EMBL data structure array
    $line               =   '';         // [NOT EDITABLE | AUTOUPDATE] an entire line of the EMBL file
    $code               =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the EMBL file line
    $previousCode       =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the previous line
    $substring          =   NULL;       // [NOT EDITABLE | AUTOUPDATE] an array of substrings
    $reference_number   =   '';         // [NOT EDITABLE | AUTOUPDATE] the current reference number
    $featureKey         =   '';         // [NOT EDITABLE | AUTOUPDATE] the current feature key
    $previousFeatureKey =   '';         // [NOT EDITABLE | AUTOUPDATE] the previous feature key
    $location           =   '';         // [NOT EDITABLE | AUTOUPDATE] the feature location / description

    // file-specific arrays
    $data_class         =   array("PAT", "EST", "GSS", "HTC", "HTG", "WGS", "TSA", "STS", "STD");
    $taxonomic_division =   array("PHG", "ENV", "FUN", "HUM", "INV", "MAM", "VRT", "MUS", "PLN", "PRO", "ROD", "SYN", "TGN", "UNC", "VRL");

    // open the file
    $handle = fopen($filename, "r") or die("Unable to open file!");

    $EMBL = initialize_EMBL();
    while(!feof($handle)) {

        $previousCode = $code;
        $line  = fgets($handle);
        $code  = substr($line, 0, 2);  if ($code == '  ') { $code = $previousCode; } if ($code == '') { break; }
        $line  = substr($line, 5);
        if ($code !== 'FT') { $line  = preg_replace('/\s+/', ' ', trim($line)); }

        switch($code) {

            case 'XX': { $previousCode = ''; break; }
            case '//': {
                $stmt = $mysqli->prepare('INSERT INTO repeats (accession_number, sequence) VALUES (?, ?)');
                $stmt->bind_param("ss", $EMBL['identification']['primary_accession_number'], $EMBL['sequence']);
                $stmt->execute();
                $stmt->close();
                $EMBL = initialize_EMBL();
                $previousCode = '';
                break;
            } // end case
            case 'ID': {
                $EMBL['identification']['primary_accession_number'] = '';
                $EMBL['identification']['sequence_version_number'] = '';
                $EMBL['identification']['topology'] = '';
                $EMBL['identification']['molecule_type'] = '';
                $EMBL['identification']['data_class'] = decode_Data_Class('STD');
                $EMBL['identification']['taxonomic_division'] = decode_Taxonomic_Division('UNC');
                $EMBL['identification']['sequence_length'] = '';
                $substring = explode(';', $line);
                $EMBL['identification']['primary_accession_number'] = $substring[0];
                if (strpos(end($substring), "BP") !== FALSE) { $EMBL['identification']['sequence_length'] = ltrim(rtrim(end($substring), '.'), ' '); }
                foreach($substring as $key => $value) {
                    $value = ltrim($value);
                    if(strpos($value, "SV") === 0) { $EMBL['identification']['sequence_version_number'] = $value; }
                    if (($value == "circular") || ($value == "linear")) { $EMBL['identification']['topology'] = $value; }
                    if ((strpos($value, 'DNA') !== FALSE) || (strpos($value, 'RNA') !== false)) { $EMBL['identification']['molecule_type'] = $value; }
                    foreach ($data_class as $dc) { if ($value == $dc) { $EMBL['identification']['data_class'] = decode_Data_Class($dc); } }
                    foreach ($taxonomic_division as $td) { if ($value == $td) { $EMBL['identification']['taxonomic_division'] = decode_Taxonomic_Division($td); } }
                } // end foreach
                break;
            } // end case

            case 'AC': {
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                foreach($substring as $key => $value) { if($value !== '') { $EMBL['accession_number'][$key] = $value; } }
                break;
            } // end case

            case 'PR': {
                $EMBL['project_identifier'] = rtrim($line, ';');
                break;
            } // end case

            case 'DT': {

                if ($code == $previousCode) { $EMBL['date_updated'] = $line; }
                else { $EMBL['date_created'] = $line; }
                break;
            } // end case

            case 'DE': {
                if ($code == $previousCode) { $EMBL['description'] = $EMBL['description'].' '.$line; }
                else { $EMBL['description'] = $line; }
                break;
            } // end case

            case 'KW': {
                if ($code == $previousCode) { $EMBL['keywords'] = $EMBL['keywords'].' '.$line; }
                else { $EMBL['keywords'] = $line; }
                break;
            } // end case

            case 'OS': {
                if ($code == $previousCode) { $EMBL['organism_species'] = $EMBL['organism_species'].' '.$line; }
                else { $EMBL['organism_species'] = $line; }
                break;
            } // end case

            case 'OC': {
                if ($code == $previousCode) { $EMBL['organism_classification'] = $EMBL['organism_classification'].' '.$line; }
                else { $EMBL['organism_classification'] = $line; }
                break;
            } // end case

            case 'OG': {
                $EMBL['organelle'] = $line;
                break;
            } // end case

            case 'RN': {
                $line = rtrim($line, ']');
                $line = ltrim($line, '[');
                $reference_number = $line;
                break;
            } // end case

            case 'RC': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['comment'] = $EMBL['reference'][$reference_number]['comment'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['comment'] = $line; }
                break;
            } // end case

            case 'RP': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['positions'] = $EMBL['reference'][$reference_number]['positions'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['positions'] = $line; }
                break;
            } // end case

            case 'RX': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['cross-reference'] = $EMBL['reference'][$reference_number]['cross-reference'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['cross-reference'] = $line; }
                break;
            } // end case

            case 'RG': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['group'] = $EMBL['reference'][$reference_number]['group'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['group'] = $line; }
                break;
            } // end case

            case 'RA': {
                $line = rtrim($line, ';');
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['authors'] = $EMBL['reference'][$reference_number]['authors'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['authors'] = $line; }
                break;
            } // end case

            case 'RT': {
                $line = rtrim($line, ';');
                $line = rtrim($line, '"');
                $line = ltrim($line, '"');
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['title'] = $EMBL['reference'][$reference_number]['title'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['title'] = $line; }
                break;
            } // end case

            case 'RL': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['location'] = $EMBL['reference'][$reference_number]['location'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['location'] = $line; }
                break;
            } // end case

            case 'DR': {
                $EMBL['database_cross-reference']['database_identifier'] = '';
                $EMBL['database_cross-reference']['primary_identifier'] = '';
                $EMBL['database_cross-reference']['secondary_identifier'] = '';
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                if (isset($substring[0]) && !empty($substring[0])) { $EMBL['database_cross-reference']['database_identifier'] = $substring[0]; }
                if (isset($substring[1]) && !empty($substring[1])) { $EMBL['database_cross-reference']['primary_identifier'] = $substring[1]; }
                if (isset($substring[2]) && !empty($substring[2])) { $EMBL['database_cross-reference']['secondary_identifier'] = $substring[2]; }
                break;
            } // end case

            case 'CC': {
                if ($code == $previousCode) { $EMBL['comments'] = $EMBL['comments'].' '.$line; }
                else { $EMBL['comments'] = $line; }
                break;
            } // end case

            case 'AH': {
                $EMBL['assembly_header'] = $line;
                break;
            } // end case

            case 'AS': {
                if ($code == $previousCode) { $EMBL['assembly_information'] = $EMBL['assembly_information'].' '.$line; }
                else { $EMBL['assembly_information'] = $line; }
                break;
            } // end case

            case 'CO': {
                if ($code == $previousCode) { $EMBL['contig'] = $EMBL['contig'].' '.$line; }
                else { $EMBL['contig'] = $line; }
                break;
            } // end case

            case 'FH': {
                if ($code == $previousCode) { $EMBL['feature_table_header'] = $EMBL['feature_table_header'].' '.$line; }
                else { $EMBL['feature_table_header'] = $line; }
                break;
            } // end case

            case 'FT': {
                if ($code == $previousCode) { $EMBL['feature_table'] = $EMBL['feature_table'].$line; }
                else { $EMBL['feature_table'] = $line; }
                break;
            } // end case

            case 'SQ': {
                if ($code == $previousCode) {
                    $line = str_replace(' ', '', $line);
                    $line = preg_replace('/[0-9]+/', '', $line);
                    $line = strtoupper($line);
                    $EMBL['sequence'] = $EMBL['sequence'].$line;
                } // end if
                else {
                    $EMBL['sequence_header']['length'] = '';
                    $EMBL['sequence_header']['A'] = '';
                    $EMBL['sequence_header']['C'] = '';
                    $EMBL['sequence_header']['G'] = '';
                    $EMBL['sequence_header']['T'] = '';
                    $EMBL['sequence_header']['other'] = '';
                    $substring = explode(';', $line);
                    foreach($substring as $key => $value) {
                        $substring[$key] = rtrim($value, ';');
                        $substring[$key] = ltrim($substring[$key], 'Sequence ');
                        $substring[$key] = ltrim($substring[$key], ' ');
                    } // end foreach
                    if (isset($substring[0]) && !empty($substring[0])) { $EMBL['sequence_header']['length'] = rtrim($substring[0], ' BP'); }
                    if (isset($substring[1]) && !empty($substring[1])) { $EMBL['sequence_header']['A']      = rtrim($substring[1], ' A'); }
                    if (isset($substring[2]) && !empty($substring[2])) { $EMBL['sequence_header']['C']      = rtrim($substring[2], ' C'); }
                    if (isset($substring[3]) && !empty($substring[3])) { $EMBL['sequence_header']['G']      = rtrim($substring[3], ' G'); }
                    if (isset($substring[4]) && !empty($substring[4])) { $EMBL['sequence_header']['T']      = rtrim($substring[4], ' T'); }
                    if (isset($substring[5]) && !empty($substring[5])) { $EMBL['sequence_header']['other']  = rtrim($substring[5], ' other'); }

                } // end else
                break;
            } // end case

            default: {

                if ($code == $previousCode) { $EMBL[$code] = $EMBL[$code].' '.$line; }
                else { $EMBL[$code] = $line; }
                break;

            } // end default

        } // end switch

    } // end while

  // close the file
    fclose($handle);

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function json_EMBL_to_database($embl_json, $mysqli) {

    // local variables
    $EMBL               =   array();    // [NOT EDITABLE | AUTOUPDATE] the EMBL data structure array
    $code               =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the EMBL file line
    $previousCode       =   '';         // [NOT EDITABLE | AUTOUPDATE] the line code of the previous line
    $substring          =   NULL;       // [NOT EDITABLE | AUTOUPDATE] an array of substrings
    $reference_number   =   '';         // [NOT EDITABLE | AUTOUPDATE] the current reference number
    $featureKey         =   '';         // [NOT EDITABLE | AUTOUPDATE] the current feature key
    $previousFeatureKey =   '';         // [NOT EDITABLE | AUTOUPDATE] the previous feature key
    $location           =   '';         // [NOT EDITABLE | AUTOUPDATE] the feature location / description

    // file-specific arrays
    $data_class         =   array("PAT", "EST", "GSS", "HTC", "HTG", "WGS", "TSA", "STS", "STD");
    $taxonomic_division =   array("PHG", "ENV", "FUN", "HUM", "INV", "MAM", "VRT", "MUS", "PLN", "PRO", "ROD", "SYN", "TGN", "UNC", "VRL");

    $EMBL = initialize_EMBL();
    foreach ($embl_json as $line) {

        $previousCode = $code;
        $code  = substr($line, 0, 2);  if ($code == '  ') { $code = $previousCode; } if ($code == '') { break; }
        $line  = substr($line, 5);
        if ($code !== 'FT') { $line  = preg_replace('/\s+/', ' ', trim($line)); }

        switch($code) {

            case 'XX': { $previousCode = ''; break; }
            case '//': {
                $stmt = $mysqli->prepare('INSERT INTO repeats (accession_number, sequence) VALUES (?, ?)');
                $stmt->bind_param("ss", $EMBL['identification']['primary_accession_number'], $EMBL['sequence']);
                $stmt->execute();
                $stmt->close();
                $EMBL = initialize_EMBL();
                $previousCode = '';
                break;
            } // end case
            case 'ID': {
                $EMBL['identification']['primary_accession_number'] = '';
                $EMBL['identification']['sequence_version_number'] = '';
                $EMBL['identification']['topology'] = '';
                $EMBL['identification']['molecule_type'] = '';
                $EMBL['identification']['data_class'] = decode_Data_Class('STD');
                $EMBL['identification']['taxonomic_division'] = decode_Taxonomic_Division('UNC');
                $EMBL['identification']['sequence_length'] = '';
                $substring = explode(';', $line);
                $EMBL['identification']['primary_accession_number'] = $substring[0];
                if (strpos(end($substring), "BP") !== FALSE) { $EMBL['identification']['sequence_length'] = ltrim(rtrim(end($substring), '.'), ' '); }
                foreach($substring as $key => $value) {
                    $value = ltrim($value);
                    if(strpos($value, "SV") === 0) { $EMBL['identification']['sequence_version_number'] = $value; }
                    if (($value == "circular") || ($value == "linear")) { $EMBL['identification']['topology'] = $value; }
                    if ((strpos($value, 'DNA') !== FALSE) || (strpos($value, 'RNA') !== false)) { $EMBL['identification']['molecule_type'] = $value; }
                    foreach ($data_class as $dc) { if ($value == $dc) { $EMBL['identification']['data_class'] = decode_Data_Class($dc); } }
                    foreach ($taxonomic_division as $td) { if ($value == $td) { $EMBL['identification']['taxonomic_division'] = decode_Taxonomic_Division($td); } }
                } // end foreach
                break;
            } // end case

            case 'AC': {
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                foreach($substring as $key => $value) { if($value !== '') { $EMBL['accession_number'][$key] = $value; } }
                break;
            } // end case

            case 'PR': {
                $EMBL['project_identifier'] = rtrim($line, ';');
                break;
            } // end case

            case 'DT': {

                if ($code == $previousCode) { $EMBL['date_updated'] = $line; }
                else { $EMBL['date_created'] = $line; }
                break;
            } // end case

            case 'DE': {
                if ($code == $previousCode) { $EMBL['description'] = $EMBL['description'].' '.$line; }
                else { $EMBL['description'] = $line; }
                break;
            } // end case

            case 'KW': {
                if ($code == $previousCode) { $EMBL['keywords'] = $EMBL['keywords'].' '.$line; }
                else { $EMBL['keywords'] = $line; }
                break;
            } // end case

            case 'OS': {
                if ($code == $previousCode) { $EMBL['organism_species'] = $EMBL['organism_species'].' '.$line; }
                else { $EMBL['organism_species'] = $line; }
                break;
            } // end case

            case 'OC': {
                if ($code == $previousCode) { $EMBL['organism_classification'] = $EMBL['organism_classification'].' '.$line; }
                else { $EMBL['organism_classification'] = $line; }
                break;
            } // end case

            case 'OG': {
                $EMBL['organelle'] = $line;
                break;
            } // end case

            case 'RN': {
                $line = rtrim($line, ']');
                $line = ltrim($line, '[');
                $reference_number = $line;
                break;
            } // end case

            case 'RC': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['comment'] = $EMBL['reference'][$reference_number]['comment'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['comment'] = $line; }
                break;
            } // end case

            case 'RP': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['positions'] = $EMBL['reference'][$reference_number]['positions'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['positions'] = $line; }
                break;
            } // end case

            case 'RX': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['cross-reference'] = $EMBL['reference'][$reference_number]['cross-reference'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['cross-reference'] = $line; }
                break;
            } // end case

            case 'RG': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['group'] = $EMBL['reference'][$reference_number]['group'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['group'] = $line; }
                break;
            } // end case

            case 'RA': {
                $line = rtrim($line, ';');
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['authors'] = $EMBL['reference'][$reference_number]['authors'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['authors'] = $line; }
                break;
            } // end case

            case 'RT': {
                $line = rtrim($line, ';');
                $line = rtrim($line, '"');
                $line = ltrim($line, '"');
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['title'] = $EMBL['reference'][$reference_number]['title'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['title'] = $line; }
                break;
            } // end case

            case 'RL': {
                if ($code == $previousCode) { $EMBL['reference'][$reference_number]['location'] = $EMBL['reference'][$reference_number]['location'].' '.$line; }
                else { $EMBL['reference'][$reference_number]['location'] = $line; }
                break;
            } // end case

            case 'DR': {
                $EMBL['database_cross-reference']['database_identifier'] = '';
                $EMBL['database_cross-reference']['primary_identifier'] = '';
                $EMBL['database_cross-reference']['secondary_identifier'] = '';
                $substring = explode(';', $line);
                foreach($substring as $key => $value) { $substring[$key] = ltrim(rtrim($value, ';'), ' '); }
                if (isset($substring[0]) && !empty($substring[0])) { $EMBL['database_cross-reference']['database_identifier'] = $substring[0]; }
                if (isset($substring[1]) && !empty($substring[1])) { $EMBL['database_cross-reference']['primary_identifier'] = $substring[1]; }
                if (isset($substring[2]) && !empty($substring[2])) { $EMBL['database_cross-reference']['secondary_identifier'] = $substring[2]; }
                break;
            } // end case

            case 'CC': {
                if ($code == $previousCode) { $EMBL['comments'] = $EMBL['comments'].' '.$line; }
                else { $EMBL['comments'] = $line; }
                break;
            } // end case

            case 'AH': {
                $EMBL['assembly_header'] = $line;
                break;
            } // end case

            case 'AS': {
                if ($code == $previousCode) { $EMBL['assembly_information'] = $EMBL['assembly_information'].' '.$line; }
                else { $EMBL['assembly_information'] = $line; }
                break;
            } // end case

            case 'CO': {
                if ($code == $previousCode) { $EMBL['contig'] = $EMBL['contig'].' '.$line; }
                else { $EMBL['contig'] = $line; }
                break;
            } // end case

            case 'FH': {
                if ($code == $previousCode) { $EMBL['feature_table_header'] = $EMBL['feature_table_header'].' '.$line; }
                else { $EMBL['feature_table_header'] = $line; }
                break;
            } // end case

            case 'FT': {
                if ($code == $previousCode) { $EMBL['feature_table'] = $EMBL['feature_table'].$line; }
                else { $EMBL['feature_table'] = $line; }
                break;
            } // end case

            case 'SQ': {
                if ($code == $previousCode) {
                    $line = str_replace(' ', '', $line);
                    $line = preg_replace('/[0-9]+/', '', $line);
                    $line = strtoupper($line);
                    $EMBL['sequence'] = $EMBL['sequence'].$line;
                } // end if
                else {
                    $EMBL['sequence_header']['length'] = '';
                    $EMBL['sequence_header']['A'] = '';
                    $EMBL['sequence_header']['C'] = '';
                    $EMBL['sequence_header']['G'] = '';
                    $EMBL['sequence_header']['T'] = '';
                    $EMBL['sequence_header']['other'] = '';
                    $substring = explode(';', $line);
                    foreach($substring as $key => $value) {
                        $substring[$key] = rtrim($value, ';');
                        $substring[$key] = ltrim($substring[$key], 'Sequence ');
                        $substring[$key] = ltrim($substring[$key], ' ');
                    } // end foreach
                    if (isset($substring[0]) && !empty($substring[0])) { $EMBL['sequence_header']['length'] = rtrim($substring[0], ' BP'); }
                    if (isset($substring[1]) && !empty($substring[1])) { $EMBL['sequence_header']['A']      = rtrim($substring[1], ' A'); }
                    if (isset($substring[2]) && !empty($substring[2])) { $EMBL['sequence_header']['C']      = rtrim($substring[2], ' C'); }
                    if (isset($substring[3]) && !empty($substring[3])) { $EMBL['sequence_header']['G']      = rtrim($substring[3], ' G'); }
                    if (isset($substring[4]) && !empty($substring[4])) { $EMBL['sequence_header']['T']      = rtrim($substring[4], ' T'); }
                    if (isset($substring[5]) && !empty($substring[5])) { $EMBL['sequence_header']['other']  = rtrim($substring[5], ' other'); }

                } // end else
                break;
            } // end case

            default: {

                if ($code == $previousCode) { $EMBL[$code] = $EMBL[$code].' '.$line; }
                else { $EMBL[$code] = $line; }
                break;

            } // end default

        } // end switch

    } // end while

  // close the file
    fclose($handle);

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

?>

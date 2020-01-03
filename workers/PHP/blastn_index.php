<?php

$mysql_user             =   'moirai';                                                                       // [NOT EDITABLE] database username
$mysql_password         =   'Buddha400BC';                                                                  // [NOT EDITABLE] database password
$mysql_database         =   'moirai_db';                                                                    // [NOT EDITABLE] database name
$mysql_error            =   'Could not connect.';                                                           // [NOT EDITABLE] default database error message
$mysql_host             =   'mysql.moiraiconservation.org';                                                 // [NOT EDITABLE] database host

// AJAX safeguard
if (!filter_var($_POST['execute'], FILTER_VALIDATE_BOOLEAN)) { die(); }

// local variables
$command            =   '';     // [NOT EDITABLE | AUTOUPDATE] the posted command
$id                 =   '';     // [NOT EDITABLE | AUTOUPDATE] the id of the organism (organism name)
$organism_name      =   '';     // [NOT EDITABLE | AUTOUPDATE] the posted organism name
$index              =   '';     // [NOT EDITABLE | AUTOUPDATE] the index of the genome sequence
$kmer_size          =   0;      // [NOT EDITABLE | AUTOUPDATE] the kmer length
$json               =   '';     // [NOT EDITABLE | AUTOUPDATE] the posted data object

if (isset($_POST['command'      ]) && !empty($_POST['command'      ])) { $command       = $_POST['command'      ]; }
if (isset($_POST['id'           ]) && !empty($_POST['id'           ])) { $id            = $_POST['id'           ]; }
if (isset($_POST['organism_name']) && !empty($_POST['organism_name'])) { $organism_name = $_POST['organism_name']; }
if (isset($_POST['index'        ]) && !empty($_POST['index'        ])) { $index         = $_POST['index'        ]; }
if (isset($_POST['kmer_size'    ]) && !empty($_POST['kmer_size'    ])) { $kmer_size     = $_POST['kmer_size'    ]; }
if (isset($_POST['json'         ]) && !empty($_POST['json'         ])) { $json          = $_POST['json'         ]; }

switch($command) {
    case 'update_metadata': {
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, 'blastn_db');
        if (mysqli_connect_errno()) { die(mysql_error); }
        $timestamp = array();
        date_default_timezone_set("America/New_York");
        $timestamp['year']   = date("Y");
        $timestamp['day']    = date("z");
        $timestamp['hour']   = date("H");
        $timestamp['minute'] = date("i");
        $timestamp['second'] = date("s");
        $query  = 'UPDATE table_metadata SET ';
        $query .=    'year = "'.$timestamp['year']  .'", ';
        $query .=     'day = "'.$timestamp['day']   .'", ';
        $query .=    'hour = "'.$timestamp['hour']  .'", ';
        $query .=  'minute = "'.$timestamp['minute'].'", ';
        $query .=  'second = "'.$timestamp['second'].'" ';
        $query .= 'WHERE id = "'.$id.'"';
        if ($db->query($query) === FALSE) { die($mysql_error . ' Checkpoint 1'); }
        $db->close();
        break;
    } // end case

    case 'reset_table': {
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, 'blastn_db');
        if (mysqli_connect_errno()) { die(mysql_error); }
        $db_query  = 'SELECT COUNT(*) ';
        $db_query .= 'FROM information_schema.tables ';
        $db_query .= 'WHERE table_schema = "blastn_db" ';
        $db_query .= 'AND table_name = "'.$organism_name.'"';
        $db_result = $db->query($db_query);
        $db_record = $db_result->fetch_array();
        if ($db_record[0]) {
            $db_query  = 'TRUNCATE TABLE '.$organism_name;
            if ($db->query($db_query) === FALSE) { die($mysql_error . ' Checkpoint 2'); }
        } // end if
        $db->close();
        break;
    } // end case

    case 'blastn_index_to_db': {
        $obj = json_decode($json);
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, 'blastn_db');
        if (mysqli_connect_errno()) { die($mysql_error . ' Checkpoint 3'); }
        $db_query  = 'SELECT COUNT(*) ';
        $db_query .= 'FROM information_schema.tables ';
        $db_query .= 'WHERE table_schema = "blastn_db" ';
        $db_query .= 'AND table_name = "'.$organism_name.'"';
        $db_result = $db->query($db_query);
        $db_record = $db_result->fetch_array();
        if (!$db_record[0]) {
            $db_query  = 'CREATE TABLE '.$organism_name.' (';
            $db_query .= 'id INT(11) AUTO_INCREMENT, ';
            $db_query .= 'kmer VARCHAR(512) NOT NULL, ';
            $db_query .= 'sequences LONGTEXT NOT NULL, ';
            $db_query .= 'PRIMARY KEY(id), ';
            $db_query .= 'INDEX kmer_index (kmer), ';
            $db_query .= 'UNIQUE (kmer)';
            $db_query .= ')';
            if ($db->query($db_query) === FALSE) { die($mysql_error . ' Checkpoint 4'); }
        } // end if
        $root = '';
        $first_kmer = TRUE;
        $prefix = 'INSERT INTO '.$organism_name.' (kmer, sequences) VALUES ';
        for ($j = 0; $j < count($obj); $j++) {
            $first_id = TRUE;
            if ($first_kmer) { $first_kmer = FALSE; }
            else { $root .=','; }
            $root .= '("'.index_to_kmer(($j + $index), $kmer_size).'", "';
            for ($k = 0; $k < count($obj[$j]); $k++) {
                if (isset($obj[$j][$k]) && !empty($obj[$j][$k])) {
                    if ($first_id) { $first_id = FALSE; }
                    else { $root .=','; }
                    $root .= $obj[$j][$k];
                } // end if
            } // end for loop
            $root .= '")';
        } // end for loop
        $query = $prefix.$root;
        if ($db->query($query) === FALSE) { die($mysql_error . ' Checkpoint 5'); }
        // close the database
        $db->close();
        break;
    } // end case

    default: { break; }

} // end switch

///////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
function sanitized($string) {
    if (strpos($string, '!')) { return FALSE; }
    if (strpos($string, '"')) { return FALSE; }
    if (strpos($string, '#')) { return FALSE; }
    if (strpos($string, '$')) { return FALSE; }
    if (strpos($string, '%')) { return FALSE; }
    if (strpos($string, '&')) { return FALSE; }
    if (strpos($string, "'")) { return FALSE; }
    if (strpos($string, '*')) { return FALSE; }
    if (strpos($string, '+')) { return FALSE; }
    if (strpos($string, '.')) { return FALSE; }
    if (strpos($string, '/')) { return FALSE; }
    if (strpos($string, ':')) { return FALSE; }
    if (strpos($string, ';')) { return FALSE; }
    if (strpos($string, '<')) { return FALSE; }
    if (strpos($string, '=')) { return FALSE; }
    if (strpos($string, '>')) { return FALSE; }
    if (strpos($string, '?')) { return FALSE; }
    if (strpos($string, '@')) { return FALSE; }
    if (strpos($string,'\\')) { return FALSE; }
    if (strpos($string, '^')) { return FALSE; }
    if (strpos($string, '`')) { return FALSE; }
    if (strpos($string, '{')) { return FALSE; }
    if (strpos($string, '|')) { return FALSE; }
    if (strpos($string, '}')) { return FALSE; }
    if (strpos($string, '~')) { return FALSE; }
    return TRUE;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
function kmer_to_index($kmer) {
    $index = 0;
    $factor = 1;
    for ($i = (strlen($kmer) - 1); $i >= 0; $i--) {
        $value = 0;
        $letter = mb_substr($kmer, $i, 1);
        switch($letter) {
            case 'A': { $value = 0; break; }
            case 'C': { $value = 1; break; }
            case 'G': { $value = 2; break; }
            case 'T': { $value = 3; break; }
            default: { break; }
        } // end switch
        $index = $index + ($value * $factor);
        $factor = $factor * 4;
    } // end for loop
    return $index;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
function index_to_kmer($index, $kmer_size = 8) {
    $kmer = '';
    $denominator = 4;
    while ($index > 0) {
        $remainder = fmod($index, $denominator);
        switch ($remainder) {
            case 0: { $kmer = 'A'.$kmer; break; }
            case 1: { $kmer = 'C'.$kmer; break; }
            case 2: { $kmer = 'G'.$kmer; break; }
            case 3: { $kmer = 'T'.$kmer; break; }
            default: { break; }
        } // end switch
        $index = ($index - $remainder) / 4;
    } // end while
    $kmer = str_pad($kmer, $kmer_size, "A", STR_PAD_LEFT);
    return $kmer;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
?>

<?php if (session_status() != PHP_SESSION_ACTIVE) session_start();
require_once realpath($_SERVER["DOCUMENT_ROOT"])."/PHP/core_speedy.php";
session_write_close();
if (!filter_var($_POST["execute"], FILTER_VALIDATE_BOOLEAN)) { die(); }
// local variables
$command        = "";
$id             = "";
$json           = "";
$num_indices    = "";
$num_uploaded   = 0;
$organism_name  = "";
if (isset($_POST["command"      ]) && !empty($_POST["command"      ])) { $command       = $_POST["command"      ]; }
if (isset($_POST["id"           ]) && !empty($_POST["id"           ])) { $id            = $_POST["id"           ]; }
if (isset($_POST["json"         ]) && !empty($_POST["json"         ])) { $json          = $_POST["json"         ]; }
if (isset($_POST["num_records"  ]) && !empty($_POST["num_records"  ])) { $num_indices   = $_POST["num_records"  ]; }
if (isset($_POST["num_uploaded" ]) && !empty($_POST["num_uploaded" ])) { $num_uploaded  = $_POST["num_uploaded" ]; }
if (isset($_POST["organism_name"]) && !empty($_POST["organism_name"])) { $organism_name = $_POST["organism_name"]; }
$db = new mysqli($mysql_host, $mysql_user, $mysql_password, "cds_index_db");
if (mysqli_connect_errno()) { die(mysql_error); }
switch($command) {
  case "update_num_records": {
    if (sanitized($table) && sanitized($num_indices)) {
      $query = 'UPDATE table_metadata SET records = "'.$num_indices.'" WHERE id = "'.$id.'"';
      if ($db->query($query) === FALSE) { die($mysql_error); }
    } // end if
    break;
  } // end case
  case "cds_index_to_db": {
    $obj = json_decode($json);
    if (!$num_uploaded) {
      $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) ';
      $db_query .= 'FROM information_schema.tables ';
      $db_query .= 'WHERE table_schema = "cds_index_db" ';
      $db_query .= 'AND table_name = "'.$organism_name.'"';
      $db_result = $db->query($db_query);
      $db_record = $db_result->fetch_array();
      if (!$db_record[0]) {
        $db_query  = 'CREATE TABLE '.$organism_name.' (';
        $db_query .= 'id INT(11) AUTO_INCREMENT, ';
        $db_query .= 'kmer VARCHAR(512) NOT NULL, ';
        $db_query .= 'sequences LONGTEXT NOT NULL, ';
        $db_query .= 'PRIMARY KEY(id), ';
        $db_query .= 'INDEX kmer_index (kmer)';
        $db_query .= ')';
        if ($db->query($db_query) === FALSE) { die($mysql_error . " Checkpoint 2"); }
      } // end if
    } // end if
    $root = "";
    $first_kmer = TRUE;
    $prefix = 'INSERT INTO '.$organism_name.' (kmer, sequences) VALUES ';
    for ($j = 0; $j < count($obj); $j++) {
      $first_id = TRUE;
      if ($first_kmer) { $first_kmer = FALSE; }
      else { $root .=","; }
      $root .= '("'.$obj[$j]->kmer.'", "'.$obj[$j]->sequences.'")';
    } // end for loop
    $query = $prefix.$root;
    if ($db->query($query) === FALSE) { die($mysql_error . " Checkpoint 5"); }
    // close the database
    break;
  } // end case
  default: { break; }
} // end switch
///////////////////////////////////////////////////////////////////////////////
// CLOSE MYSQL CONNECTION /////////////////////////////////////////////////////
$db->close();
$mysqli->close();
///////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////
?>

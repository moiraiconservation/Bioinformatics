<?php
if (session_status() != PHP_SESSION_ACTIVE) session_start();
require realpath($_SERVER["DOCUMENT_ROOT"])."/PHP/core.php";
if (!filter_var($_POST['execute'], FILTER_VALIDATE_BOOLEAN)) { die(); }
if ($user['active']) {
  /////////////////////////////////////////////////////////////////////////////
  // VARIABLES ////////////////////////////////////////////////////////////////
  $direct_command = NULL;
  $obj            = NULL;
  $options        = NULL;
  if (isset($_POST['direct_command']) && !empty($_POST['direct_command'])) { $direct_command = $_POST['direct_command']; }
  if ($direct_command) { $direct_command = strip_tags($direct_command); filter_var($direct_command,  FILTER_SANITIZE_STRING); }
  if (isset($_POST['json']) && !empty($_POST['json'])) { $obj = json_decode($_POST['json']); }
  if ($obj->command ) { $obj->command  = strip_tags($obj->command ); $obj->command  = filter_var($obj->command,  FILTER_SANITIZE_STRING); }
  if ($obj->source  ) { $obj->source   = strip_tags($obj->source  ); $obj->source   = filter_var($obj->source,   FILTER_SANITIZE_URL);    }
  if ($obj->target  ) { $obj->target   = strip_tags($obj->target  ); $obj->target   = filter_var($obj->target,   FILTER_SANITIZE_URL);    }
  if ($obj->filename) { $obj->filename = strip_tags($obj->filename); $obj->filename = filter_var($obj->filename, FILTER_SANITIZE_STRING); }
  if ($obj->database) { $obj->database = strip_tags($obj->database); $obj->database = filter_var($obj->database, FILTER_SANITIZE_STRING); }
  if ($obj->table   ) { $obj->table    = strip_tags($obj->table   ); $obj->table    = filter_var($obj->table,    FILTER_SANITIZE_STRING); }
  if (!sanitized($obj->table)) { die("Improperly formatted table name."); }
  if ($obj->options) { $options = json_encode($obj->options); }
  ////////////////////////////////////////////////////////////////////////
  if ($direct_command) {
    switch($direct_command) {
      ////////////////////////////////////////////////////////////////////
      case "check_bounty": {
        $database = "";
        $table = "";
        $organism_name = "";
        $bounty = "";
        if (isset($_POST["database"]     ) && !empty($_POST["database"]     )) { $database      = $_POST["database"]; }
        if (isset($_POST["table"]        ) && !empty($_POST["table"]        )) { $table         = $_POST["table"]; }
        if (isset($_POST["organism_name"]) && !empty($_POST["organism_name"])) { $organism_name = $_POST["organism_name"]; }
        if (isset($_POST["bounty"]       ) && !empty($_POST["bounty"]       )) { $bounty        = $_POST["bounty"]; }
        if ($database     ) { $database      = strip_tags($database     ); $database      = filter_var($database,      FILTER_SANITIZE_STRING); }
        if ($table        ) { $table         = strip_tags($table        ); $table         = filter_var($table,         FILTER_SANITIZE_STRING); }
        if ($organism_name) { $organism_name = strip_tags($organism_name); $organism_name = filter_var($organism_name, FILTER_SANITIZE_STRING); }
        if ($bounty       ) { $bounty        = strip_tags($bounty       ); $bounty        = filter_var($bounty,        FILTER_SANITIZE_STRING); }
        $database       = $mysqli->real_escape_string($database);
        $table          = $mysqli->real_escape_string($table);
        $organism_name  = $mysqli->real_escape_string($organism_name);
        $bounty         = $mysqli->real_escape_string($bounty);
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $database);
        if (mysqli_connect_errno()) { die("check_bounty: checkpoint 1"); }
        // does the metadata table exist?
        $query = 'SELECT * FROM table_metadata WHERE id = "'.$table.'"';
        $query_result = $db->query($query);
        if ($query_result->num_rows >= 1) {
          $metadata = $query_result->fetch_object();
          // is the bioaction complete?
          $db_query  = 'SELECT COUNT(*) FROM '.$table;
          $db_result = $db->query($db_query);
          if ($query_result->num_rows >= 1) {
            $db_record = $db_result->fetch_array();
            if ($db_record["COUNT(*)"] >= $metadata->records) {
              // does this user own the record?
              if ($metadata->userID == $user['id']) {
                $query = 'SELECT * FROM bounties WHERE organism_name = "'.$organism_name.'"';
                $query_result = $mysqli->query($query);
                $bounties = $query_result->fetch_array();
                // claim the bounty
                if ($bounties[$bounty]) {
                  $options = json_decode($user["options"], TRUE);
                  if (!$options["tokens"]) { $options["tokens"] = 0; }
                  $options["tokens"] += $bounties[$bounty];
                  $stmt = $mysqli->prepare('UPDATE users SET options = ? WHERE userID = "'.$user['id'].'"');
                  $stmt->bind_param("s", json_encode($options));
                  $stmt->execute();
                  $stmt->close();
                  $query = 'UPDATE bounties SET '.$bounty.' = "0" WHERE organism_name = "'.$organism_name.'"';
                  if ($mysqli->query($query) === FALSE) { die("check_bounty: checkpoint 2"); }
                } // end if
              } // end if
            } // end if
          } // end if
        } // end if
        break;
      } // end case
      /////////////////////////////////////////////////////////////////////////
      case "get_contig_map": {
        $accession = "";
        $records = [];
        $table = "";
        if (isset($_POST["accession"]) && !empty($_POST["accession"])) { $accession = $_POST["accession"]; }
        if (isset($_POST["table"]    ) && !empty($_POST["table"]    )) { $table     = $_POST["table"]; }
        if ($accession) { $accession = strip_tags($accession);
        if ($table    ) { $table     = strip_tags($table    );
        $accession = filter_var($accession, FILTER_SANITIZE_STRING); }
        $table     = filter_var($table,     FILTER_SANITIZE_STRING); }
        $accession = $mysqli->real_escape_string($accession);
        $table     = $mysqli->real_escape_string($table);
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, "genome_db");
        if (mysqli_connect_errno()) { die('[]'); }
        $query = 'SELECT id, char_length FROM '.$table.' WHERE accession = "'.$accession.'" ORDER BY id ASC';
        $query_result = $db->query($query);
        while ($query_record = $query_result->fetch_object()) {
          $records[] = $query_record;
        } // end while
        echo json_encode($records);
        break;
      } // end case
      /////////////////////////////////////////////////////////////////////////
      case "update_user_computer_time": {
        update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
        break;
      } // end case
      default: { break; }
    } // end switch
  } // end if
  ////////////////////////////////////////////////////////////////////////
  if ($obj->command) {
    switch($obj->command) {
      ////////////////////////////////////////////////////////////////////
      case "age_estimate_to_db": {
        $obj->command = "";
        $obj->status = 'success';
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { $obj->status = 'failure'; echo json_encode($obj); die("age_estimate_to_db: checkpoint 1"); }
        } // end if
        else { die("age_estimate_to_db: checkpoint 2"); }
        $db_query = 'SELECT * FROM mayne WHERE mayne = "'.$obj->organism_name.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE mayne SET ';
          $query .= 'estimate = "'.$obj->estimate      .'", ';
          $query .=   'userID = "'.$user['id']         .'", ';
          $query .=     'year = "'.$timestamp['year']  .'", ';
          $query .=      'day = "'.$timestamp['day']   .'", ';
          $query .=     'hour = "'.$timestamp['hour']  .'", ';
          $query .=   'minute = "'.$timestamp['minute'].'", ';
          $query .=   'second = "'.$timestamp['second'].'" ';
          $query .= 'WHERE organism_name = "'.$obj->organism_name.'"';
          if ($db->query($query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("age_estimate_to_db: checkpoint 3"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE mayne SET options = ? WHERE organism_name = "'.$obj->organism_name.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end if
        else {
          $db_query  = 'INSERT INTO mayne (id, organism_name, estimate, userID, year, day, hour, minute, second) ';
          $db_query .= 'VALUES (';
          $db_query .= '"'.GUIDv4().'", ';
          $db_query .= '"'.$obj->organism_name.'", ';
          $db_query .= '"'.$obj->estimate.'", ';
          $db_query .= '"'.$user['id'].'", ';
          $db_query .= '"'.$timestamp['year'].'", ';
          $db_query .= '"'.$timestamp['day'].'", ';
          $db_query .= '"'.$timestamp['hour'].'", ';
          $db_query .= '"'.$timestamp['minute'].'", ';
          $db_query .= '"'.$timestamp['second'].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("age_estimate_to_db: checkpoint 4"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE mayne SET options = ? WHERE organism_name = "'.$obj->organism_name.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
        $db->close();
        echo json_encode($obj);
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "FASTA_to_db": {
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { die("FASTA_to_db: checkpoint 1"); }
        } // end if
        else { die("FASTA_to_db: checkpoint 2"); }
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT COUNT(*) ';
          $db_query .= 'FROM information_schema.tables ';
          $db_query .= 'WHERE table_schema = "'.$obj->database.'" ';
          $db_query .= 'AND table_name = "'.$obj->table.'"';
          $db_result = $db->query($db_query);
          $db_record = $db_result->fetch_array();
          if (!$db_record[0]) {
            $db_query  = 'CREATE TABLE '.$obj->table.' (';
            $db_query .= 'id INT(11) AUTO_INCREMENT, ';
            $db_query .= 'accession VARCHAR(512) NOT NULL, ';
            $db_query .= 'defline VARCHAR(512) NOT NULL, ';
            $db_query .= 'sequence LONGTEXT NOT NULL, ';
            $db_query .= 'char_length INT(11) NOT NULL, ';
            $db_query .= 'INDEX id_index (id)';
            $db_query .= ')';
            if ($db->query($db_query) === FALSE) { die("FASTA_to_db: checkpoint 3"); }
          } // end if
        } // end if
        $query = 'INSERT INTO '.$obj->table.' (';
        $query .= 'accession, defline, sequence, char_length';
        $query .= ') VALUES ';
        foreach ($obj->data as $key => $value) {
          $query .= '("'.$value->accession.'", "'.$value->defline.'", "'.$value->sequence.'", '.$value->char_length.'), ';
        } // end foreach
        $query = rtrim($query, ", ");
        if ($db->query($query) === FALSE) { die("FASTA_to_db: Checkpoint 4"); }
        $db_query = 'SELECT * FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE table_metadata SET ';
          $query .= 'records = "'.$obj->num_records   .'", ';
          $query .=  'userID = "'.$user['id']         .'", ';
          $query .=    'year = "'.$timestamp['year']  .'", ';
          $query .=     'day = "'.$timestamp['day']   .'", ';
          $query .=    'hour = "'.$timestamp['hour']  .'", ';
          $query .=  'minute = "'.$timestamp['minute'].'", ';
          $query .=  'second = "'.$timestamp['second'].'" ';
          $query .= 'WHERE id = "'.$obj->table.'"';
          if ($db->query($query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("update_metadata: checkpoint 2"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$db_record->id.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end if
        else {
          $db_query  = 'INSERT INTO table_metadata (id, records, userID, year, day, hour, minute, second) ';
          $db_query .= 'VALUES (';
          $db_query .= '"'.$obj->table.'", ';
          $db_query .= '"'.$obj->num_records.'", ';
          $db_query .= '"'.$user['id'].'", ';
          $db_query .= '"'.$timestamp['year'].'", ';
          $db_query .= '"'.$timestamp['day'].'", ';
          $db_query .= '"'.$timestamp['hour'].'", ';
          $db_query .= '"'.$timestamp['minute'].'", ';
          $db_query .= '"'.$timestamp['second'].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("update_metadata: checkpoint 3"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$obj->table.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
        // close the database
        $db->close();
        break;
      } // end case
      //////////////////////////////////////////////////////////////////
      case "FASTA_to_cds_db": {
        if (is_database_permitted($obj)) {
          update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { die("FASTA_to_cds_db: checkpoint 1"); }
        } // end if
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT COUNT(*) ';
          $db_query .= 'FROM information_schema.tables ';
          $db_query .= 'WHERE table_schema = "'.$obj->database.'" ';
          $db_query .= 'AND table_name = "'.$obj->table.'"';
          $db_result = $db->query($db_query);
          $db_record = $db_result->fetch_array();
          if (!$db_record[0]) {
            $db_query  = 'CREATE TABLE '.$obj->table.' (';
            $db_query .= 'id INT(11) AUTO_INCREMENT, ';
            $db_query .= 'accession VARCHAR(512) NOT NULL, ';
            $db_query .= 'defline VARCHAR(512) NOT NULL, ';
            $db_query .= 'sequence LONGTEXT NOT NULL, ';
            $db_query .= 'gene VARCHAR(512) NOT NULL, ';
            $db_query .= 'geneID VARCHAR(512) NOT NULL, ';
            $db_query .= 'protein VARCHAR(512) NOT NULL, ';
            $db_query .= 'proteinID VARCHAR(512) NOT NULL, ';
            $db_query .= 'alignment_record LONGTEXT NOT NULL, ';
            $db_query .= 'location LONGTEXT NOT NULL, ';
            $db_query .= 'char_length INT(11) NOT NULL, ';
            $db_query .= 'INDEX id_index (id)';
            $db_query .= ')';
            if ($db->query($db_query) === FALSE) { die("FASTA_to_cds_db: checkpoint 2"); }
          } // end if
        } // end if
        $query = 'INSERT INTO '.$obj->table.' (';
        $query .= 'accession, defline, sequence, gene, geneID, protein, proteinID, location, char_length';
        $query .= ') VALUES ';
        foreach ($obj->data as $key => $value) {
          $query .= '(';
          $query .= '"'.$value->accession.'", ';
          $query .= '"'.$value->defline.'", ';
          $query .= '"'.$value->sequence.'", ';
          $query .= '"'.$value->gene.'", ';
          $query .= '"'.substr($value->db_xref, 7).'", ';
          $query .= '"'.$value->protein.'", ';
          $query .= '"'.$value->proteome_id.'", ';
          $query .= '"'.$value->location.'", ';
          $query .= $value->char_length;
          $query .= ')';
          if ($key < (sizeof($obj->data) - 1)) { $query .= ', '; }
        } // end foreach
        if ($db->query($query) === FALSE) { die("FASTA_to_cds_db: checkpoint 3"); }
        // close the database
        $db->close();
        break;
      } // end case
      //////////////////////////////////////////////////////////////////
      case "insert_alignment_record": {
        if (is_database_permitted($obj)) {
          update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { die("insert_alignment_record: checkpoint 1"); }
        } // end if
        $db_query  = 'SELECT COUNT(*) ';
        $db_query .= 'FROM information_schema.tables ';
        $db_query .= 'WHERE table_schema = "elements_db" ';
        $db_query .= 'AND table_name = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        $db_record = $db_result->fetch_array();
        if (!$db_record[0]) {
          $db_query  = 'CREATE TABLE '.$obj->table.' (';
          $db_query .= 'id INT(11) AUTO_INCREMENT PRIMARY KEY, ';
          $db_query .= 'organism_name VARCHAR(512) NOT NULL, ';
          $db_query .= 'element_type VARCHAR(256), ';
          $db_query .= 'elementID VARCHAR(256), ';
          $db_query .= 'gene_name VARCHAR(512), ';
          $db_query .= 'geneID VARCHAR(256), ';
          $db_query .= 'defline LONGTEXT, ';
          $db_query .= 'alignment_record LONGTEXT, ';
          $db_query .= 'INDEX id_index (id)';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("insert_alignment_record: checkpoint 2"); }
        } // end if
        $record = $obj->data[0];
        $db_query  = 'INSERT INTO '.$obj->table.' (';
        $db_query .= 'organism_name, ';
        $db_query .= 'element_type, ';
        $db_query .= 'elementID, ';
        $db_query .= 'gene_name, ';
        $db_query .= 'geneID, ';
        $db_query .= 'defline, ';
        $db_query .= 'alignment_record';
        $db_query .= ') VALUES (';
        $db_query .= '?, ?, ?, ?, ?, ?, ?';
        $db_query .= ')';
        $stmt = $db->prepare($db_query);
        $stmt->bind_param("sssssss",
          $record->organism_name,
          $record->element_type,
          $record->elementID,
          $record->gene_name,
          $record->geneID,
          $record->defline,
          json_encode($record->alignment_record)
        );
        $stmt->execute();
        $stmt->close();
        $db_query  = 'SELECT records FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        $db_record = $db_result->fetch_object();
        $db_query  = 'UPDATE table_metadata SET records = "'.($db_record->records + 1).'" WHERE id = "'.$obj->table.'"';
        if ($db->query($db_query) === FALSE) { die("insert_alignment_record: checkpoint 3"); }
        // close the database
        $db->close();
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "update_alignment_record": {
        if (is_database_permitted($obj)) {
          update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { die("update_alignment_record: checkpoint 1"); }
        } // end if
        $record = $obj->data[0];
        $stmt = $db->prepare('UPDATE '.$obj->table.' SET alignment_record = ? WHERE id = "'.$record->id.'"');
        $stmt->bind_param("s", json_encode($record->alignment_record));
        $stmt->execute();
        $stmt->close();
        // close the database
        $db->close();
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "update_metadata": {
        $obj->command = "";
        $obj->status = 'success';
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { $obj->status = 'failure'; echo json_encode($obj); die("update_metadata: checkpoint 1"); }
        } // end if
        else { die("Innapropriate database requested."); }
        $db_query = 'SELECT * FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE table_metadata SET ';
          $query .= 'records = "'.$obj->num_records   .'", ';
          $query .=  'userID = "'.$user['id']         .'", ';
          $query .=    'year = "'.$timestamp['year']  .'", ';
          $query .=     'day = "'.$timestamp['day']   .'", ';
          $query .=    'hour = "'.$timestamp['hour']  .'", ';
          $query .=  'minute = "'.$timestamp['minute'].'", ';
          $query .=  'second = "'.$timestamp['second'].'" ';
          $query .= 'WHERE id = "'.$obj->table.'"';
          if ($db->query($query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("update_metadata: checkpoint 2"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$db_record->id.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end if
        else {
          $db_query  = 'INSERT INTO table_metadata (id, records, userID, year, day, hour, minute, second) ';
          $db_query .= 'VALUES (';
          $db_query .= '"'.$obj->table.'", ';
          $db_query .= '"'.$obj->num_records.'", ';
          $db_query .= '"'.$user['id'].'", ';
          $db_query .= '"'.$timestamp['year'].'", ';
          $db_query .= '"'.$timestamp['day'].'", ';
          $db_query .= '"'.$timestamp['hour'].'", ';
          $db_query .= '"'.$timestamp['minute'].'", ';
          $db_query .= '"'.$timestamp['second'].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("update_metadata: checkpoint 3"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$obj->table.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
        $db->close();
        echo json_encode($obj);
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "xspecies_to_db": {
        $obj->command = "";
        $obj->status = "success";
        if (is_database_permitted($obj)) {
          data_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { $obj->status = "failure"; echo json_encode($obj); die("xspecies_to_db: checkpoint 1"); }
        } // end if
        else { die("xspecies_to_db: checkpoint 2"); }
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT COUNT(*) ';
          $db_query .= 'FROM information_schema.tables ';
          $db_query .= 'WHERE table_schema = "xspecies_db" ';
          $db_query .= 'AND table_name = "'.$obj->table.'"';
          $db_result = $db->query($db_query);
          $db_record = $db_result->fetch_array();
          if (!$db_record[0]) {
            $db_query  = 'CREATE TABLE '.$obj->table.' (';
            $db_query .= 'id INT(11), ';
            $db_query .= 'map LONGTEXT NOT NULL, ';
            $db_query .= 'INDEX id_index (id)';
            $db_query .= ')';
            if ($db->query($db_query) === FALSE) { $obj->status = 'failure'; echo json_encode($obj); die("xspecies_to_db: checkpoint 3"); }
          } // end if
        } // end if
        $query = 'INSERT INTO '.$obj->table.' (id, map) VALUES ';
        foreach ($obj->data as $key => $value) {
          $query .= '("'.$value->id.'", "'.$value->map.'")';
          if ($key < (sizeof($obj->data) - 1)) { $query .= ', '; }
        } // end foreach
        if ($db->query($query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("xspecies_to_db: checkpoint 4"); }
        // close the database
        $db->close();
        echo json_encode($obj);
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      default: { break; }
      ////////////////////////////////////////////////////////////////////
    } // end switch
  } // end if
} // end if
///////////////////////////////////////////////////////////////////////////////
// MYSQL CONNECTION ///////////////////////////////////////////////////////////
// close the database connection
$mysqli->close();
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function is_database_permitted($obj) {
  $permitted = FALSE;
  $whitelist = array(
    "cds_db",
    "cds_index_db",
    "elements_db",
    "genome_db",
    "genome_index_db",
    "proteome_db",
    "proteome_index_db",
    "xspecies_db"
  );
  $moirai_whitelist = array("mayne");
  for ($i = 0; $i < count($whitelist); $i++) {
    if ($obj->database == $whitelist[$i]) { $permitted = TRUE; }
  } // end for loop
  if ($obj->database == "moirai_db") {
    for ($i = 0; $i < count($moirai_whitelist); $i++) {
      if ($obj->table == $moirai_whitelist[$i]) { $permitted = TRUE; }
    } // end for loop
  } // end if
  return $permitted;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function is_valid_url($url) {
  return preg_match('|^http(s)?://[a-z0-9-]+(.[a-z0-9-]+)*(:[0-9]+)?(/.*)?$|i', $url);
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
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
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_metadata_datetime($database, $id, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password) {
  $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $database);
  if (mysqli_connect_errno()) { die("update_metadata_datetime: checkpoint 1"); }
  $db_query = 'SELECT * FROM table_metadata WHERE id = "'.$id.'"';
  $db_result = $db->query($db_query);
  if ($db_result->num_rows) {
    $db_record = $db_result->fetch_object();
    $db_query = 'UPDATE table_metadata SET userID = "'.$user['id'].'", ';
    $db_query .= 'year = "'.$timestamp['year'].'", ';
    $db_query .= 'day = "'.$timestamp['day'].'", ';
    $db_query .= 'hour = "'.$timestamp['hour'].'", ';
    $db_query .= 'minute = "'.$timestamp['minute'].'", ';
    $db_query .= 'second = "'.$timestamp['second'].'" ';
    $db_query .= 'WHERE id = "'.$id.'"';
    if ($db->query($db_query) === FALSE) { die("update_metadata_datetime: checkpoint 3"); }
  } // end if
  else {
    $db_query  = 'INSERT INTO table_metadata (id, userID, year, day, hour, minute, second) ';
    $db_query .= 'VALUES (';
    $db_query .= '"'.$id.'", ';
    $db_query .= '"'.$user['id'].'", ';
    $db_query .= '"'.$timestamp['year'].'", ';
    $db_query .= '"'.$timestamp['day'].'", ';
    $db_query .= '"'.$timestamp['hour'].'", ';
    $db_query .= '"'.$timestamp['minute'].'", ';
    $db_query .= '"'.$timestamp['second'].'"';
    $db_query .= ')';
    if ($db->query($db_query) === FALSE) { die("update_metadata_datetime: checkpoint 4"); }
  } // end else
  $db->close();
  update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password) {
  if (isset($user['id']) && !empty($user['id'])) {
    $db = new mysqli($mysql_host, $mysql_user, $mysql_password, "moirai_db");
    if (mysqli_connect_errno()) { die("update_user_computer_time: checkpoint 1"); }
    $options = array();
    if (isset($user['options'])) { $options = json_decode($user['options'], TRUE); }
    if (!isset($options['computer_timestamp'])) {
      $options['computer_timestamp'] = array();
      $options['computer_timestamp']['year']   = $timestamp['year'];
      $options['computer_timestamp']['day']    = $timestamp['day'];
      $options['computer_timestamp']['hour']   = $timestamp['hour'];
      $options['computer_timestamp']['minute'] = $timestamp['minute'];
      $options['computer_timestamp']['second'] = $timestamp['second'];
    } // end if
    if (!isset($options['computer_seconds'])) { $options['computer_seconds'] = 0; }
    if (!isset($options['computer_minutes'])) { $options['computer_minutes'] = 0; }
    if (!isset($options['computer_hours']  )) { $options['computer_hours']   = 0; }
    $delta_seconds = seconds_between_timestamps($timestamp, $options['computer_timestamp']);
    // if it's been less than a minute since the computer timestamp was updated
    // then this is still part of the same computation session
    if ($delta_seconds <= 60) {
      $options['computer_seconds'] += $delta_seconds;
      $options['computer_minutes'] += (int)floor($options['computer_seconds'] / 60);
      $options['computer_hours'  ] += (int)floor($options['computer_minutes'] / 60);
      $options['computer_seconds'] = $options['computer_seconds'] % 60;
      $options['computer_minutes'] = $options['computer_minutes'] % 60;
    } // end if
    $options['computer_timestamp']['year']   = $timestamp['year'];
    $options['computer_timestamp']['day']    = $timestamp['day'];
    $options['computer_timestamp']['hour']   = $timestamp['hour'];
    $options['computer_timestamp']['minute'] = $timestamp['minute'];
    $options['computer_timestamp']['second'] = $timestamp['second'];
    $stmt = $db->prepare('UPDATE users SET options = ? WHERE userID = "'.$user['id'].'"');
    $stmt->bind_param("s", json_encode($options));
    $stmt->execute();
    $stmt->close();
  } // end if
} // end function
///////////////////////////////////////////////////////////////////////////////
?>

<?php
///////////////////////////////////////////////////////////////////////////////
// BECAUSE DREAMHOST //////////////////////////////////////////////////////////
ini_set("pcre.jit", "0");
///////////////////////////////////////////////////////////////////////////////
if (session_status() != PHP_SESSION_ACTIVE) { session_start(); }
require realpath($_SERVER["DOCUMENT_ROOT"])."/PHP/core_speedy.php";
session_write_close();
if (!filter_var($_POST["execute"], FILTER_VALIDATE_BOOLEAN)) { die(); }
if ($user["active"]) {
  /////////////////////////////////////////////////////////////////////////////
  // VARIABLES ////////////////////////////////////////////////////////////////
  $accession      = [];
  $bounty         = "";
  $database       = "";
  $direct_command = NULL;
  $obj            = new stdClass();
  $options        = "{}";
  $organism_name  = "";
  $records        = [];
  $result         = [];
  $table          = "";
  if (isset($_POST["accession"     ]) && !empty($_POST["accession"     ])) { $accession      = json_decode($_POST["accession"], TRUE); }
  if (isset($_POST["direct_command"]) && !empty($_POST["direct_command"])) { $direct_command = $_POST["direct_command"  ]; }
  if (isset($_POST["json"          ]) && !empty($_POST["json"          ])) { $obj            = json_decode($_POST["json"]); }
  if (isset($_POST["database"      ]) && !empty($_POST["database"      ])) { $database       = $_POST["database"        ]; }
  if (isset($_POST["table"         ]) && !empty($_POST["table"         ])) { $table          = $_POST["table"           ]; }
  if (isset($_POST["organism_name" ]) && !empty($_POST["organism_name" ])) { $organism_name  = $_POST["organism_name"   ]; }
  if (isset($_POST["bounty"        ]) && !empty($_POST["bounty"        ])) { $bounty         = $_POST["bounty"          ]; }
  for ($i = 0; $i < count($accession); $i++) {
    $accession[$i] = strip_tags($accession[$i]);
    $accession[$i] = filter_var($accession[$i], FILTER_SANITIZE_STRING);
    $accession[$i] = $mysqli->real_escape_string($accession[$i]);
  }
  if ($bounty        ) { $bounty         = strip_tags($bounty        ); $bounty         = filter_var($bounty,         FILTER_SANITIZE_STRING); }
  if ($database      ) { $database       = strip_tags($database      ); $database       = filter_var($database,       FILTER_SANITIZE_STRING); }
  if ($direct_command) { $direct_command = strip_tags($direct_command); $direct_command = filter_var($direct_command, FILTER_SANITIZE_STRING); }
  if ($obj->command  ) { $obj->command   = strip_tags($obj->command  ); $obj->command   = filter_var($obj->command,   FILTER_SANITIZE_STRING); }
  if ($obj->database ) { $obj->database  = strip_tags($obj->database ); $obj->database  = filter_var($obj->database,  FILTER_SANITIZE_STRING); }
  if ($obj->filename ) { $obj->filename  = strip_tags($obj->filename ); $obj->filename  = filter_var($obj->filename,  FILTER_SANITIZE_STRING); }
  if ($obj->source   ) { $obj->source    = strip_tags($obj->source   ); $obj->source    = filter_var($obj->source,    FILTER_SANITIZE_URL   ); }
  if ($obj->table    ) { $obj->table     = strip_tags($obj->table    ); $obj->table     = filter_var($obj->table,     FILTER_SANITIZE_STRING); }
  if ($obj->target   ) { $obj->target    = strip_tags($obj->target   ); $obj->target    = filter_var($obj->target,    FILTER_SANITIZE_URL   ); }
  if ($organism_name ) { $organism_name  = strip_tags($organism_name ); $organism_name  = filter_var($organism_name,  FILTER_SANITIZE_STRING); }
  if ($table         ) { $table          = strip_tags($table         ); $table          = filter_var($table,          FILTER_SANITIZE_STRING); }
  if (!sanitized($obj->table)) { die("Improperly formatted table name."); }
  if ($obj->options) { $options = json_encode($obj->options); }
  $database       = $mysqli->real_escape_string($database);
  $table          = $mysqli->real_escape_string($table);
  $organism_name  = $mysqli->real_escape_string($organism_name);
  $bounty         = $mysqli->real_escape_string($bounty);
  ////////////////////////////////////////////////////////////////////////
  if ($direct_command) {
    switch($direct_command) {
      ////////////////////////////////////////////////////////////////////
      case "check_bounty": {
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $database);
        if (mysqli_connect_errno()) { die("check_bounty: checkpoint 1"); }
        // does the metadata table exist?
        $query = 'SELECT SQL_NO_CACHE * FROM table_metadata WHERE id = "'.$table.'"';
        $query_result = $db->query($query);
        if ($query_result->num_rows >= 1) {
          $metadata = $query_result->fetch_object();
          // is the bioaction complete?
          $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) FROM '.$table;
          $db_result = $db->query($db_query);
          if ($query_result->num_rows >= 1) {
            $db_record = $db_result->fetch_array();
            if ($db_record["COUNT(*)"] >= $metadata->records) {
              // does this user own the record?
              if ($metadata->userID == $user["id"]) {
                $query = 'SELECT SQL_NO_CACHE * FROM bounties WHERE organism_name = "'.$organism_name.'"';
                $query_result = $mysqli->query($query);
                $bounties = $query_result->fetch_array();
                // claim the bounty
                if ($bounties[$bounty]) {
                  $user_options = json_decode($user["options"], TRUE);
                  if (!$user_options["tokens"]) { $user_options["tokens"] = 0; }
                  $user_options["tokens"] += $bounties[$bounty];
                  $stmt = $mysqli->prepare('UPDATE users SET options = ? WHERE userID = "'.$user["id"].'"');
                  $stmt->bind_param("s", json_encode($user_options));
                  $stmt->execute();
                  $stmt->close();
                  $query = 'UPDATE bounties SET '.$bounty.' = "0" WHERE organism_name = "'.$organism_name.'"';
                  if ($mysqli->query($query) === FALSE) { die("check_bounty: checkpoint 2"); }
                } // end if
              } // end if
            } // end if
          } // end if
        } // end if
        $db->close();
        break;
      } // end case
      /////////////////////////////////////////////////////////////////////////
      case "get_contig_map": {
        $db = new mysqli($mysql_host, $mysql_user, $mysql_password, "genome_db");
        if (mysqli_connect_errno()) { die("[]"); }
        for ($i = 0; $i < count($accession); $i++) {
          $query = 'SELECT SQL_NO_CACHE id, char_length FROM '.$table.' WHERE accession = "'.$accession[$i].'" ORDER BY id ASC';
          $query_result = $db->query($query);
          $records = [];
          while ($query_record = $query_result->fetch_object()) {
            $records[] = $query_record;
          } // end while
          $result[] = $records;
        } // end if
        echo json_encode($result);
        $db->close();
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
        $obj->status = "success";
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { $obj->status = "failure"; echo json_encode($obj); die("age_estimate_to_db: checkpoint 1"); }
        } // end if
        else { die("age_estimate_to_db: checkpoint 2"); }
        $db_query = 'SELECT SQL_NO_CACHE * FROM mayne WHERE mayne = "'.$obj->organism_name.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE mayne SET ';
          $query .= 'estimate = "'.$obj->estimate      .'", ';
          $query .=   'userID = "'.$user["id"]         .'", ';
          $query .=     'year = "'.$timestamp["year"]  .'", ';
          $query .=      'day = "'.$timestamp["day"]   .'", ';
          $query .=     'hour = "'.$timestamp["hour"]  .'", ';
          $query .=   'minute = "'.$timestamp["minute"].'", ';
          $query .=   'second = "'.$timestamp["second"].'" ';
          $query .= 'WHERE organism_name = "'.$obj->organism_name.'"';
          if ($db->query($query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("age_estimate_to_db: checkpoint 3"); }
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
          $db_query .= '"'.$user["id"].'", ';
          $db_query .= '"'.$timestamp["year"].'", ';
          $db_query .= '"'.$timestamp["day"].'", ';
          $db_query .= '"'.$timestamp["hour"].'", ';
          $db_query .= '"'.$timestamp["minute"].'", ';
          $db_query .= '"'.$timestamp["second"].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("age_estimate_to_db: checkpoint 4"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE mayne SET options = ? WHERE organism_name = "'.$obj->organism_name.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
        echo json_encode($obj);
        $db->close();
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "FASTA_to_db": {
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { die("FASTA_to_db: checkpoint 1"); }
        } // end if
        else { die("FASTA_to_db: checkpoint 2"); }
        update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) ';
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
        $db_query = 'SELECT SQL_NO_CACHE * FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE table_metadata SET ';
          $query .= 'records = "'.$obj->num_records   .'", ';
          $query .=  'userID = "'.$user["id"]         .'", ';
          $query .=    'year = "'.$timestamp["year"]  .'", ';
          $query .=     'day = "'.$timestamp["day"]   .'", ';
          $query .=    'hour = "'.$timestamp["hour"]  .'", ';
          $query .=  'minute = "'.$timestamp["minute"].'", ';
          $query .=  'second = "'.$timestamp["second"].'" ';
          $query .= 'WHERE id = "'.$obj->table.'"';
          if ($db->query($query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("FASTA_to_db: checkpoint 2"); }
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
          $db_query .= '"'.$user["id"].'", ';
          $db_query .= '"'.$timestamp["year"].'", ';
          $db_query .= '"'.$timestamp["day"].'", ';
          $db_query .= '"'.$timestamp["hour"].'", ';
          $db_query .= '"'.$timestamp["minute"].'", ';
          $db_query .= '"'.$timestamp["second"].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("FASTA_to_db: checkpoint 3"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$obj->table.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
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
        else { die("FASTA_to_cds_db: checkpoint 2"); }
        update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) ';
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
            if ($db->query($db_query) === FALSE) { die("FASTA_to_cds_db: checkpoint 3"); }
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
        if ($db->query($query) === FALSE) { die("FASTA_to_cds_db: checkpoint 4"); }
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
        $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) ';
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
          if ($db->query($db_query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("insert_alignment_record: checkpoint 2"); }
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
        $db_query  = 'SELECT SQL_NO_CACHE records FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        $db_record = $db_result->fetch_object();
        $db_query  = 'UPDATE table_metadata SET records = "'.($db_record->records + 1).'" WHERE id = "'.$obj->table.'"';
        if ($db->query($db_query) === FALSE) { die("insert_alignment_record: checkpoint 3"); }
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
        $db->close();
        break;
      } // end case
      ////////////////////////////////////////////////////////////////////
      case "update_metadata": {
        $obj->command = "";
        $obj->status = "success";
        if (is_database_permitted($obj)) {
          $db = new mysqli($mysql_host, $mysql_user, $mysql_password, $obj->database);
          if (mysqli_connect_errno()) { $obj->status = "failure"; echo json_encode($obj); die("update_metadata: checkpoint 1"); }
        } // end if
        else { die("Innapropriate database requested."); }
        update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
        $db_query = 'SELECT SQL_NO_CACHE * FROM table_metadata WHERE id = "'.$obj->table.'"';
        $db_result = $db->query($db_query);
        if ($db_result->num_rows) {
          $db_record = $db_result->fetch_object();
          $query  = 'UPDATE table_metadata SET ';
          $query .= 'records = "'.$obj->num_records   .'", ';
          $query .=  'userID = "'.$user["id"]         .'", ';
          $query .=    'year = "'.$timestamp["year"]  .'", ';
          $query .=     'day = "'.$timestamp["day"]   .'", ';
          $query .=    'hour = "'.$timestamp["hour"]  .'", ';
          $query .=  'minute = "'.$timestamp["minute"].'", ';
          $query .=  'second = "'.$timestamp["second"].'" ';
          $query .= 'WHERE id = "'.$obj->table.'"';
          if ($db->query($query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("update_metadata: checkpoint 2"); }
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
          $db_query .= '"'.$user["id"].'", ';
          $db_query .= '"'.$timestamp["year"].'", ';
          $db_query .= '"'.$timestamp["day"].'", ';
          $db_query .= '"'.$timestamp["hour"].'", ';
          $db_query .= '"'.$timestamp["minute"].'", ';
          $db_query .= '"'.$timestamp["second"].'"';
          $db_query .= ')';
          if ($db->query($db_query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("update_metadata: checkpoint 3"); }
          if ($options) {
            $stmt = $db->prepare('UPDATE table_metadata SET options = ? WHERE id = "'.$obj->table.'"');
            $stmt->bind_param("s", $options);
            $stmt->execute();
            $stmt->close();
          } // end if
        } // end else
        echo json_encode($obj);
        $db->close();
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
        update_metadata_datetime($obj->database, $obj->table, $timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
        if (!$obj->num_uploaded) {
          $db_query  = 'SELECT SQL_NO_CACHE COUNT(*) ';
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
            if ($db->query($db_query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("xspecies_to_db: checkpoint 3"); }
          } // end if
        } // end if
        $query = 'INSERT INTO '.$obj->table.' (id, map) VALUES ';
        foreach ($obj->data as $key => $value) {
          $query .= '("'.$value->id.'", "'.$value->map.'")';
          if ($key < (sizeof($obj->data) - 1)) { $query .= ', '; }
        } // end foreach
        if ($db->query($query) === FALSE) { $obj->status = "failure"; echo json_encode($obj); die("xspecies_to_db: checkpoint 4"); }
        echo json_encode($obj);
        $db->close();
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
  $db_query = 'SELECT SQL_NO_CACHE * FROM table_metadata WHERE id = "'.$id.'"';
  $db_result = $db->query($db_query);
  if ($db_result->num_rows) {
    $db_record = $db_result->fetch_object();
    $db_query = 'UPDATE table_metadata SET userID = "'.$user["id"].'", ';
    $db_query .= 'year = "'.$timestamp["year"].'", ';
    $db_query .= 'day = "'.$timestamp["day"].'", ';
    $db_query .= 'hour = "'.$timestamp["hour"].'", ';
    $db_query .= 'minute = "'.$timestamp["minute"].'", ';
    $db_query .= 'second = "'.$timestamp["second"].'" ';
    $db_query .= 'WHERE id = "'.$id.'"';
    if ($db->query($db_query) === FALSE) { die("update_metadata_datetime: checkpoint 3"); }
  } // end if
  else {
    $db_query  = 'INSERT INTO table_metadata (id, userID, year, day, hour, minute, second) ';
    $db_query .= 'VALUES (';
    $db_query .= '"'.$id.'", ';
    $db_query .= '"'.$user["id"].'", ';
    $db_query .= '"'.$timestamp["year"].'", ';
    $db_query .= '"'.$timestamp["day"].'", ';
    $db_query .= '"'.$timestamp["hour"].'", ';
    $db_query .= '"'.$timestamp["minute"].'", ';
    $db_query .= '"'.$timestamp["second"].'"';
    $db_query .= ')';
    if ($db->query($db_query) === FALSE) { die("update_metadata_datetime: checkpoint 4"); }
  } // end else
  $db->close();
  update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password);
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_user_computer_time($timestamp, $user, $mysql_host, $mysql_user, $mysql_password) {
  if (isset($user["id"]) && !empty($user["id"])) {
    $db = new mysqli($mysql_host, $mysql_user, $mysql_password, "moirai_db");
    if (mysqli_connect_errno()) { die("update_user_computer_time: checkpoint 1"); }
    $user_options = array();
    if (isset($user["options"])) { $user_options = json_decode($user["options"], TRUE); }
    if (!isset($user_options["computer_timestamp"])) {
      $user_options["computer_timestamp"] = array();
      $user_options["computer_timestamp"]["year"]   = $timestamp["year"];
      $user_options["computer_timestamp"]["day"]    = $timestamp["day"];
      $user_options["computer_timestamp"]["hour"]   = $timestamp["hour"];
      $user_options["computer_timestamp"]["minute"] = $timestamp["minute"];
      $user_options["computer_timestamp"]["second"] = $timestamp["second"];
    } // end if
    if (!isset($user_options["computer_seconds"])) { $user_options["computer_seconds"] = 0; }
    if (!isset($user_options["computer_minutes"])) { $user_options["computer_minutes"] = 0; }
    if (!isset($user_options["computer_hours"]  )) { $user_options["computer_hours"]   = 0; }
    $delta_seconds = seconds_between_timestamps($timestamp, $user_options["computer_timestamp"]);
    // if it's been less than a minute since the computer timestamp was updated
    // then this is still part of the same computation session
    if ($delta_seconds <= 60) {
      $user_options["computer_seconds"] += $delta_seconds;
      $user_options["computer_minutes"] += (int)floor($user_options["computer_seconds"] / 60);
      $user_options["computer_hours"  ] += (int)floor($user_options["computer_minutes"] / 60);
      $user_options["computer_seconds"] = $user_options["computer_seconds"] % 60;
      $user_options["computer_minutes"] = $user_options["computer_minutes"] % 60;
    } // end if
    $user_options["computer_timestamp"]["year"]   = $timestamp["year"];
    $user_options["computer_timestamp"]["day"]    = $timestamp["day"];
    $user_options["computer_timestamp"]["hour"]   = $timestamp["hour"];
    $user_options["computer_timestamp"]["minute"] = $timestamp["minute"];
    $user_options["computer_timestamp"]["second"] = $timestamp["second"];
    $stmt = $db->prepare('UPDATE users SET options = ? WHERE userID = "'.$user["id"].'"');
    $stmt->bind_param("s", json_encode($user_options));
    $stmt->execute();
    $stmt->close();
    $db->close();
  } // end if
} // end function
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function pad_timestamp($timestamp) {
  $hour   = "00";
  $minute = "00";
  $second = "00";
  $timestamp['year']   = strval($timestamp['year']);
  $timestamp['day']    = strval($timestamp['day']);
  $timestamp['hour']   = strval($timestamp['hour']);
  $timestamp['minute'] = strval($timestamp['minute']);
  $timestamp['second'] = strval($timestamp['second']);
  if (strlen($timestamp['hour'])   == 1) { $hour   = '0'.$timestamp['hour'  ]; $timestamp['hour']   = $hour;   }
  if (strlen($timestamp['minute']) == 1) { $minute = '0'.$timestamp['minute']; $timestamp['minute'] = $minute; }
  if (strlen($timestamp['second']) == 1) { $second = '0'.$timestamp['second']; $timestamp['second'] = $second; }
  return $timestamp;
} // end function
///////////////////////////////////////////////////////////////////////////////
function seconds_between_timestamps($timestamp1, $timestamp2) {
  $dateTimeObj1 = timestamp_to_dateTimeObj($timestamp1);
  $dateTimeObj2 = timestamp_to_dateTimeObj($timestamp2);
  if (!$dateTimeObj1) { return ''; }
  if (!$dateTimeObj2) { return ''; }
  $difference = $dateTimeObj1->diff($dateTimeObj2);
  $interval  = (float)$difference->format('%y') * 31540000 ;
  $interval += (float)$difference->format('%z') * 86400;
  $interval += (float)$difference->format('%h') * 3600;
  $interval += (float)$difference->format('%i') * 60;
  $interval += (float)$difference->format('%s');
  return $interval;
} // end if
///////////////////////////////////////////////////////////////////////////////
function timestamp_to_dateTimeObj($timestamp) {
  $timestamp = pad_timestamp($timestamp);
  $newDateTime = $timestamp['year'].'-'.$timestamp['day'].' '.$timestamp['hour'].':'.$timestamp['minute'].':'.$timestamp['second'];
  $dateTimeObj = DateTime::createFromFormat('Y-z H:i:s', $newDateTime);
  return $dateTimeObj;
} // end function
///////////////////////////////////////////////////////////////////////////////
?>

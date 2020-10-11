<?php if (session_status() != PHP_SESSION_ACTIVE) session_start();
require_once realpath($_SERVER["DOCUMENT_ROOT"])."/PHP/core_speedy.php";
session_write_close();
if (!filter_var($_POST["execute"], FILTER_VALIDATE_BOOLEAN)) { die(); }
$command = "";
$organism_name = "";
$record = new stdClass();
if (isset($_POST["command"      ]) && !empty($_POST["command"      ])) { $command       = $_POST["command"]; }
if (isset($_POST["organism_name"]) && !empty($_POST["organism_name"])) { $organism_name = $_POST["organism_name"]; }
if (isset($_POST["record"       ]) && !empty($_POST["record"       ])) { $record        = json_decode($_POST["record"], FALSE); }
if (!$record->options) { $record->options = new stdClass(); }
if ($user["active"]) {
  switch($command) {
    case "save_lifespan_estimator_record": {
      $query = 'SELECT SQL_NO_CACHE id FROM mayne WHERE organism_name = "'.$mysqli->real_escape_string($organism_name).'"';
      $query_result = $mysqli->query($query);
      if ($query_result->num_rows) {
        $query = 'UPDATE mayne SET ';
        $query .= "estimate = ?, ";
        $query .= "records = ?, ";
        $query .= "userID = ?, ";
        $query .= "year = ?, ";
        $query .= "day = ?, ";
        $query .= "hour = ?, ";
        $query .= "minute = ?, ";
        $query .= "second = ?, ";
        $query .= "options = ? ";
        $query .= 'WHERE organism_name = "'.$mysqli->real_escape_string($organism_name).'"';
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("disiiiiis",
          $record->options->estimate,
          $record->num_uploaded,
          $user["id"],
          $timestamp["year"],
          $timestamp["day"],
          $timestamp["hour"],
          $timestamp["minute"],
          $timestamp["second"],
          json_encode($record->options)
        );
        $stmt->execute();
        $stmt->close();
      } // end if
      else {
        $query = 'INSERT INTO mayne (id, organism_name, estimate, records, options) ';
        $query .= 'VALUES (?, ?, ?, ?, ?)';
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("ssdis",
          GUIDv4(),
          $organism_name,
          $record->options->estimate,
          $record->num_uploaded,
          json_encode($record->options)
        );
        $stmt->execute();
        $stmt->close();
      } // end else
      break;
    } // end case
    default: { break; }
  } // end switch
  ////////////////////////////////////////////////////////////////////////
  // RETURN //////////////////////////////////////////////////////////////
} // end if
///////////////////////////////////////////////////////////////////////////////
// CLOSE MYSQL CONNECTION /////////////////////////////////////////////////////
$mysqli->close();
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

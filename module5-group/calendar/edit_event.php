<?php

session_start();

header("Content-Type: application/json"); // Since we are sending a JSON response here (not an HTML document), set the MIME Type to application/json

//Because you are posting the data via fetch(), php has to retrieve it elsewhere.
$json_str = file_get_contents('php://input');
//This will store the data into an associative array
$json_obj = json_decode($json_str, true);

//Variables can be accessed as such:
$event_id = $json_obj['event_id'];
$new_title = $json_obj['new_title'];
$new_year = $json_obj['new_year'];
$new_month = $json_obj['new_month'];
$new_day = $json_obj['new_day'];
$new_hour = $json_obj['new_hour'];
$new_minute = $json_obj['new_minute'];
$new_category = $json_obj['new_category'];
$new_share = $json_obj['new_share'];
$token = $json_obj['token'];

if (!hash_equals($_SESSION['token'], $token)) {
	die("Request forgery detected");
}

// Check to see if the username and password are valid.  (You learned how to do this in Module 3.)
require('database.php');

$stmt = $mysqli->prepare("UPDATE events SET event_title = ?, year = ?, month = ?, day = ?, hour = ?, minute = ?, category = ? , share_event = ? WHERE event_id = ?");

if (!$stmt) {
	echo json_encode(
		array(
			"success" => false
		)
	);
	exit;
}

//change name of event if share/not share
if ($new_share == 0) {
	$search = "(share) ";
	$new_title = str_replace($search, "", $new_title);
}
if ($new_share == 1) {
	$search = "(share) ";
	$new_title = str_replace($search, "", $new_title);
	$new_title = "(share) " . $new_title;
}

$stmt->bind_param('siiiiisii', $new_title, $new_year, $new_month, $new_day, $new_hour, $new_minute, $new_category, $new_share, $event_id);
$stmt->execute();
$stmt->close();

echo json_encode(
	array(
		"success" => true
	)
);
exit;

?>
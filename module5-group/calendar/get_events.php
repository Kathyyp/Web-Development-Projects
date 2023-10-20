<?php
// get events

header("Content-Type: application/json"); // Since we are sending a JSON response here (not an HTML document), set the MIME Type to application/json
ini_set("session.cookie_httponly", 1);
session_start();

//Because you are posting the data via fetch(), php has to retrieve it elsewhere.
$json_str = file_get_contents('php://input');
//This will store the data into an associative array
$json_obj = json_decode($json_str, true);

//Variables can be accessed as such:
$month = $json_obj['month'];
$year = $json_obj['year'];
$username = $_SESSION['username'];

$token = $json_obj['token'];

if (!hash_equals($_SESSION['token'], $token)) {
    die("Request forgery detected");
}


require 'database.php';
//get private event
$stmt = $mysqli->prepare("SELECT event_id, event_title, day, hour, minute, category FROM events WHERE month = ? and year = ? and username = ? and share_event = 0");
if (!$stmt) {
    printf("Query Prep Failed: %s\n", $mysqli->error);
    exit;
}
$ids = array();
$days = array();
$names = array();
$hours = array();
$minutes = array();
$categories = array();

$stmt->bind_param('iis', $month, $year, $username);
$stmt->execute();
$stmt->bind_result($id, $name, $day, $hour, $minute, $category);
while ($stmt->fetch()) {
    //htmlentities (persistent XSS)
    $ids[] = htmlentities($id);
    $days[] = htmlentities($day);
    $names[] = htmlentities($name);
    $hours[] = htmlentities($hour);
    $minutes[] = htmlentities($minute);
    $categories[] = htmlentities($category);
}
$stmt->close();

$stmt2 = $mysqli->prepare("SELECT event_id, event_title, day, hour, minute, category FROM events WHERE month = ? and year = ? and share_event = 1");
if (!$stmt2) {
    printf("Query Prep Failed: %s\n", $mysqli->error);
    exit;
}

$stmt2->bind_param('ii', $month, $year);
$stmt2->execute();
$stmt2->bind_result($id2, $name2, $day2, $hour2, $minute2, $category2);
$ids2 = array();
$days2 = array();
$names2 = array();
$hours2 = array();
$minutes2 = array();
$categories2 = array();
while ($stmt2->fetch()) {
    //htmlentities (persistent XSS)
    $ids2[] = htmlentities($id2);
    $days2[] = htmlentities($day2);
    $names2[] = htmlentities($name2);
    $hours2[] = htmlentities($hour2);
    $minutes2[] = htmlentities($minute2);
    $categories2[] = htmlentities($category2);
}
$ids_result = array_merge((array) $ids, $ids2);
$days_result = array_merge((array) $days, $days2);
$names_result = array_merge((array) $names, $names2);
$hours_result = array_merge((array) $hours, $hours2);
$minutes_result = array_merge((array) $minutes, $minutes2);
$categories_result = array_merge((array) $categories, $categories2);

if (count($ids_result) < 1 || $username == "guest") {
    echo json_encode(
        array(
            "success" => false
        )
    );
    exit;
} else {
    echo json_encode(
        array(
            "success" => true,
            "names" => $names_result,
            "days" => $days_result,
            "hours" => $hours_result,
            "minutes" => $minutes_result,
            "ids" => $ids_result,
            "categories" => $categories_result
        )
    );
    exit;
}
?>
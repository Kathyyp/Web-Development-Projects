<?php
ini_set("session.cookie_httponly", 1);
session_start();
if (isset($_SESSION['username'])) {
	echo json_encode(
		array(
			"success" => true
		)
	);
	exit;
} else {
	echo json_encode(
		array(
			"success" => false
		)
	);
	exit;
}
?>
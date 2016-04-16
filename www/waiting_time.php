<?php
$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "clinics";
$table_name = "sessions";

//connects
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$id = $_GET["clinic_id"];
$ave_time =0;

$sql = "SELECT AVG(CASE WHEN clinic_id=$id AND diff IS NOT NULL THEN diff END) as ave_time FROM $table_name";


if ($query = mysqli_query($conn, $sql)) {
    $ave_time_fetch = mysqli_fetch_array($query);
	$ave_time = $ave_time_fetch["ave_time"];
	
	echo $ave_time;
	
} else {
    echo 0;
}


$conn->close();
?>
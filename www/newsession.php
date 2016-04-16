<?php
$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "clinics";
$table_name = "sessions";
$clinic_id = 1;

//connects
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$sql = "SELECT MAX(idsessions) as max_id FROM $table_name";


if ($query = mysqli_query($conn, $sql)) {
    $max_id_array = mysqli_fetch_array($query);
	$maxvar = $max_id_array["max_id"]+1;
	echo "$maxvar";
	
	$sql_time_est = "SELECT * FROM sessions where idsessions=(SELECT MAX(idsessions) FROM sessions WHERE idsessions<$maxvar AND clinic_id=$clinic_id AND end IS NOT NULL)";
	
	$prev_time = 0;
	$est_time_last = 0;	
	
	if($querya = mysqli_query($conn, $sql_time_est)){
		$last_array = mysqli_fetch_array($querya);
		$prev_time = $last_array["diff"];
		$est_time_last = $last_array["est_time"];
	}
	else{
		$prev_time = 0;
		$est_time_last = 0;	
	}
	$est_time = ($prev_time/2)+($est_time_last/2);
	
	$sql_new_session = "INSERT INTO sessions (clinic_id, start, est_time) VALUES($clinic_id, NOW(), $est_time)";
	
	if (mysqli_query($conn, $sql_new_session)) {
    
	} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
	}
	
	
} else {
    echo "Error: " . mysqli_error($conn);
}


$conn->close();
?>
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

$id = $_GET["sessionid"];

$sql = "UPDATE sessions SET end=NOW() WHERE idsessions = '$id'";

if ($query = mysqli_query($conn, $sql)) {  
  
} else {
    echo "Error: " . mysqli_error($conn);
}

$conn->close();
?>
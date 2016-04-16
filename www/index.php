<!DOCTYPE html>
<html>
<head>
<script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.12.0.min.js"></script>
</head>
<body>

<script>
function addSession(){
var li = document.createElement("LI");

$.ajax({
      url:'newsession.php',
      complete: function (response) {
         var input = document.getElementById("fname");
		 var id = response.responseText;
		 li.setAttribute("id", id);
		 li.innerHTML = "<a href='#' onClick = 'removeSession("+id+");'>"+ input.value + "</a>";
		 
		 input.value = "";
      },
      error: function () {
          
      }
  });
  

document.getElementById("sessions").appendChild(li);
	
}

function removeSession(id) {
    $.ajax({
      url:'endsession.php?sessionid='+id,
      complete: function (response) {
		$("#"+id).remove();
      },
      error: function () {   
      }
  });
};
</script>

<ul id="sessions">
</ul>

Name: <input type="text" name="fname" id="fname"><br />
<input type="button" value="Add new patient" onClick="addSession()">

</body>
</html>
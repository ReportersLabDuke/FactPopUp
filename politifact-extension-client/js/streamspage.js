// JavaScript source code
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = process;
window.onload = function () {
	xhr.open("GET", "https://raw.githubusercontent.com/ReportersLabDuke/FactPopUp/master/livestream_url", true);
	xhr.send();

}

function process()
{
  if (xhr.readyState == 4) {
	var url = xhr.responseText;
    console.log(url);
	document.getElementsByTagName("iframe")[0].setAttribute("src", url);
  }
}
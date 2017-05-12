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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    var n = document.createElement("dialog");
    document.body.appendChild(n);
    var dialog = document.querySelector("dialog")
    
    message_portion = request.message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    link_portion = "/";
    image_portion = "";

    if (request.urls.length > 0) {
      link_portion = request.urls[0];
    }
     
    if (request.pictureUrls.length > 0) {
      image_portion = "<a href='" + link_portion + "' target='_blank'> <img src='" + request.pictureUrls[0] + "' height='200'> </a>";
    }
    
    dialog.innerHTML += "<a href='" + link_portion + "' target='_blank'>" + message_portion + "</a> <br/>" + image_portion + "<br/><button class='btn-primary'>Close</button>";
    dialog.querySelector("button").addEventListener("click", function() {
      dialog.close();
      dialog.parentNode.removeChild(dialog);
    });
    window.setTimeout(function () {
      var dialogToClose = document.querySelector("dialog");
      dialog.close();
      dialog.parentNode.removeChild(dialog);
    }, 15000);
    dialog.style = "position: fixed; width: 400px; height: auto; border: 1px solid rgb(51, 102, 153); padding: 10px; background-color: rgb(255, 255, 255    ); z-index: 2001; overflow: hidden; text-align: center; top: 25px; left: calc(100% - 425px);";
    dialog.show();
  });


// JavaScript source code
window.onload = function () {
    if (new Date() > new Date(2016, 9, 10)) {
        document.getElementById("vid3").removeAttribute("hidden");
        document.getElementById("vid1").setAttribute("hidden", "true");
        document.getElementById("vid2").setAttribute("hidden", "true");
        document.getElementById("container3").removeAttribute("hidden");
        document.getElementById("container1").setAttribute("hidden", "true");
        document.getElementById("container2").setAttribute("hidden", "true");
    } else if (new Date() > new Date(2016, 9, 6)) {
        document.getElementById("vid2").removeAttribute("hidden");
        document.getElementById("vid1").setAttribute("hidden", "true");
        document.getElementById("vid3").setAttribute("hidden", "true");
        document.getElementById("container2").removeAttribute("hidden");
        document.getElementById("container1").setAttribute("hidden", "true");
        document.getElementById("container3").setAttribute("hidden", "true");
    } else if (new Date() > new Date(2016, 9, 4)) {
        document.getElementById("vid1").removeAttribute("hidden");
        document.getElementById("vid2").setAttribute("hidden", "true");
        document.getElementById("vid3").setAttribute("hidden", "true");
        document.getElementById("container1").removeAttribute("hidden");
        document.getElementById("container2").setAttribute("hidden", "true");
        document.getElementById("container3").setAttribute("hidden", "true");
    }
}
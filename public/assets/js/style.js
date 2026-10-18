// Drag & Drop card functionality:
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}
function drop(ev, el) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  //el is the stage column; ev.target may be a card inside it
  el.appendChild(document.getElementById(data));
  axios({
    url: "/api/deals/" + data + "/" + el.id, method: "PUT"
  }).catch(err => console.log(err))
}



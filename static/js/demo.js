"use strict";
const dragmsg = "<b>Drag your VHDL/Verilog file to this window</b>";
const dropmsg = "<h1><mark>Drop that VHDL file!</mark></h1>";
const endmark = "%%END%%";
const vhdlmark = "%%%VHDL%%%";
const publicmark = "%%PUBLIC%%";
const privatemark = "%%PRIVATE%%";

let sending=false;
let vhdlfile=null;
let vhdlreader=null;
let vhdl="";
let fileHandle=null;
const pickerOpts = {
  id: 'hdlfiles',
  types: [
    {
      description: "VHDL/Verilog files",
      accept: {
        "hdl/*": [".vhd", ".vhdl",".v", ".sv", ".vho"],
      },
    },
  ],
  excludeAcceptAllOption: false,
  multiple: false,
};








function $(id){ return document.getElementById(id); }
function logAdd(msg){ $("log").innerHTML+='<b><pre>'+msg+'</pre></b>'; }
function log(msg){ $("log").innerHTML='<b><pre>'+msg+'</pre></b>'; }


//文件处理
function updateHandle() {
  if (fileHandle==null) {
    $("breload").style.display="none";
  } else {
    pickerOpts.startIn=fileHandle;
    $("breload").style.display="inline";
  }
}

function vhdlUpdate(newvhdl, rewrite=true) {
  if (rewrite) vhdl=newvhdl;
  if (newvhdl.indexOf(publicmark)>=0)
    $("vhdlcode").innerHTML="Press START to view and simulate the remote HDL file.";
  else if (newvhdl.indexOf(privatemark)>=0)
    $("vhdlcode").innerHTML="Press START to simulate the remote HDL example.";
  else {
    $("vhdlcode").innerHTML=newvhdl;
    $("vhdlcode").removeAttribute("data-highlighted"); // para que lo pueda highlightear de nuevo
    let lengua="language-vhdl";
    if (newvhdl.indexOf("endmodule")>=0) if (newvhdl.indexOf("input")>=0) lengua="language-verilog";
    $("vhdlcode").className = "container-fluid "+lengua;
    hljs.highlightAll();


  }
}

function loadFile(file) {
  vhdlfile=file;
  vhdlreader = new FileReader();
  vhdlreader.onload = function() {
    let cosa=vhdlreader.result
    if (cosa.length<400000) {
      vhdlUpdate(cosa);

    } else {
      console.log("Fichero muy grande, tamaño: "+cosa.length);
    }
  };
  vhdlreader.onerror = function() { console.log("Error reading file"); };
  vhdlreader.readAsText(vhdlfile);
}

async function reloadFile() {
  if (fileHandle==null) return;
  let file;
  try {
    file = await fileHandle.getFile();
  } catch (error) {
    return;
  }
  loadFile(file);
}

async function loadFileClick() {
  if ('showOpenFilePicker' in window) {
    try {
      [fileHandle] = await window.showOpenFilePicker(pickerOpts);
      vhdlfile = await fileHandle.getFile();
      updateHandle();
    } catch (error) { // happens when cancel
      return;
    }
    loadFile(vhdlfile);

  } else {
    $("breload").style.display="none";
    $("vhdlinput").click(); // llama a loadSelFile
  }
}

function loadSelFile() {
  let vhdlin = $("vhdlinput");
  if ('files' in vhdlin) {
    if (vhdlin.files.length > 0) {
      let file = vhdlin.files[0];
      loadFile(file);
    }
  }
  vhdlin.value=""; // para que pueda volver a cargar el mismo fichero
}

async function dropHandler(ev) {
  dragLeave();
  ev.preventDefault();
  if (ev.dataTransfer.items) { // usually true
    for (let i=0; i<ev.dataTransfer.items.length; i++) {
      const item=ev.dataTransfer.items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file.name.toLowerCase().indexOf(".v")>=0) {
          if ('getAsFileSystemHandle' in item) {
            fileHandle=await item.getAsFileSystemHandle();
            //file=await fileHandle.getAsFile(); // no hace falta, pues ya esta el del item
            updateHandle();
          } else {
            $("breload").style.display="none";
          }
          loadFile(file);
          break;
        }
      }
    }
  } else {

    [...ev.dataTransfer.files].forEach((file, i) => {
      loadFile(file);
    });
  }
}





let btnn1='1'
let btnn0='0'
        const socket = io();
        // 更新数据的函数
        function updateValue(elementId, value) {
            const element = document.getElementById(elementId);
            element.classList.remove('update');
            void element.offsetWidth; // 触发重绘
            element.classList.add('update');
        }
        // 监听数据更新事件
        socket.on('update_data', function(data) {
            if(data.sales==1){
            $("led").style.color="#ed080e";
        }else if(data.sales==0){
            $("led").style.color="#040504";
                }

            document.getElementById('timestamp').textContent = '最后更新时间: ' + data.timestamp;

        });



function btn1() {
    socket.emit('btnn',btnn1)
}
function btn0() {
    socket.emit('btnn',btnn0)
}

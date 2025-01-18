//---------------------------------------------------------
// VHDL simulator front-end for terAsic DE10 Altera FPGA board
// using WebSocket server based on GHDL compiler and simulator
// (c) Fernando Pardo Carpio, january 2024
//---------------------------------------------------------

"use strict";

const boardcolor="#0C480C";
const ledoff="LightGray";
const ledon="Red";
const ledundef="Pink";
const segmentOn="fill:red";
const segmentOff="fill:#EEEEEE";
const dragmsg = "<b>Drag your VHDL/Verilog file to this window</b>";
const dropmsg = "<h1><mark>Drop that VHDL file!</mark></h1>";
const endmark = "%%END%%";
const vhdlmark = "%%%VHDL%%%";
const publicmark = "%%PUBLIC%%";
const privatemark = "%%PRIVATE%%";
const hostcad="wss://cad.uv.es:9000/pardo/vhdlsim";
const hosttapec="wss://tapec.uv.es:9004/pardo/vhdlsim";
const wsport=9000;
let wshost='ws://127.0.0.1:'+wsport+'/pardo/vhdlsim'; // default server
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

const btn = new Array(4);
const sw = new Array(10);
const led = new Array(10);
const hex = new Array(2);
for (let i=0; i<2; i++) hex[i]=new Array(7);
const seg=new Array(2);
for (let i=0; i<2; i++) seg[i]=new Array(7);

let wsocket=null;
let simInterval=7;
let simutimer=null;
let sending=false;
let vhdlfile=null;
let vhdlreader=null;
let vhdl="";
let fileHandle=null;
//let protocol="http";

//-----------------------------------
// Utilities
//-----------------------------------

function bit2int(bit) {
  if (bit=='0') return 0;
  if (bit=='1') return 1;
  return -1;
}

function $(id){ return document.getElementById(id); }
function logAdd(msg){ $("log").innerHTML+='<b><pre>'+msg+'</pre></b>'; }
function log(msg){ $("log").innerHTML='<b><pre>'+msg+'</pre></b>'; }


//-----------------------------------
// Simulation control functions and websockets
//-----------------------------------

function startSim() {
  stopSim(); 
  $("bstart").disabled=true;
  resetled();
  resetdisp();
  updateInputs();
  updateOutputs();
  log("");
	try {
		wsocket = new WebSocket(wshost);
		wsocket.onopen = function(msg) { 
        try { 
          wsocket.send(vhdl+endmark); 
        } catch(ex) {
          log("Server Error. Check internet conection...");
          console.log("Error opening socket: "+ex); 
        }
      };//捕获异常


		wsocket.onmessage = function(msg) { 
        let datos;
        try { 
          datos=JSON.parse(msg.data);
        } catch(ex) {
          if (msg.data.indexOf(vhdlmark)>=0) {
            let prevhdl=msg.data.replace(vhdlmark,'');
            if (prevhdl.indexOf(privatemark)>=0) {
              vhdlUpdate(prevhdl.replace(privatemark,''),false);
            } else {
              vhdlUpdate(prevhdl);
            }
          } else {
            log("COMPILATION ERRORS:\n"+msg.data);
          }
          return;
        }
        if (datos.type=="result") {
          // Process outputs
          for (let i=0; i<10; i++) led[i]=bit2int(datos.led.substring(9-i,10-i));
          for (let i=0; i<7; i++) hex[0][i]=bit2int(datos.hex0.substring(6-i,7-i));
          for (let i=0; i<7; i++) hex[1][i]=bit2int(datos.hex1.substring(6-i,7-i));
          //提取得到json文件中对应led，hex部分的量
          updateOutputs();
        } else if (datos.type=="msg") {
          if (datos.msg=="Starting") {
            sendInputs();
            simutimer=setInterval(sendInputs,simInterval);
            $("bstart").disabled=true;
            $("bstop").disabled=false;
          }
        }
      };
		wsocket.onclose   = function(msg) {
        if (simutimer) clearInterval(simutimer);
        resetled();
        resetdisp();
        updateOutputs();
        $("bstart").disabled=false;
        $("bstop").disabled=true;
			};
	}	catch(ex) { 
    log("Error stablishing connection. Check internet...");
		console.log("Error in startsim: "+ex); 
	}
}

function stopSim(){
  if (simutimer) clearInterval(simutimer);
  $("bstop").disabled=true;
  //$("brecon").disabled=true;
	if (wsocket != null) {
		//log("Stopping simulation...");
		wsocket.close();
		wsocket=null;
	}
  $("bstart").disabled=false;
}


function sendInputs(){
  if (wsocket==null) {
    return;
  }
  if (sending==true) return;
  sending=true;
  let msg="";
  for (let i=3; i>=0; i--) msg+=btn[i]; // switches
  for (let i=9; i>=0; i--) msg+=sw[i]; // switches
	try { 
		wsocket.send(msg); 
		//log('Sent: '+msg); 
	} catch(ex) { 
		console.log("Error sending: "+ex); 
	}
  sending =false;
}


//-----------------------------------
// IO control functions
//-----------------------------------

function btnclick(evt) {
  let id = evt.target.id;
  let idx = parseInt(id.substring(3));
  let tipo=evt.type;
  let btnhay=btn[idx];
  if (tipo=="mousedown") {
    btn[idx]=0;
  } else {
    btn[idx]=1;
  }
  if (btnhay!=btn[idx]) sendInputs();
}

function swclick(evt) {
  let id = evt.target.id;
  let id2 = id.split("_");
  let idx = parseInt(id2[0].substring(2));
  sw[idx]=1-sw[idx]; // da igual cual de los dos apriete hace toggle
  updateInputs();
  sendInputs();
}

function updateInputs() {
  for (let i=0; i<10; i++) {
    let id = "sw"+i+"_"+sw[i];
    let id2 = "sw"+i+"_"+(1-sw[i]);
    let btnobj = $(id);
    let btnobj2 = $(id2);
    btnobj.setAttribute("class","btn text-white bg-black rounded-0");
    btnobj2.setAttribute("class","btn btn-success text-success btn-outline-dark rounded-0");
  }
}

function updateOutputs() {
  for (let i=0; i<10; i++) {
    let id = "led"+i;
    let ledobj = $(id);
    if (led[i]==0) ledobj.setAttribute("style","background: "+ledoff+";");
    else if (led[i]==1) ledobj.setAttribute("style","background: "+ledon+";");
    else ledobj.setAttribute("style","background: "+ledundef+";");
    //ledobj.style.borderWidth="4px";
    //ledobj.setAttribute("class","rounded-circle border-4 border-dark");
  }
  updateDisp();
}

function updateDisp() {
  for (let i=0; i<2; i++) {
    for (let j=0; j<7; j++) {
      if (hex[i][j]==0) seg[i][j].setAttribute('style',segmentOn);
      else seg[i][j].setAttribute('style',segmentOff);
    }
  }
}

function resetswbtn() {
  for (let i=0; i<10; i++) {
    sw[i]=0;
    btn[i]=1;
  }
}

function resetled() {
  for (let i=0; i<10; i++) {
    led[i]=-1;
  }
}

function resetdisp() {
  for (let i=0; i<2; i++) {
    for (let j=0; j<7; j++) {
      hex[i][j]=-1;
    }
  }
}

// ----------------------------------
// 7-segment display SVG
// help: https://w3.unpocodetodo.info/svg/crear_elementos_svg_con_javascript.php
//-----------------------------------

function createSVGnode(tag, attrs) {
    var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}

function iniSegments() {
  //let circle=createSVGnode('circle',{cx:"52", cy:"75", r:"5"});
  let hseg={id: "h-seg", points:"11 0, 37 0, 42 5, 37 10, 11 10, 6 5"};
  let vseg={id: "v-seg", points:"0 11, 5 6, 10 11, 10 34, 5 39, 0 39"};
  let dispos=["svgdisp0","svgdisp1"];
  let disp;
  for (let i=0; i<2; i++) {
    seg[i][0]=createSVGnode('polyline',hseg);
    seg[i][1]=createSVGnode('polyline',{...vseg,...{transform: "scale(-1,1),translate(-48,0)"}});
    seg[i][2]=createSVGnode('polyline',{...vseg,...{transform: "scale(-1,-1),translate(-48,-80)"}});
    seg[i][3]=createSVGnode('polyline',{...hseg,...{transform: "translate(0,70)"}});
    seg[i][4]=createSVGnode('polyline',{...vseg,...{transform: "scale(1,-1),translate(0,-80)"}});
    seg[i][5]=createSVGnode('polyline',vseg);
    seg[i][6]=createSVGnode('polyline',{...hseg,...{transform: "translate(0,35)"}});
    disp=$(dispos[i]);
    for (let j=0; j<7; j++)
      disp.appendChild(seg[i][j]);
  }
}

// ----------------------------------
// VHDL File handling
//-----------------------------------

function updateHandle() {
  if (fileHandle==null) {
    $("breload").style.display="none";
  } else {
    pickerOpts.startIn=fileHandle;
    $("breload").style.display="inline";
  }
}

function vhdlUpdate(newvhdl, rewrite=true) {
  
  // nada de esto iba bien, pues fallaban los retornos de carro

  // esto si que va bien
  if (rewrite) vhdl=newvhdl;
  if (newvhdl.indexOf(publicmark)>=0)
    $("vhdlcode").innerHTML="Press START to view and simulate the remote HDL file.";
  else if (newvhdl.indexOf(privatemark)>=0)
    $("vhdlcode").innerHTML="Press START to simulate the remote HDL example.";
  else {
    // ponemos el tipo de lenguaje para que lo destaque
    $("vhdlcode").innerHTML=newvhdl;
    $("vhdlcode").removeAttribute("data-highlighted"); // para que lo pueda highlightear de nuevo
    let lengua="language-vhdl";
    if (newvhdl.indexOf("endmodule")>=0) if (newvhdl.indexOf("input")>=0) lengua="language-verilog";
    $("vhdlcode").className = "container-fluid "+lengua;
    hljs.highlightAll();
  }
  //startSim(); // mejor no ponerlo aqui
}

function loadFile(file) {
  //vhdlfile=file;
  //console.log("loading");
  let running=false;
  if (wsocket!=null) running=true;
  stopSim();
  vhdlfile=file;
  vhdlreader = new FileReader();
  vhdlreader.onload = function() {
    //log(""); // borra
    let cosa=vhdlreader.result
    if (cosa.length<400000) {
      vhdlUpdate(cosa);
      startSim();
    } else {
      console.log("Fichero muy grande, tamaño: "+cosa.length);
      if (running) startSim();
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
  //console.log("File(s) dropped");
  // Prevent default behavior (Prevent file from being opened)
  dragLeave(); // just for the message
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
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      loadFile(file);
    });
  }
}

function dragOverHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  //log("File(s) in drop zone");
  $("dragmsg").innerHTML=dropmsg;
  ev.preventDefault();
}

function dragLeave() {
  $("dragmsg").innerHTML=dragmsg;
}

//-----------------------------------
// Initialization
//-----------------------------------
//写入仿真开发板css样式
function setupIOwidgets() {
  // preparing DE10 widgets
  let tablaswled = $("tablaswled");
  tablaswled.style.backgroundColor=boardcolor;
  let tabla = document.createElement("table");
  tabla.setAttribute("class","table table-sm");
 
  let fila = document.createElement("tr");
  
  let celda;
  for (let i=9; i>=0; i--) {

    celda = document.createElement("td");
    celda.style.backgroundColor=boardcolor;
    celda.setAttribute("class","text-center");
  
   
    celda.innerHTML='<div class="text-white" style="background-color: '+boardcolor+'">led'+i+'</div>';
    celda.innerHTML += '<span id="led'+i+'" class="rounded-circle" style="background: '+ledundef+';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
    fila.appendChild(celda);
  }
  for (let i=3; i>=0; i--) {
  
    celda = document.createElement("td");
    celda.setAttribute("class","text-center");

    if (i<2) {
      celda.setAttribute("style","bgcolor: lightgray;");
      celda.innerHTML='<div class="text-white" style="background-color: '+boardcolor+'">hex'+i+'</div>';
      celda.innerHTML+='<div style="background: lightgray"><svg id="svgdisp'+i+'" transform="skewX(-8)" width="48" height="80" style="background: lightgray;" xmlns="http://www.w3.org/2000/svg"></svg></div>';
    } else {
      celda.setAttribute("style",'bgcolor: "'+boardcolor+'";');
    }
    fila.appendChild(celda);
  }
  tabla.appendChild(fila);
  fila = document.createElement("tr");
  for (let i=9; i>=0; i--) {

    celda = document.createElement("td");
    celda.setAttribute("class","text-center");
   
    celda.innerHTML =  '<div class="p-0" style="background: '+boardcolor+'"><button type="button" class="rounded-0 btn btn-outline-black" style="--bs-btn-hover-bg: lightgrey" id="sw'+i+'_1">1</button></div>';
    celda.innerHTML += '<div class="p-0" style="background: '+boardcolor+'"><button type="button" class="rounded-0 btn btn-dark" style="--bs-btn-hover-bg: lightgrey" id="sw'+i+'_0">0</button></div>';
    celda.innerHTML +='<div style="background: '+boardcolor+'" class="text-white">sw'+i+'</div>';
    fila.appendChild(celda);
  }
  for (let i=3; i>=0; i--) {

    celda = document.createElement("td");
    celda.setAttribute("class","text-center");

   
    celda.innerHTML =  '<div class="p-0" style="background: '+boardcolor+';"><button type="button" class="btn btn-secondary btn-lg rounded-circle border-4 border-dark" style="--bs-btn-active-bg: black" id="btn'+i+'">&nbsp;</button></div>';
    celda.innerHTML +='<div class="text-white" style="background: '+boardcolor+';">key'+i+'</div>';

    celda.setAttribute("style",'bgcolor: "'+boardcolor+'";');
    fila.appendChild(celda);
  }
  tabla.appendChild(fila);
  tablaswled.appendChild(tabla);
  for (let i=9; i>=0; i--) {
    $('sw'+i+'_0').addEventListener('click',swclick);
    $('sw'+i+'_1').addEventListener('click',swclick);
  }
  for (let i=3; i>=0; i--) {
    const bot=$('btn'+i);
    bot.addEventListener('mousedown',btnclick);
    bot.addEventListener('mouseup',btnclick);
    bot.addEventListener('mouseleave',btnclick);
  }
}

function loadExample(id) {
  const exaidx=$(id).selectedIndex;
  let orig=vhdlexamples;
  if (id=="examplesver") { orig=verilogexamples; }
  if (orig[exaidx].code=="") return;
  if (exaidx<orig.length) {
    stopSim();
    vhdlUpdate(orig[exaidx].code);
    startSim();
  }
}

function setupExamples() {
  for (let i=0; i<2; i++) {
    let orig=vhdlexamples;
    if (i==1) { orig=verilogexamples; }
    if (typeof(orig)!=='undefined') {
      if (orig.length>0) {

        let nom='examples';
        if (i==1) nom='examplesver';
        let exa=$(nom);
        for (let j=0; j<orig.length; j++) {
          let opt=document.createElement("option");
          opt.text=orig[j].title;
          exa.options.add(opt,j);
        }
        exa.style.display="inline";
        $(nom+'label').style.display='inline';
      }
    }
  }
}

function setup(wshostprop=null) {
  // no sirve, pues el servidor cambia automaticamente a https y está todo el rato repitiendo
  //if (location.protocol.indexOf("https")>=0) {
  //  location.replace("http://"+location.hostname+location.pathname+location.search);
  //}
  //if (location.hostname.length>0) {
    // algo está mal con el proxy de tapec, que no funciona siempre y entonces no hay manera de acceder a wss...
    //wshost="wss://"+location.hostname.replace('tapec','tapnas')+':'+wsport+location.pathname; // tapec did not work sometimes, y tapnas tampoco
    //wshost="wss://"+location.hostname+':'+wsport+location.pathname; // tapec did not work sometimes
    //wshost="ws://tapec.uv.es:9000/pardo/vhdlsim"; // Esto va, pero solo si la pagina es http y resulta que cambia a https automaticamente cuando le parece...
    //wshost="wss://cad.uv.es:9000/pardo/vhdlsim"; // Esto va, pero solo si la pagina es http y resulta que cambia a https automaticamente cuando le parece...
  //}
  const urlParams = new URLSearchParams(window.location.search);
  const elhostall = urlParams.get('hostall');
  const elhost = urlParams.get('host');
  if (elhostall!=null) wshostprop=elhost;
  else if (elhost!=null) {
    if (elhost=="cad") wshostprop=hostcad;
    else if (elhost=="tapec") wshostprop=hosttapec;
  }
  if (wshostprop!=null) wshost=wshostprop;
  
  setupIOwidgets();
  resetswbtn();
  resetled();
  resetdisp();
  iniSegments();
  updateInputs();
  updateOutputs();
  const params = new URLSearchParams(location.search);
  const fichp=params.get('public');
  const fichpr=params.get('private');
  let vhdldefault="%%PUBLIC%%default.vhdl%%";
  if (fichp!==null) {
    vhdldefault=publicmark+fichp+"%%";
  } else if (fichpr!==null) {
    vhdldefault=privatemark+fichpr+"%%";
  } else if (typeof(vhdlexamples)!=='undefined') {
    if (vhdlexamples.length>0) {
      vhdldefault=vhdlexamples[0].code;
    }
  }
  setupExamples();
  vhdlUpdate(vhdldefault);
  startSim();
  dragLeave();
  $("footer").innerHTML="&copy; "+new Date().getFullYear()+' Fernando Pardo Carpio - Universitat de València';
}

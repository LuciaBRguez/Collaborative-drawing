if (window.WebSocket) {
    console.log("WebSockets supported.");
} else {
    console.log("WebSockets NOT supported");
    alert("Consider updating your browser for a better experience");
}


// Inicializamos cuando cargue la web
window.addEventListener("load", init);

function init() {
    initServer();
    canvas = new fabric.Canvas('canvas');

    // Modificación en el canvas
    canvas.on('object:modified', function (options) {
        if (options.target) {
            console.log("options.modified: "+options.target);
            if (options.target.type === "circle") {
                var obj = {
                    id: options.target.id,
                    top: options.target.top,
                    left: options.target.left,
                    radius: options.target.getWidth()/2,
                    fill: options.target.fill
                };
                sendObject('Circle', obj);
            } else if (options.target.type === "rect") {
                var obj = {
                    id: options.target.id,
                    // originX y originY center son necesarios para rotación céntrica
                    originX: 'center',
                    originY: 'center',
                    top: options.target.top,
                    left: options.target.left,
                    width: options.target.getWidth(),
                    height: options.target.getHeight(),
                    fill: options.target.fill,
                    angle: options.target.angle
                };
                sendObject('Rectangle', obj);
            } else if (options.target.type === "triangle") {
                var obj = {
                    id: options.target.id,
                    originX: 'center',
                    originY: 'center',
                    top: options.target.top,
                    left: options.target.left,
                    width: options.target.getWidth(),
                    height: options.target.getHeight(),
                    fill: options.target.fill,
                    angle: options.target.angle
                };
                sendObject('Triangle', obj);
            }
        }
    });

    // Eventos click de botones
    addCircle.addEventListener('click', addCircleHandler);
    addRectangle.addEventListener('click', addRectangleHandler);
    addTriangle.addEventListener('click', addTriangleHandler);
    saveCanvas.addEventListener('click', saveCanvasHandler);
}

function addCircleHandler() {
    var obj = {
        id: canvas.getObjects().length,
        top: 100,
        left: 50,
        radius: 20,
        fill: 'green'
    };
    sendObject('Circle', obj);
}

function addRectangleHandler() {
    var obj = {
        id: canvas.getObjects().length,
        originX: 'center',
        originY: 'center',
        top: 100,
        left: 150,
        width: 60,
        height: 70,
        fill: 'red',
        angle: 0
    };
    sendObject('Rectangle', obj);
}

function addTriangleHandler() {
    var obj = {
        id: canvas.getObjects().length,
        originX: 'center',
        originY: 'center',
        top: 100,
        left: 250,
        width: 20,
        height: 30,
        fill: 'blue',
        angle: 0
    };
    sendObject('Triangle', obj)
}

function saveCanvasHandler() {
    var json_data = JSON.stringify(canvas.toDatalessJSON());
    console.log(json_data);
    var blob = new Blob([json_data], {type: "application/json"});
    console.log(blob);
    saveAs(blob, "drawing.json");
}

function initServer() {
    websocket = new WebSocket('ws://localhost:9001');
    websocket.onopen = connectionOpen;
    websocket.onmessage = onMessageFromServer;
}

// Se realiza una conexión
function connectionOpen() {
    websocket.send('connection open');
}

// Se recibe del servidor
function onMessageFromServer(message) {
    console.log('received on client ' + message.data);
    if (isInt(message.data)) {
        document.getElementById("numClients").innerHTML = message.data;
    } else if (isJson(message.data)) {
        if (isArray(message.data)) {
            var arrayObjects = JSON.parse(message.data);
            console.log("Array: " +arrayObjects);
            // Borramos canvas actual
            canvas.clear();
            // Actualizamos nuevo canvas
            arrayObjects.forEach(function (obj) {
                addObject(obj.type, obj.data);
            });
        } else {
            var obj = JSON.parse(message.data);
            addObject(obj.type, obj.data);
        }
    }
}

// Comprobamos si es formato JSON
function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Comprobamos si es un número entero
function isInt(int) {
    try {
        parseInt(int);
        return int % 1 === 0;
    } catch (e) {
        return false;
    }
}

// Comprobamos si es un array
function isArray(array) {
    try {
        if (Array.isArray(JSON.parse(array)) === true) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

function addObject(type, obj) {
    var shape;
    if (type === 'Triangle') {
        shape = new fabric.Triangle(obj);
    } else if (type === 'Rectangle') {
        shape = new fabric.Rect(obj);
    } else if (type === 'Circle') {
        shape = new fabric.Circle(obj);
    }
    canvas.add(shape);
}

function sendObject(type, obj) {
    // String a JSON
    websocket.send(JSON.stringify(({'type': type, 'data': obj})));
}
var WebSocket = require ('ws');
var WebSocketServer = WebSocket.Server,
    wss = new WebSocketServer({ port:9001 });

var numUsers = 0;
var arrayObjects = [];


// Nueva conexión
wss.on('connection', function connection(ws) {

    // Se añade un nuevo usuario
    numUsers++;

    // Se envía el número de usuarios al cliente
    wss.clients.forEach(function each(client) {
        client.send(numUsers.toString());
    });

    // Nuevo objeto
    ws.on('message', function incoming(message) {

        console.log('received on server: %s', message);

        // Se comprueba si el texto recibido tiene formato JSON
        if (isJson(message)) {

            // Se convierte el texto en un objeto JavaScript
            var json = JSON.parse(message);
            var currentObject = {};
            var esModificado = false;

            // Se añade el nuevo objeto al array de todos los objetos
            currentObject.type = json.type;
            currentObject.data = json.data;

            // Se comprueba si es un objeto nuevo o modificado
            arrayObjects.forEach(function (obj) {
                if (obj.data.id === currentObject.data.id) {
                    esModificado = true;
                }
            });

            // Es nuevo
            if (esModificado === false) {
                console.log("Es nuevo");
                // Se añade el nuevo objeto al array
                arrayObjects.push(currentObject);
            }
            // Es modificado
            else if (esModificado === true) {
                console.log("Es modificado");

                // Se sustituye el objeto antiguo por el modificado en el array
                arrayObjects.splice(currentObject.data.id, 1, currentObject);

                // Se envía el array de objetos a todos los clientes
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify(arrayObjects));
                });

                esModificado = false;
                return false;
            }

            //Se añaden simultáneamente en todos los clientes abiertos
            broadcast(message);
        }
    });

    arrayObjects.forEach(function (obj) {
        ws.send(JSON.stringify(obj));
    });

    // Desconexión
    ws.on("close", function() {
        // Se elimina un usuario
        numUsers--;

        // Se envía el número de usuarios al cliente
        wss.clients.forEach(function each(client) {
            client.send(numUsers.toString());
        });
    });

});


function broadcast(message) {
    wss.clients.forEach(function each(client) {
        client.send(message);
        client.send(numUsers);
    });
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
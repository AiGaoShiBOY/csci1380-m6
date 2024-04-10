const http = require('http');
const url = require('url');

let local = require('../local/local');
const serialization = require('../util/serialization');

/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


function isValidBody(body) {
  error = undefined;
  if (body.length === 0) {
    return new Error('No body');
  }

  try {
    body = JSON.parse(body);
  } catch (error) {
    return error;
  }

  return error;
}


const start = function(onStart) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    // Write some code...

    if (req.method !== 'PUT') {
      res.end(serialization.serialize(new Error('Method not allowed!')));
      return;
    }

    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */


    // Write some code...


    const pathname = url.parse(req.url).pathname;
    const [, service, method] = pathname.split('/');

    console.log(`[SERVER] (${global.nodeConfig.ip}:${global.nodeConfig.port})
        Request: ${service}:${method}`);


    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */

    // Write some code...


    let body = [];

    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      body = Buffer.concat(body).toString();

      let error;

      if (error = isValidBody(body)) {
        res.end(serialization.serialize(error));
        return;
      }

      body = JSON.parse(body);
      body = serialization.deserialize(body);
      let args = body;


      /* Here, you can handle the service requests. */

      // Write some code...

      local.routes.get(service, (error, service) => {
        if (error) {
          res.end(serialization.serialize(error));
          console.error(error);
          return;
        }

        /*
      Here, we provide a default callback which will be passed to services.
      It will be called by the service with the result of it's call
      then it will serialize the result and send it back to the caller.
        */
        const serviceCallback = (e, v) => {
          res.end(serialization.serialize([e, v]));
        };

        // Write some code...


        console.log(`[SERVER] Args: ${JSON.stringify(args)}
            ServiceCallback: ${serviceCallback}`);

        service[method](...args, serviceCallback);
      });
    });
  });


  // Write some code...

  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the onStart callback when your server has successfully
    started.

    In this milestone, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    console.log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    onStart(server);
  });
};

module.exports = {
  start: start,
};

/* 

Entry File For Upmonitor

*/

// Dependencies
const http= require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;


const server = http.createServer(function(req,res){

       // Get URL and Parse 
       var parsedUrl = url.parse(req.url,true);

       // Get the Path 
       var path = parsedUrl.pathname;
       var trimmedPath = path.replace(/^\/+|\/+$/g, '');
        
      //Get the Query String  Object 
      var queryStringObject = parsedUrl.query;    

       // Get the HTTP Method :
       var method = req.method.toLowerCase();

       // Get the Header Object
      
       var headers = req.headers;

       //Payload
      var decoder = new StringDecoder('utf-8');
      var buffer = '';
      req.on('data',function(data){
         buffer += decoder.write(data);
      });

      req.on('end',function(){
           buffer += decoder.end();
           //Send response
           res.end('Hey');
           //Server LOG :
           console.log('Request is Received ',buffer);
           console.log('headers',headers);
           console.log('Method' ,method);


      });

    

});



// Server Starting Point:
server.listen(3000,function(){
    console.log('Server listening on port @3000 !!');
})
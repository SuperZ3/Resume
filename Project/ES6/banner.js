let http = require('http')
let fs = require('fs')
http.createServer((req,res)=>{
    console.log(req.url)
    if(req.url === "/banner.json"){
        fs.readFile('./banner.json',(err,data)=>{
            res.setHeader("Access-Control-Allow-Origin","*");
            res.writeHead(200,{
                'content-type':'application/json',
                'Access-Control-Allow-Origin':'*'})
            res.end(data)
        })
    }
}).listen(888,()=>{
    console.log("success")
})
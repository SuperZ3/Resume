const Koa = require('koa');
const Router = require('koa-router');
const static = require('./routers/static');
const body = require('koa-better-body');
const path = require('path');
const session = require('koa-session');
const fs = require('fs');
const ejs = require('koa-ejs');

let server = new Koa();
let router = new Router();

server.use(body({
    uploadDir:path.resolve(__dirname,'./static/upload')
}));

server.keys = fs.readFileSync('.keys').toString().split('\n');
server.use(session({
    key:"test:test",
    maxAge:20*60*1000
},server))

server.context.db = require('./libs/database');

ejs(server,{
    root:path.resolve(__dirname,'template'),
    layout:false,
    viewExt:'ejs',
    cache:false,
    debug:false
})

router.use(async (ctx,next)=>{
    try{
        await next();
    }catch(e){
        ctx.throw(500,'internal error' + e)
    }
})


router.use('/admain',require('./routers/admain'));
router.use('/',require('./routers/www'));

static(router);

server.use(router.routes());

server.listen(889,()=>{console.log("server at" + 889)});
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');

let router = new Router();

router.get('/login',async ctx => {
    await ctx.render('admain/login',{
        HTTP_ROOT:"http://localhost:889",
        errmsg:""
    })
});

router.post('/login',async ctx => {
    let n = ctx.session.views || 0
    ctx.session.views = ++n
    let {username,password} = ctx.request.fields;
    let admains = JSON.parse(await fs.readFileSync(
        path.resolve(__dirname,'../../admain.json')
    ).toString());
    ctx.body = admains + `session:${n}`;
});

module.exports = router.routes();
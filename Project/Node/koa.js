const http = require('http')
const context = require('./context')
const request = require('./request')
const response = require('./response')

class KOA {
    constructor(){
        this.middlewares = []
    }

    listen(...args){
        const server = http.createServer(async (req,res)=>{

            const ctx = this.createContext(req,res)

            const fn = this.compose(this.middlewares)

            await fn(ctx)

            // this.callback(ctx)

            res.end(ctx.body)
        }).listen(...args)
    }

    use(callback){
        this.middlewares.push(callback)
    }

    createContext(req,res){
        const ctx = Object.create(context)
        ctx.request = Object.create(request)
        ctx.response = Object.create(response)

        ctx.req = ctx.request.req = req
        ctx.res = ctx.response.res = res

        return ctx
    }

    compose(middlewares){
        return function(ctx){
            return dispatch(0)
            function  dispatch(i) {
                let fn = middlewares[i]
                if(!fn) return Promise.resolve()
    
                return Promise.resolve(
                    fn(ctx,function next(){
                        return dispatch(i+1)
                    })
                )
            }
        }
    }

}

//构建上下文
module.exports = {
    get url(){
        return this.req.url
    },
    get method(){
        return this.req.methods.toLowerCase()
    }
}
module.exports = {
    get url(){
        return this.request.url
    },
    get body(){
        return this.response.body
    },
    set body(val){
        this.request.body = val
    },
    get method(){
        return this.request.method
    }
}
module.exports  = {
    get body(){
        return this._body
    },
    set body(val){
        this._body = val
    }
}
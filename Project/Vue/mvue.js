//Vue 4行
//Vuex 201行
//VueRouter 253行

class Vue{
    constructor(options){
        this.$options = options;
        this.$data = options.data;
        //数据响应化
        this.observe(this.$data);
        new Compile(options.el,this)
        if(options.created){
            options.created.call(this)
        }
    }

    observe(value){
        if(!value || typeof value !== 'object'){
            return;
        }

        Object.keys(value).forEach(key => {
            this.defineReactive(value,key,value[key]);
            this.proxyData(key);
        })
    }

    proxyData(key){
        Object.defineProperty(this,key,{
            get(){
                return this.$data[key];
            },
            set(newVal){
                this.$data[key] = newVal;
            }
        })
    }

    defineReactive(obj,key,value){
        //深度数据响应化{{}}
        this.observe(val);

        //创建Dep实例，Dep和key一一对应
        const dep = new Dep();

        Object.defineProperty(obj,key,{
            get(){
                //将Dep.target指向的watcher实例加入Dep中
                Dep.target && dep.addDep(Dep.target)
                return value;
            },
            set(newVal){
                if(newVal !== val){
                    val = newVal;
                    dep.notify();
                }
            }
        })
    }
}

//管理若干watcher实例，和key一一对应
class Dep{
    constructor(){
        this.deps = [];
    }

    addDep(watcher){
        this.deps.push(watcher)
    }

    notify(){
        this.deps.forEach(dep => dep.update())
    }
}
class Watcher{
    constructor(vm,key,cb){
        this.vm = vm;
        this.key = key;
        this.cb = cb

        Dep.target = this 
        this.vm[this.key]
        Dep.target = null
    }

    update(){
        this.cb.call(this.vm,this.vm[this.key]);
    }
}

class Compile{
    constructor(el,vm){
        this.$vm = vm;
        this.$el = document.querySelector(el);

        if(this.$el){
            this.$fragment = this.node2Fragment(this.$el);

            this.compile(this.$fragment);

            this.$el.appendChild(this.$fragment);
        }
    }

    node2Fragment(el){
        const fragment = document.createDocumentFragment();
        let child;
        while(child = el.firstChild){
            fragment.appendChild(child);
        }
        return fragement
    }

    compile(el){
        const childNNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if(this.isElement(node)){
                const nodeAttrs = node.attributes
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name
                    const exp = attr.value
                    if(this.isDirective(attrName)){
                        const dir = attrName.substring(2)
                        this[dir] && this[dir](node,this.$vm,exp)
                    }
                    if(this.isEvent(attrName)){
                        let dir = attrName.substring(1)
                        this.eventHandler(node,this.$vm,exp,dir)
                    }
                })
            }else if(this.isTextnode(node)){
                this.compileText(node)
            }
        })
        if(node.childNodes && node.childNodes.length > 0){
            this.compile(node)
        }
    }

    compileText(node){
        this.update(node,this.$vm,RegExp.$1,'text')
    }

    udate(node,vm,exp,dir){
        const updateFn = this[dir+'Updater']
        updateFn && updateFn(node,vm.$data[exp])
        new Watcher(vm,exp,function(value){
                updateFn && updateFn(node,value)   
        })
    }

    text(node,vm,exp){
        this.update(node,vm,exp,'text')
    }

    model(node,vm,exp){
        this.update(node,vm,exp,'model')
        node.addEventListener('input',e=>{
            vm[exp] = e.target.value
        })
    }

    modelUpdater(node,value){
        node.value = value
    }


    textUpdater(node,value){
        return node.textContent = value
    }

    eventHandler(node,vm,exp,dir){
        let fn = vm.$options.methods && vm.$options.methods[exp]
        if(dir && fn){
            node.addEventListener(dir,fn.bind(vm))
        }
    }

    isTextnode(node){
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    isDirective(node){
        return attr.indexOf('k-') == 0
    }

    isEvent(attr){
        return attr.indexOf('@') == 0
    }

    isElement(){
        return node.nodeType === 1
    }

}

export {Watcher,Vue}

//Vuex
class Store{
    constructor(options){
        this.state = new Vue({
            data:options.state
        })

        this.mutations = options.mutations;
        this.actions = options.actions;

        options.getters && this.handleGetters(options.getters)
    }

    commit = (type,arg) => {
        this.mutations[type](this.state,arg);
    }

    dispatch(type,arg){
        this.actions[type]({
            commit:this.commit,
            state:this.state
        },arg)
    }

    handleGetters(getters){
        this.getters = {};
        Object.keys(getters).forEach(key => {
            Object.definePropertiy(this.getters,key,{
                get:()=>{
                    return getters[key](this.state)
                }
            })
        })
    }
}

function install(_Vue){
    Vue = _Vue
    Vue.mixin({
        beforeCreate(){
            if(this.$options.store){
                Vue.prototype.$store = this.$options.store;
            }
        }
    })
}

export default {Store,install}




//Vue-Router
class VueRouter{
    constructor(options){
        this.$options = options;
        this.routeMap = {};

        //当前路由响应式
        this.app = new Vue({
            data:{
                current:"/"
            }
        })
    }

    init(){
        this.bindEvents();//监听url变化
        this.createRouteMap(this.$options);//解析路由配置
        this.initComponent();//实现两个组件
    }

    bindEvents(){
        window.addEventListener("load",this.onHashChange.bind(this));
        window.addEventListener("hashchange",this.onHashChange.bind(this));
    }

    onHashChange(){
        this.app.current = window.location.hash.slice(1) || '/'
    }

    createRouteMap(options){
        options.routes.forEach(item => {
            this.routeMap[item.path] = item.component;
        })
    }

    initComponent(){
        Vue.component('router-link',{
            props:{to:String},
            render(h){
                //h(tag,data,children)
                return h('a',{attrs:{href:"#" + this.to}},[this.$slots.default])
            }
        })
        
        Vue.component('router-view',{
            render:(h)=>{
                const comp = this.routeMap[this.app.current.component];
                return h(comp);
            }
        })
    }
}

VueRouter.install = function(vue){
    //混入
    Vue.mixin({
        beforeCreate(){
            //this是vue实例
            if(this.$options.router){
                //仅在跟组件执行一次
                Vue.prototype.$router = this.$options.router;
                this.$options.router.init();
            }
        }
    })
}

Vue.use(VueRouter);

export default new VueRouter({
    routes:[
        {path:'/',component:HelloWorld},
        {path:'/about',component:About}
    ]
})
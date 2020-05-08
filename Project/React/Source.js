//Redux  5行
//ReactRedux 105行
//Reouter  169行

function createStore(reducer,enhancer){
    if(enhancer){
        return enhancer(createStore)(reducer)
    }
    //第一次dispatch，state无值，走的是reducer中设置的默认值，创建容器时就dispatch执行了一次
    let state,
        listenAry = [];

    //基于dispatch实现任务派发    
    function dispatch(action){
        //1、执行reducer，修改状态信息(接受reducer返回值，替换原有state),把返回值全部替换state，要求reducer中在修改状态之前，要先把原始状态信息克隆一份，再进行单个值修改
        state = reducer(state,action);

        //通知事件池方法执行
        for (let i = 0;i<listenAry.length;i++){
            let item = listenAry[i];
            if(typeof item === 'function'){
                item();
            }else{
                //避免数组塌陷引起的错误
                listenAry.splice(i,1);
                i--
            }
        }
      return action
    }

    function getState(){
        //deep clone
        return JSON.parse(JSON.stringify(state));
    }

    function subscribe(fn){
        let isExit = listenAry.includes(fn);
        !isExit ? listenAry.push(fn) : null;

        //return method to delete fn
        return function unsubscribe(){
            let index = listenAry.indexOf(fn);
            listenAry[index] = null;//注意数组塌陷
        }

    }

    dispatch({type:'_INIT_DEFAULT_STATE'});//创建容器的时候执行一次，把reducer中的默认状态信息赋值给redux容器中的状态

    return {
        dispatch,
        getState,
        subscribe
    }
}
function combineReducers(reducers){
   return function reducer(state = {},action){
      let newState = {};
      for(let key in reducers){
        if(!reducers.hasOwnProperty(key)) break;
        newState[key] = reducers[key](state[key],action);
      return newState;
    }
   }
}
//applyMiddleWare  createStore(reducer,applyMiddleWare(logger,thunk))
function applyMiddleWare(...middlewares){
  return function (createStore){
    return function (...args){
      const store = createStore(...args);
      let {dispatch} = store;

      let midApi = {
        getState:store.getState,
        dispatch:(...args) => dispatch(...args)
      }

      const chain = middlewares.map(mw => mw(midApi));
      
      dispatch = compose(...chain)(store.dispatch);
      return {
        ...store,
        dispatch
      }
    }
  }
}
function logger({dispatch,getState}){
  return dispatch => action => {
    console.log("im done");
    return dispatch(action);
  }
}
function compose(...fns){
  if(fns.length === 0){
    return arg => arg
  }
  if(fns.length === 1){
    return fns[0]
  }
  return fns.reduce((left,right) => (...args) => right(left(...args)))
}

//ReactRedux
import React from "react"
import ProTypes from 'prop-types'
class Provider extends React.Component{
    static childContextTypes={
        store:PropTypes.object
    }

    getChildContext(){
        return {
            store:this.props.store
        }
    }

    constructor(props,context){
        super(props,context)
    }

    render(){
        return this.props.children
    }
}
function connect(mapStateToProps,mapDispatchToProps){
    return function connectHOT(Comp){
        return class Proxy extends React.Component{
            static contextTypes = {
                store:PropTypes.obj
            }
  
            constructor(props,context){
                super(props,context);
                this.state = this.queryMountProps();
            }

            componentDidMount(){
                this.context.store.subscribe(()=>{
                    //state改变时调用此函数，重新设置state
                    this.setState(this.queryMountProps());
                })
            }

            render(){
                return <Comp {...this.state} {...this.props}/>
            }

            queryMountProps = () => {
                let {store} = this.context,
                    state = store.getState();
                let propState = typeof mapStateToProps === 'function' ? mapStateToProps(state) : {};
                let propDispatch = typeof mapStateToProps === 'function' ? mapDispatchToProps(store.dispatch) : {};
                return {
                    ...propState,
                    ...propDispatch
                }
            }

        }
    }
}
export {
    Provider,
    connect
}

//Router
import React,{Component} from "react"
import {createBrowserHistory} from 'history'
import pathToRegexp from "path-to-regexp"

const cache = {}
const cacheLimit = 1000
let cacheCount = 0

function compilePath(path,options){
    const cacheKey = `${options.end}${options.strict}${options.sensitive}`
    const pathCache = cache[cacheKey] || (cache[cacheKey] = {})

    if(pathCache[path]) return pathCache[path]

    const keys = [];

    const regexp = pathToRegexp(path,keys,options)
    const result = {regexp,keys}

    if(cacheCount < cacheLimit){
        pathCache[path] = result
        cacheCount++
    }

    return result
}
function matchPath(pathname,options = {}){
    if(typeof options === "string") options = {path:options}

    const {path,exact = false,strict = false,sensitive = false} = options

    const paths = [].concat(path)

    return paths.reduce((matched,path)=>{
        if(!path) return null
        if(matched) return matched

        const {regexp,keys} = compilePath(path,{
            end:exact,
            strict,
            sensitive
        })
        const match = regexp.exec(pathname)

        if(!match) return null

        const [url,...values] = match
        const isExact = pathname === url

        if(exact && !isExact) return null

        return {
            path,
            url:path === '/' && url === '' ? '/' : url,
            isExact,
            params:keys.reduce((memo,key,index) => {
                memo[key.name] = values[index]
                return memo
            },{})
        }
    },null)
}
const RouterContext = React.createContext()
class BrowserRouter extends Cmponent{
    constructor(props){
        super(props)

        this.history = createBrowserHistory(this.props)
        this.state= {
            location:this.history.location
        }

        this.unlisten = this.history.listen(location => {
            this.setState({location})
        })
    }

    componentWillUnmount(){
        if(this.unlisten){
            this.unlisten()
        }
    }

    render(){
        return(
            <RouterContext.Provider value={{history:this.history,location:this.state.location}} children={this.props.children}/>
        )
    }
}
class Route extends Component{
    constructor(props){
        super(props)
    }
    
    render(){
        return(
            <RouterContext.Consumer>
                {context => {

                    const location = context.location

                    const match = matchPath(location.pathname,this.props)

                    const props = {...context,match}

                    const {children,component,render} = this.props

                    if(children && typeof children === 'function') {
                        children = children(props)
                    }

                    return (
                        <RouterContext.Provider value={props}>
                            {
                                children 
                                ? children 
                                : props.match
                                ? component 
                                    ? React.createElement(component) 
                                    : render 
                                    ? render(props) 
                                    : null
                                :null
                            }
                        </RouterContext.Provider>
                    )
                }}
            </RouterContext.Consumer>
        )
    }
}
export {
    BrowserRouter,
    Route
}
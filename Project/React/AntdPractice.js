import React from "react";
import {Input,Button} from "antd";

//创建高阶组件，扩展现有表单，事件处理，数据收集，校验
function FormCreate(Comp){
    return class extends React.Component{

        constructor(props){
            super(props);

            this.options = {};
            this.state = {}
        }

        handleChange = (e) => {
            const {name,value} = e.target
            this.setState({[name]:value},()=>{
                this.validateField(name);
            })
        }

        validateField = field => {
            //1.获取校验规则
            const rules = this.opotions[field].rules
            //都失败返回true，任意项成功返回false
            const ret = !rules.some(rule => {
                if(rule.required){//required存在
                    if(!this.state[field]){
                        //校验失败
                        this.setState({
                            [field + 'Message']:rule.message
                        })
                        return true;
                    }
                }
            })
            if(ret){
                this.setState({
                    [field+'message']:''
                })
            
            }
            return ret;
        }

        //校验所有字段
        validate = cb => {
            const rets = Object.keys(this.options).map(field => this.validateField(field));
            const ret = rets.every(v => v==true);
            cb(ret,this.state)
        }


        //创建input包装器
        getFieldDec = (field,options) => {
            //保存当前输入配置项，React.cloneElement(ele,[props],[...children]),props与原始ele的props浅层合并
            this.state[field] = options;

            return InputComp => (
                <div> 
                    {React.cloneElement(InputComp,{
                        name:field,
                        //{rules:[{required:true,maessage:"need"}]}
                        value:this.state[field] || '',
                        onChange:this.handleChange
                    })}
                </div>
            )
        }

        render(){
            return <Comp getFielDec={this.getFeldDec} validate={this.validate}></Comp>
        }
    }

}


@FormCreate
class Form extends React.Component{
    onSubmit = ()=>{
        //校验所有项
        this.props.validate((isValid,data)=>{
            if(isValid){
                //提交登录
                console.log('登录',data);
            }else{
                alert('校验失败')
            }
        })
    }

    render(){
        const {getFieldDec} = this.props
        return (
            <div>
                {getFieldDec('uname',{rules:[{required:true,maessage:"need"}]})(<Input></Input>)}
                {getFieldDec('pwd',{rules:[{required:true,maessage:"need"}]})(<Input type="password"></Input>)}
                <Button onClick={this.onSubmit}>登录</Button>
            </div>
        )
    }
}

export default Form
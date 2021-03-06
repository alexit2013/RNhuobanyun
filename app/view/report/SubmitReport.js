import React, { Component } from 'react';
import {
Image,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  ListView,
  TextInput,
  CameraRoll,
  NativeModules,
  ScrollView,
  Alert,
  Dimensions
  } from 'react-native';
import styles from "./style";
import api from "../../network/ApiHelper";
import Icon from 'react-native-vector-icons/FontAwesome';
import Icons from 'react-native-vector-icons/Ionicons';
import NavigationBar from 'react-native-navbar';
import NavLeftView from '../common/NavLeftView'
var {height, widths} = Dimensions.get('window');
var BusyIndicator = require('react-native-busy-indicator');
var loaderHandler = require('react-native-busy-indicator/LoaderHandler');
var copyuser=null;
var typeName="";

import {downLoadFiles} from '../common/DownLoadFile.js'
import InputScrollView from 'react-native-inputscrollview';

export default class SubmitReport extends React.Component {
  constructor(props) {
    super(props);
    const nav = this.props.nav;
    this.state = {
      isCreat: true,
      isClick:false,
      reportDetail: [],
      templateItem: [],
      tasteruser: [],
      reportCon: [],
      imageData: [],
      oldimageData: [],
      copyToItem:null,
      oldimg:[],
      newarr:[],
      islock:false,
      isfirst:true,
      isFetch:false,
      reportData: this.props.reportItems
    };
  };
  componentDidMount() {
    //获取汇报类型
    switch(this.props.reportItems.type){
      case 0:
        typeName = "日报";
        break;
      case 1:
        typeName = "周报";
        break;
      case 2:
        typeName = "月报";
        break;
      default:
        break;
    }
    if (this.props.reportItems.Id != 0) {
      this.setState({
        isCreat: false
      });
      loaderHandler.showLoader("加载中...");
      api.Report.getReportDetail(this.props.reportItems.Id)
        .then((resData)=> {
          loaderHandler.hideLoader();
            if(resData.Type==1){
              if(resData.Data.IsLocked==1){
                //锁定 不显示保存和提交按钮
                this.setState({islock:true});
              }
              this.setState({
                reportDetail: resData.Data,
                copyToItem:resData.Data.CC,
                oldimageData: resData.Data.Attachments
              });

              var oldimg=resData.Data&&this.state.oldimageData!= null && this.state.oldimageData.length > 0&&this.state.oldimageData && this.state.oldimageData.filter((item)=> {
                  if(item.Name.indexOf(".png")!=-1||item.Name.indexOf(".jpg")!=-1||item.Name.indexOf(".jpeg")!=-1){
                    return item;
                  }});
              if(!oldimg){
                oldimg=[];
              }
              else{
                this.setState({oldimg:oldimg});}
              this.setState({isFetch:true});
            }else{
              this.setState({isFetch:false});
            }
    });}
    loaderHandler.showLoader("加载中...");
    api.Report.getReportTemplate(this.props.reportItems.type, this.props.reportItems.dateTarget)
      .then((resData)=> {
        loaderHandler.hideLoader();
        this.setState({
          templateItem: resData.Data,
        });
        this.setState({isFetch:true});
      });
    api.Report.getTasterAndRules()
      .then((resData)=> {
        this.setState({tasteruser: resData.tasterusers})
      });
    this.forceUpdate();
  };
  uploadImages() {
    var nums = 3 - (this.state.oldimg.length + this.state.imageData.length);
    this.props.nav.push({
      id: 'PhotoSelector',
      num: nums,
      getSelImg: (images)=> {
        this.getImgs(images)
      }
    })
  }

  getImgs(asset){
    var _this = this;
    var results=asset.map((item)=> {
      var name=item.node.image.uri.split('/').pop();
      var getType=item.node.type.substring(item.node.type.lastIndexOf("/")+1,item.node.type.length);
      return {
        uri: item.node.image.uri,
        name: name+"."+getType
      };
    });
    if(_this.state.imageData&&_this.state.imageData.length!=0){
      //不是第一次传
      for (var i=0; i < results.length; i++) {
        _this.state.imageData.push(results[i])
      }
    }
    if(_this.state.imageData&&_this.state.imageData.length==0){
      _this.state.imageData=results;
    }
    _this.setState({
      imageData: _this.state.imageData
    });
  }
  downLoadfiles(fileName,fileUrl){
    downLoadFiles(fileName,fileUrl);
  }
  deleteImage(index) {
    this.state.imageData.splice(index, 1);
    this.forceUpdate();
  }

  deleteoldImage(index) {
    this.state.oldimg.splice(index, 1);
    this.forceUpdate();
  }
  selectCopyTo(){
    var selectorConfig={
      selectorType:0,
      selectorRadio:1,
      getselectorItem:this.userItem.bind(this)
    };
    this.props.nav.push({
      id: 'SelectorMain',
      selectorConfig:selectorConfig
    });
  }
  userItem(selectedItem){
    if(selectedItem!=""){
    this.setState({copyToItem: selectedItem});}
  }
  submitReport(position) {
    var istemp = 0;
    if (position == 0) {
      //保存
      istemp = 1;
    }
    var reportData = this.state.reportData;
    var body ="";
    var conpytouser=null;
    if(this.state.templateItem.templates!=null) {
      /**
       * 有汇报模板
       */
      if(this.state.reportDetail.length!=0&&this.state.reportDetail.Body!=""){
        ToastAndroid.show('汇报模版已更新,禁止修改！',ToastAndroid.SHORT);
        return;
      }
      if(this.state.reportDetail.length!=0){
        //修改汇报
        for (var i = 0; i < this.state.templateItem.templates.length; i++) {
          if (this.state["reportCon" + i] == null && this.state.reportDetail != "") {
            this.state["reportCon" + i] = this.state.reportDetail.ExtendPropertyInfos[i].Body;
          }
          if(this.state["reportCon" + i] != ""){
            this.state.reportCon.push(this.state["reportCon" + i]);
          }
          if (this.state["reportCon" + i] == "") {
            ToastAndroid.show('输入项不能为空！',ToastAndroid.SHORT);
            this.state.reportCon=[];
            return;
          }
        }
      }
      if(this.state.reportDetail.length==0){
        //创建汇报
        for (var i = 0; i < this.state.templateItem.templates.length; i++) {
          if(this.state["reportCon" + i] != ""){
            this.state.reportCon.push(this.state["reportCon" + i]);
          }
          if (this.state["reportCon" + i] == ""||this.state["reportCon" + i] == null) {
            ToastAndroid.show('输入项不能为空！',ToastAndroid.SHORT);
            this.state.reportCon=[];
            return;
          }
        }
      }
      //根据web端汇报的设计规则,每一项内容之间用#huobanyunReport#隔开
      body = this.state.reportCon.join('#huobanyunReport#')
    }
    else
    {
      if(this.state.reportDetail.length!=0&&this.state.reportDetail.Body==""){
        ToastAndroid.show('汇报模版已更新,禁止修改！',ToastAndroid.SHORT);
        return;
      }
      //没有汇报模板
      if(this.state.reportDetail.length!=0){
        //修改模板
        if (this.state.reportCons==null) {
          this.state.reportCons=this.state.reportDetail.Body
        }
        if(this.state.reportCons==""){
          ToastAndroid.show('输入项不能为空！',ToastAndroid.SHORT);
          return;
        }
      }
      if(this.state.reportDetail.length==0){
        if(this.state.reportCons==""||this.state.reportCons==null){
          ToastAndroid.show('输入项不能为空！',ToastAndroid.SHORT);
          return;
        }
      }
      body = this.state.reportCons;
    }

    if(this.state.copyToItem!=null){
      conpytouser=this.state.copyToItem&&this.state.copyToItem.map((item)=>{
          return(
            item.Id
          )
        });
    }
    var fileData = this.state.imageData && this.state.imageData.map((item, index)=> {
        return {
          uri: item.uri,
          name: item.name
        };
      });
    if (this.state.isCreat) {
      loaderHandler.showLoader("请稍等。。。");
      api.Report.createReport(body,reportData.type,reportData.dateTarget,conpytouser,istemp,fileData)
        .then((resData)=> {
          loaderHandler.hideLoader();
          if(resData.Type!=1){
            ToastAndroid.show((resData.Data==undefined||resData.Data==null)?"未知错误":resData.Data,ToastAndroid.SHORT);
          }
          if(resData.Type==1&&istemp==1&&resData.Data.Id!=0){
            //保存
            ToastAndroid.show('保存成功！',ToastAndroid.SHORT);
            this.props.updateState(true,true,resData.Data.Id);
          }
          if(resData.Type==1&&istemp==0&&resData.Data.Id!=0){
            //提交
            ToastAndroid.show('提交成功！',ToastAndroid.SHORT);
            this.props.updateState(true,false,resData.Data.Id);
          }
          this.props.nav.pop();
        })
      .catch(()=>{loaderHandler.hideLoader();ToastAndroid.show('服务器异常，请检查网络',ToastAndroid.SHORT);})
    }
    else {
      if(position==1){
        //点击提交汇报
        if(this.state.reportDetail.IsLocked==1){
           Alert.alert(
            '提示',
          '汇报被锁定，无法修改！',
          [
            {text: '确定'},
          ]
       	)
          return;
        }
      }
      if(this.props.reportItems.submitted&&!this.props.reportItems.isTemp){
        //只能提交（已提交状态的）   修改状态下才会有的状态
        istemp=0;
      }
      var attachmentsId=[];
      if(this.state.oldimg!=null){
        let imgArr=[];
        imgArr=this.state.oldimg.concat(this.state.imageData);
        attachmentsId = imgArr.map((item, index)=> {
          return (item.Id)
        });
      }
      else{
        attachmentsId=null;
      }
      loaderHandler.showLoader("请稍等。。。");
      api.Report.updateReport(this.props.reportItems.Id, body, reportData.type, conpytouser, istemp, attachmentsId, fileData)
        .then((resData)=> {
          ToastAndroid.show((resData.Data==undefined||resData.Data==null)?"未知错误":resData.Data,ToastAndroid.SHORT);
          loaderHandler.hideLoader();
          if(resData.Type==1&&istemp==1){
            //保存
            this.props.updateState(true,true);
          }
          if(resData.Type==1&&istemp==0){
            //提交
            this.props.updateState(true,false);
          }
          this.props.nav.pop();
        })
        .catch(()=>{loaderHandler.hideLoader();ToastAndroid.show('服务器异常，请检查网络',ToastAndroid.SHORT);})
    }

  }

  render() {
    var tasteruser = this.state.tasteruser && this.state.tasteruser.map((item, index)=> {
        return (
          item.name
        )
      });
     copyuser=this.state.copyToItem&&this.state.copyToItem.map((item)=>{
        return(
          item.Name
        )
      });
    return (
      <View style={styles.submitCon}>
        <NavigationBar
          style={styles.NavSty}
          leftButton={
          <NavLeftView nav={this.props.nav} leftTitle={this.state.isCreat?'写'+typeName:'修改'+typeName}/>
                   }
          rightButton={
                <View style={{justifyContent: 'center'}}>
                {
                 this.state.islock?null:this.props.reportItems.submitted&&!this.props.reportItems.isTemp?
                 <TouchableOpacity style={{marginRight:10,justifyContent: 'center'}} onPress={this.submitReport.bind(this,0)}>
                    <Text numberOfLines={1} style={styles.rightNavText}>提交</Text>
                 </TouchableOpacity>:
                 <View style={{justifyContent: 'center',flexDirection: 'row'}}>
                 <TouchableOpacity style={{marginRight:10}} onPress={this.submitReport.bind(this,0)}>
                    <Text numberOfLines={1} style={styles.rightNavText}>保存</Text>
                      </TouchableOpacity>
                       <TouchableOpacity style={{marginRight:10}} onPress={this.submitReport.bind(this,1)}>
                    <Text numberOfLines={1} style={styles.rightNavText}>提交</Text>
                      </TouchableOpacity></View>
                }
                </View>
              } />
        {this.state.isFetch?<View style={{flex:1}}>
          <View style={styles.reportTitle}>
            {this.state.isCreat ? <Text style={{fontSize: 16,fontWeight:'bold',color:'black'}}>{this.state.templateItem.title}</Text>
              : <Text style={{fontSize: 16,fontWeight:'bold',color:'black'}}>{this.state.reportDetail.Title}</Text>}
          </View>
          <InputScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.conView}>
              {
                this.state.isCreat ?
                  this.state.templateItem.templates==null
                    ?<View
                    style={[styles.conViews,{borderColor: '#ECEFF1', borderWidth: 1}]}>
                    <TextInput
                      style={{height:100,textAlignVertical:'top'}}
                      multiline={true}
                      onChangeText={(text) => this.setState({ reportCons: text})}
                      underlineColorAndroid="transparent"
                      />
                  </View> :
                  this.state.templateItem.templates && this.state.templateItem.templates.map((item, index)=> {
                    return (
                      <View key={index}>
                        <View style={styles.tempTitle}><Text style={{fontSize: 15,color:'black'}}>{item}</Text></View>
                        <View
                          style={[styles.conViews,{borderColor: '#ECEFF1', borderWidth: 1}]}>
                          <TextInput
                            style={{height:100,textAlignVertical:'top'}}
                            placeholder={item}
                            multiline={true}
                            onChangeText={(text) => this.setState({ ['reportCon' + index]: text})}
                            textAlignVertical={'top'}
                            underlineColorAndroid="transparent"
                            />
                        </View>
                      </View>
                    )
                  }) :
                  this.state.reportDetail.ExtendPropertyInfos && this.state.reportDetail.ExtendPropertyInfos.length==0
                    ?<View
                    style={[styles.conViews,{borderColor: '#ECEFF1', borderWidth: 1}]}>
                    <TextInput
                      style={{height:100}}
                      multiline={true}
                      defaultValue={this.state.reportDetail.Body}
                      onChangeText={(text) => this.setState({ reportCons: text})}
                      textAlignVertical={'top'}
                      underlineColorAndroid="transparent"
                      />
                  </View>:this.state.reportDetail.ExtendPropertyInfos && this.state.reportDetail.ExtendPropertyInfos.map((item, index)=> {
                    return (
                      <View key={index}>
                        <View style={styles.tempTitle}><Text style={{fontSize: 15,color:'black'}}>{item.Name}</Text></View>
                        <View
                          key={index}
                          style={[styles.conViews,{borderColor: '#ECEFF1', borderWidth: 1}]}>
                          <TextInput
                            style={{height:100}}
                            multiline={true}
                            defaultValue={item.Body}
                            onChangeText={(text) => this.setState({ ['reportCon' + index]: text})}
                            textAlignVertical={'top'}
                            underlineColorAndroid="transparent"
                            />
                        </View>
                      </View>
                    )
                  })

              }
            </View>
            <View style={styles.attView}>
              <Icon
                name="paperclip"
                size={20}
                color="black"
                style={{ width: 20,height: 20,color: "black",justifyContent: 'center'}}
                />
              <Text style={{fontSize: 16,fontWeight:'bold',color:'black'}}>附件</Text>
            </View>
            <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
              {

                this.state.oldimg != null && this.state.oldimg.length > 0 ?
                this.state.oldimg && this.state.oldimg.map((item, index)=> {
                  return (
                    <View key={index} style={{padding:10}}>
                      <Image
                        resizeMode='cover'
                        source={{uri:item.Url}}
                        style={{width: 70,height: 85}}
                        />
                      <Icons name='ios-close-circle'
                             size={26}
                             color='#C7254E'
                             onPress={this.deleteoldImage.bind(this,index)}
                             style={{width: 28, height: 28,position: 'absolute',top:-3,right:-3}}/>
                    </View>
                  )
                })
                  : null
              }
              {
                this.state.imageData && this.state.imageData.map((item, index)=> {
                  return (
                    <View key={index} style={{padding:10}}>
                      <Image
                        resizeMode='cover'
                        source={{uri:item.uri}}
                        style={{width: 70,height: 85}}
                        />
                      <Icons name='ios-close-circle'
                             size={26}
                             color='#C7254E'
                             onPress={this.deleteImage.bind(this,index)}
                             style={{width: 28, height: 28,position: 'absolute',top:-3,right:-3}}/>
                    </View>
                  )
                })
              }
              {
                this.state.imageData.length>=3||this.state.oldimg.length>=3||(this.state.imageData.length+this.state.oldimg.length)>=3?
                  null:<TouchableOpacity onPress={this.uploadImages.bind(this)}>
                  <View style={styles.addimageView}>
                    <Icons name='ios-add'
                           size={50}
                           color='#737373'
                           onPress={this.uploadImages.bind(this)}
                      />
                  </View></TouchableOpacity>
              }
            </View>
            <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
              {
                this.state.oldimageData && this.state.oldimageData.map((filesitem, index)=> {
                  if(filesitem.Name.indexOf(".png")==-1&&filesitem.Name.indexOf(".jpg")==-1&&filesitem.Name.indexOf(".jpeg")==-1){
                    return (
                      <TouchableOpacity  key={index} onPress={this.downLoadfiles.bind(this,filesitem.Name,filesitem.DownloadUrl)}>
                        <View style={{flexDirection: 'row',padding:5}}>
                          <Icon
                            name="file"
                            size={20}
                            color='#F0AD4E'
                            style={{width:25}}
                            />
                          <Text style={{color:'black',marginLeft:5}}>{filesitem.Name}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                })
              }
            </View>

            <View style={{borderColor:'#ECEFF1',borderWidth: 1,marginTop:10}}>
              <View style={styles.tasterView}>
                <Text style={styles.dedailText}>审阅人：
                  {tasteruser.join(',')}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={this.selectCopyTo.bind(this)}>
              <View style={styles.newView}>
                <View style={styles.tasterView}>
                  {this.state.copyToItem==null?<Text style={[styles.dedailText,{width:Dimensions.get('window').width-60}]}>抄送人：未设置</Text>
                    :<Text style={[styles.dedailText,{width:Dimensions.get('window').width-60}]}>抄送人：{copyuser.join(',')}</Text>}
                </View>

                <View style={{ alignItems: 'center',justifyContent: 'center',}}>
                  <Icon
                    name='angle-right'
                    size={30}
                    style={{ width: 30,color: "#000"}}
                    />
                </View>

              </View>
            </TouchableOpacity>

          </InputScrollView>
        </View>:null}

        <BusyIndicator color='#EFF3F5' loadType={1} loadSize={10} textFontSize={15} overlayColor='#4A4A4A' textColor='white' />
      </View>
    );
  }
};


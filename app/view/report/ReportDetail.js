/**
 * Created by wangshuo on 2016/2/16.
 */
'use strict';

import React, {
  Image,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  ListView,
  TextInput,
  CameraRoll,
  ScrollView,
  NativeModules,
  Linking
  } from 'react-native';
import styles from "./style";
import NavToolbar from '../navigation/navToolBar/NavToolBar.android';
var Dimensions = require('Dimensions');
import api from "../../network/ApiHelper";
import Icon from 'react-native-vector-icons/FontAwesome';
import Icons from 'react-native-vector-icons/Ionicons';
var {height, width} = Dimensions.get('window');
var Modal = require('react-native-modalbox');
var loaderHandler = require('react-native-busy-indicator/LoaderHandler');
var BusyIndicator = require('react-native-busy-indicator');
var navs=null;
var typeName="";
import {downLoadFiles} from '../common/DownLoadFile.js'


export default class ReportDetail extends React.Component {
  constructor(props) {
    super(props);
    const nav = this.props.nav;
    navs=this.props.nav;
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      reportDetail:[],
      tasteruser:[],
      ccUser:[],
      imageData:[],
      imageUrl:"",
      imgurl:"",
      imgurls:[],
      reportData: this.props.reportItem,
    };
  };
  componentDidMount() {
    switch(this.props.reportItem.type){
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
    if(this.props.reportItem.Id!=0){
      this.setState({
        isCreat:false
      });
      api.Report.getReportDetail(this.props.reportItem.Id)
      .then((resData)=>{
          this.setState({
            reportDetail:resData.Data,
            imageData:resData.Data.Attachments
          });
          var tasteruser = this.state.reportDetail.Auditor && this.state.reportDetail.Auditor.map((item, index)=> {
              return (
                item.Name
              )
            });
          var ccUser = this.state.reportDetail.CC && this.state.reportDetail.CC.map((item, index)=> {
              return (
                item.Name
              )});
          var imgurlTemp=resData.Data && resData.Data.Attachments&&resData.Data.Attachments.filter((imgitem)=> {
              if(imgitem.Name.indexOf(".jpg")!=-1||imgitem.Name.indexOf(".png")!=-1||imgitem.Name.indexOf(".jpeg")!=-1){return imgitem}
            });
          var imgurls=resData.Data&&imgurlTemp&&imgurlTemp.length>0&&imgurlTemp.map((urlItem)=>{
              return urlItem.DownloadUrl;
            });
          this.setState({
            tasteruser:tasteruser,
            ccUser:ccUser,
            imgurls:imgurls
          })
        })
    }
  };
  openImg(imgindex){
    this.props.nav.push({
      id: 'ImagesViewer',
      imageUrls:this.state.imgUrls,
      imgindex:imgindex
    });
  }
  downLoadfiles(fileName,fileUrl){
    downLoadFiles(fileName,fileUrl);
  }
  backreportlist(){
    //if(this.props.reportItem.typeName=="subordinate"){
    //this.props.nav.immediatelyResetRouteStack([{id:'ReportMain'},{
    //  id: 'SubordinateReport',
    //  type:this.props.reportItem.type,
    //  userid:this.props.reportItem.userId,
    //  username:this.props.reportItem.username
    //}]);}
    //if(this.props.reportItem.typeName=="receivedReport"){
    //  this.props.nav.pop();
    //}
    this.props.nav.pop();
  }
  render() {
    return (
      <View style={styles.submitCon}>
        <NavToolbar
          navIconName={"android-arrow-back"}
          title={typeName+'详情'}
          onClicked={this.backreportlist.bind(this)}/>
        <View style={styles.reportTitle}>
          <Text style={{fontSize: 16,fontWeight:'bold',color:'black'}}>{this.state.reportDetail.Title}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps={true}>
        <View style={styles.detailView}>
          {
            this.state.reportDetail.Body!=""
              ? <View
              style={styles.detailBody}>
              <View style={styles.detailBodys}>
                <ScrollView keyboardShouldPersistTaps={true}>
                  <Text style={{fontSize: 14,color:'black'}}>{this.state.reportDetail.Body}</Text>
                </ScrollView>
              </View>

            </View>:
            this.state.reportDetail.ExtendPropertyInfos && this.state.reportDetail.ExtendPropertyInfos.map((item, index)=> {
              return (
                <View
                  key={index}
                  style={styles.detailName}>
                  <View style={styles.detailNames}>
                    <Text style={{fontSize: 15,fontWeight:'bold',color:'black'}}>{item.Name}</Text>
                  </View>
                  <View style={styles.detailBod}>
                    <Text style={{fontSize: 14,color:'black'}}>{item.Body}</Text>
                  </View>

                </View>
              )
            })
          }
        </View>

          {this.state.imageData&&this.state.imageData.length>0?<View style={styles.attView}>
            <Icon
              name="paperclip"
              size={20}
              style={{ width: 20,height: 20,color: "black",justifyContent: 'center'}}
              />
            <Text style={{fontSize: 16,fontWeight:'bold',color: "black"}}>附件</Text>
          </View>:null}
        <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
          {
            this.state.imageData && this.state.imageData.map((item, index)=> {
              return (
                <TouchableOpacity key={index} onPress={this.openImg.bind(this,index)}>
                  <View key={index} style={{padding:10}}>
                      <Image
                        source={{uri:item.Url}}
                        resizeMode='stretch'
                        style={{width: 70,height: 85}}
                        />
                    </View>
                </TouchableOpacity>
              )
            })
          }
        </View>
          <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
            {
              this.state.imageData && this.state.imageData.map((filesitem, index)=> {
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
              {this.state.tasteruser.join(',')}
            </Text>
          </View>
        </View>

          <View style={{borderColor:'#ECEFF1',borderWidth: 1,marginTop:10}}>
            <View style={styles.tasterView}>
              {this.state.ccUser!=""?<Text style={styles.dedailText}>抄送人：{this.state.ccUser.join(',')}</Text>
                :<Text style={styles.dedailText}>抄送人：未设置</Text>}

            </View>
          </View>

          </ScrollView>
        <BusyIndicator color='#EFF3F5' loadType={1} loadSize={10} textFontSize={15} overlayColor='#4A4A4A' textColor='white' />
      </View>
    );
  }
};

import React, {Component} from 'react'
import {
  Image,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  ListView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TouchableHighlight,
  TextInput,
  CameraRoll,
  Modal,
  Dimensions
} from 'react-native';

import styles from "./style";
var {height, width} = Dimensions.get('window');  //获取屏幕宽高
import api from "../../network/ApiHelper";
import Icon from 'react-native-vector-icons/Ionicons'
import Icons from 'react-native-vector-icons/FontAwesome'
import colorManager from '../common/styles/manager';
import {downLoad} from '../../network/utils/Http.js';
var firstLoad=false;
var loaderHandler = require('react-native-busy-indicator/LoaderHandler');
var BusyIndicator = require('react-native-busy-indicator');
import ScrollableTabView from 'react-native-scrollable-tab-view';
import Comment from '../common/Comment.js';
var HTMLView = require('react-native-htmlview');
var activityData=new ListView.DataSource({
  rowHasChanged: (row1, row2) => row1 !== row2,
});
var that;
var _this;
var commentConfig;
var favorflag=false;
var comflag=false;
var receipt=false;
var oneData=[];

//列表的每一项的数据。单独书写,目的是有新数据（发送/删除）的时候避免数据混乱
class Cell extends Component {
  constructor(props){
    super(props);
    const nav = this.props.nav;
    this.state = {
      tempObj:[],
      itemText:"",
      imgUrls:[],
      favorflag:false,
      isAnnouncement:false
    };
    that=this;
  }
  //回调给详情页
  getActivitiesInfo(activityId){
    this.props.nav.push({ id: 'ActivitiesDetail',
      activityId:activityId,
      getfavorandcomNum:(fnum,cnum,favored)=>{this.getfavorandcomNum(fnum,cnum,favored)},
      getIsReceipt:(isReceipt)=>{this.getIsReceipt(isReceipt)},
      deleteactivity:(activityId,index)=>{_this.deleteActivity(activityId,index)},
      indexId:this.props.rowID,
      type:this.props.actType,
      project:_this.props.project,
      reloadList:_this.reloadProList.bind(_this),
  })}
  getIsReceipt(isReceipt){
    if(isReceipt){
      receipt=true;
      this.setState({itemText:"已回执"});
    }
  }
  getfavorandcomNum(fnum,cnum,isfavored){
      comflag=true;
      favorflag=true;
      if(fnum==null){
        fnum=this.state.favorNum
      }
      if(cnum==null){
        cnum=this.state.commentNum
      }
     this.setState({favorNum:fnum,commentNum:cnum,favored:isfavored});
  }
  commentAct(activityId){
    this.props.nav.push({ id: 'ActivitiesDetail',
      activityId:activityId,
      getfavorandcomNum:(fnum,cnum,favored)=>{this.getfavorandcomNum(fnum,cnum,favored)},
      deleteactivity:(activityId,index)=>{_this.deleteActivity(activityId,index)},
      isfouces:1,
      type:this.props.actType})
  }
  toggleLike(activityId){
    api.Activity.toggleLikeState(activityId)
      .then((resData)=>{
        if(resData.Type==1){
          if(resData.Data=='收藏成功'){
            favorflag=true;
            this.setState({
              favorNum:this.state.favorNum+1,
              favored:true
            })
          }
          else{
            favorflag=true;
            this.setState({
              favorNum:this.state.favorNum-1,
              favored:false
            })
          }
        }else{
          ToastAndroid.show((resData.Data==undefined||resData.Data==null)?"未知错误":resData.Data,ToastAndroid.SHORT);
        }
      })

  }
  openImgs(imgindex){
    this.props.nav.push({
      id: 'ImagesViewer',
      imageUrls:this.state.imgUrls,
      imgindex:imgindex
    });
  }
  render() {
    var item=this.props.item;
    var tempObj=item && item.Items!=""&&item.Items.filter((tempitem)=> {
        if(tempitem.TenantType=='Receipt'||tempitem.TenantType=='Vote'){return tempitem}
      });
    if(tempObj&&tempObj.length>0&&tempObj[0].hasOwnProperty('TenantType')&&tempObj[0].TenantType=="Vote"){
      this.state.itemText="投票："+tempObj[0].Title;
    }
    if(tempObj&&tempObj.length>0&&tempObj[0].hasOwnProperty('TenantType')&&tempObj[0].TenantType=="Receipt"){
      if(tempObj[0].HasVoted){

          this.state.itemText="已回执"


      }
      else if(tempObj[0].hasOwnProperty('WasCreator')&&tempObj[0].WasCreator){
        if(tempObj[0].hasOwnProperty('Options')&&tempObj[0].Options.length>0){
          var isReceiptednums=0;
          for(var i=0;i<tempObj[0].Options.length;i++){
            isReceiptednums+=tempObj[0].Options[i].Count
          }
        }
        var isReceiptnums=0;
        if(tempObj[0].hasOwnProperty('UnreceiptedUsers')&&tempObj[0].UnreceiptedUsers.length>0){
          isReceiptnums=tempObj[0].UnreceiptedUsers.length
        }

          this.state.itemText='已回执'+isReceiptednums+'人'+'/'+'未回执'+isReceiptnums+'人';


      }
      else{
        if(!receipt){
          this.state.itemText="未回执";
        }

      }
    }
    let announcementObj=[];
    announcementObj=item&&item.Items!=""&&item.Items.filter((tempItem)=>{
        if(tempItem&&tempItem.length!=0&&tempItem.hasOwnProperty("TenantType")&&tempItem.TenantType=="Announcement"){
          return tempItem;
        }
      });
    var announcementTil="";
    if(announcementObj.length!=0&&announcementObj){
      this.state.isAnnouncement=true;
      announcementTil=item&&item.Items!=""&&item.Items[0].Title;
    }else{
      this.state.isAnnouncement=false;
      announcementTil="";
    }
    var imgurls=item&&item.Images&&item.Images.map((urlItem)=>{
        return urlItem.DownloadUrl;
      });
    if(imgurls&&imgurls.length!=0){
      this.state.imgUrls=imgurls;
    }
    if(!favorflag){
    this.state.favored=item&&item.IsFavorite;
    this.state.favorNum=item&&item.FavorAmount;}
    if(!comflag){
     this.state.commentNum=item&&item.CommentAmount;
    }
    this.state.tempObj=tempObj;

    var body="<p>"+item.Body+"</p>";
    return (
      <View>
        <TouchableOpacity onPress={this.getActivitiesInfo.bind(this,item&&item.Id)} activeOpacity={0.5}>
      <View style={styles.activityItemView}>
        <View style={styles.itemHead}>
          <Image
            source={{uri:item&&item.UserCreated.Avatar}}
            style={styles.itemUserimg}
            />
          <View style={styles.itemnamesope}>
            <Text style={styles.itemNamesope}>{item&&item.UserCreated.Name}</Text>
            <View style={{width:Dimensions.get('window').width-90,flexDirection: 'row',justifyContent: 'space-between'}}>
              <View style={{flexDirection: 'row',alignItems:'center'}}>
              <Text onPress={()=>{
               this.props.nav.push({
                  id: 'ActivityScopesDetail',
                  activityId:item&&item.Id
                });
              }}style={[styles.scopeText,{width:Dimensions.get('window').width*0.6}]} numberOfLines={1}>--{item.Scopes==""?"我自己":item.Scopes}</Text>
              {
                this.state.isAnnouncement?<View style={styles.AnnouncementView}>
                <Text style={[styles.scopeText,{color:'white'}]}>公告</Text>
                </View>:null
              }
              </View>
              <Text style={styles.scopeText}>{item&&item['CreateDate']}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={this.getActivitiesInfo.bind(this,item&&item.Id)}>
          {
            item.Body==""?null:announcementTil!=""?<View style={styles.itemBody}>
              <HTMLView
                value={"<p>"+announcementTil+"</p>"}
                onLinkPress={(url) => {
              Linking.openURL(url);
              }}
                stylesheet={baseStyles}
                />
            </View>:<View style={styles.itemBody}>
              <HTMLView
                value={body}
                onLinkPress={(url) => {
              Linking.openURL(url);
              }}
                stylesheet={baseStyles}
                />
            </View>
          }
          <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
            {
              item&&item.Images && item.Images.map((imageItem, index)=> {

                return (
                  <TouchableOpacity key={index} style={{height:90}} onPress={this.openImgs.bind(this,index)}>
                    <View key={index} style={{padding:10}}>
                      <Image
                        source={{uri:imageItem.Url}}
                        resizeMode='cover'
                        style={{width: 70,height: 85}}
                        />
                    </View>
                  </TouchableOpacity>
                )
              })
            }
          </View>
          {this.state.tempObj&&this.state.tempObj.length>0?
            <View style={styles.itemOther}>
              {
                this.state.tempObj&&this.state.tempObj[0].TenantType=="Vote"?
                  <Icons
                  name="list-ul"
                  size={18}
                  color="#2F2F2F"
                  style={{height:20,width:30}}
                  />:
                  <Icons
                    name="reply-all"
                    size={18}
                    color="#2F2F2F"
                    style={{height:20,width:30}}
                    />
              }
               <Text style={[styles.nomText,{fontSize: 14,width:Dimensions.get('window').width-70}]}>{this.state.itemText}</Text>
            </View>:null
          }
        </TouchableOpacity>


        <View style={styles.itemBottom}>
          <TouchableOpacity style={{ flex: 1}} onPress={this.commentAct.bind(this,item&&item.Id,item&&item.UserCreated)}>
          <View style={[styles.itemBottomView,{borderRightColor: '#ECEFF1',borderRightWidth: 1.2}]}>
            <Icons
              name="commenting"
              size={18}
              color="#175898"
              style={{width:25}}
              />
            <Text style={[styles.nomText,{paddingRight:10,textAlign: 'center'}]}>
              <Text style={[styles.countnum]}>{this.state.commentNum}</Text>
            </Text>
          </View>
        </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1}} onPress={this.toggleLike.bind(this,item&&item.Id)}>
            <View style={styles.itemBottomView}>
              <Icons
                name="thumbs-up"
                size={18}
                color={this.state.favored?'#FCC44D':'#175898'}
                style={{width:25}}
                />
              <Text style={[styles.nomText,{paddingRight:5,textAlign: 'center'}]}>
                <Text style={styles.countnum}>{this.state.favorNum}</Text>
              </Text>
            </View>
          </TouchableOpacity>

        </View>

      </View>
        </TouchableOpacity>
        </View>
    );
  }
}
var baseStyles = StyleSheet.create({
  p: {
    color:'black',
    fontSize: 14
  },
  a: {
    fontWeight: '200',
    color: '#0277BD'
  }
});
export default class ActivitiesList extends React.Component {
  constructor(props) {
    super(props);
    const nav = this.props.nav;
    this.state = {
       page:1,
      AllData:[],
      oneData:[],
      hasMore:false,
      firstLoad:false,
      allList: activityData.cloneWithRows({}),
      allLists: activityData.cloneWithRows({}),
      ishave:true,
      ishavedata:false,
      isnodata:false,
      isOpen:false,
      isRefreshControl:false,
      hasActData:true,
      pageData:[],
      isComText:false,
    };
    _this=this;
  };
  componentDidMount(){
    this.state.AllData =[];
    this.state.page= 1;
    firstLoad=true;
    if(this.props.project!=null){
      this.props.loading(0);
    }else{
      loaderHandler.showLoader("加载中...");
    }
    if(this.props.project){
        this.getProjectActivities();
      }else{
        this.getActivities(this.props.actType);
      }
  };
  componentDidUpdate(){
   
  }
  getActivitiesInfo(activityId){
    this.props.nav.push({ id: 'ActivitiesDetail',
      activityId:activityId,
      type:()=>{this.getnnn.bind(this)}});
  }
  getNotice(){
  api.Activity.getValidAnnouncement()
    .then((resData)=>{
      if(resData.Type==1){
      this.setState({
        pageData:resData.Data,
        dataSource:this.state.dataSource.cloneWithPages(resData.Data)
      })}
    })
  };
  reloadProList(){
    api.Project.getProjectActivities(this.props.project.projectId,1)
      .then((resData)=> {
        if (resData.Type == 1) {
          if (resData.Data && resData.Data.length != 0) {
            this.setState({hasActData: true})
          }
          favorflag = false;
          comflag = false;
          var temp = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2});
          this.setState({
            ishavedata: false,
            isRefreshControl: false,
            allList: temp.cloneWithRows(resData.Data)
          });
          this.state.AllData = resData.Data;

        } else {
          this.setState({
            isRefreshControl: false
          });
        }

      })
  }
  getProjectActivities(){
    api.Project.getProjectActivities(this.props.project.projectId,this.state.page)
      .then((resData)=> {
        this.props.loading(1);
        if (resData.Type == 1) {
          if (resData.Data && resData.Data.length == 0 && firstLoad) {
            //第一次加载，且没有数据的时候
            this.setState({hasActData: false});
          }
          if (this.state.AllData.length == 0 && firstLoad) {
            this.state.AllData = resData.Data;
          }
          if (this.state.AllData.length > 0 && this.state.AllData.length < 5) {
            this.setState({ishavedata: false,hasMore: false, page: 1});
          }
          if (resData.Data && resData.Data.length != 0) {
            this.setState({hasActData: true})
          }
          if (!firstLoad) {
            var oldDataLen = this.state.AllData.length;
            this.state.AllData = this.state.AllData.concat(resData.Data);
            if (this.state.AllData.length == oldDataLen) {
              ToastAndroid.show("没有数据咯",ToastAndroid.SHORT);
              this.setState({
                ishavedata: false,
                isRefreshControl: false,
                hasMore: false,
                allList: activityData.cloneWithRows(this.state.AllData)
              });
              return;
            }
          }
          favorflag = false;
          comflag = false;
          this.setState({
            ishavedata: false,
            isRefreshControl: false,
            allList: activityData.cloneWithRows(this.state.AllData)
          });
        } else {
          this.setState({
            isRefreshControl: false
          });
        }

      })
  }
  reloadActList(actType){
    api.Activity.getActivityList(actType, 1, 5, '')
      .then((resData)=> {
        if (resData.Type == 1) {
          if (resData.Data && resData.Data.length != 0) {
            this.setState({hasActData: true})
          }
          favorflag = false;
          comflag = false;
          var temp = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2});
          this.setState({
            ishavedata: false,
            isRefreshControl: false,
            allList: temp.cloneWithRows(resData.Data)
          });
          this.props.isLoadFinish(true);
        } else {
          this.setState({
            isRefreshControl: false
          });
          this.props.isLoadFinish(true);
        }

      })
  }
  getActivities(actType){
    api.Activity.getActivityList(actType,this.state.page,5,'')
    .then((resData)=>{
        loaderHandler.hideLoader();
        if(resData.Type==1){
          if(resData.Data&&resData.Data.length==0&&firstLoad){
            //第一次加载，且没有数据的时候
            this.setState({hasActData:false});
          }
          if(this.state.AllData.length==0&&firstLoad){
            this.state.AllData = resData.Data;
          }
          if(this.state.AllData.length>0&&this.state.AllData.length<5){
            this.setState({hasMore:false});
          }
          if(resData.Data&&resData.Data.length!=0){
            this.setState({hasActData:true})
          }
          if(!firstLoad){
            var oldDataLen=this.state.AllData.length;
            this.state.AllData = this.state.AllData.concat(resData.Data);
            if(this.state.AllData.length==oldDataLen){
              ToastAndroid.show("没有数据咯",ToastAndroid.SHORT);
              this.setState({
                ishavedata:false,
                isRefreshControl:false,
                hasMore:false,
                allList:activityData.cloneWithRows(this.state.AllData)
              });
              return;
            }
          }
          favorflag=false;
          comflag=false;
          this.setState({
            ishavedata:false,
            isRefreshControl:false,
            allList:activityData.cloneWithRows(this.state.AllData)
          });
        }else{
          this.setState({
            isRefreshControl:false
          });
          ToastAndroid.show("未知错误",ToastAndroid.SHORT);
        }

      })

  };
  renderFooter() {
      return (
        this.state.ishavedata&&<View ref='footerView' style={styles.footerView}>
            <View style={{width:30,height:30,justifyContent: 'center'}}> 
            <ActivityIndicator
              animating={true}
              color='blue'
            /></View>
            <Text style={styles.footerText}>
              数据加载中……
            </Text>
        </View>);
  }
  closeN(index){
    var pageIndex = parseInt(index);
    this.state.pageData.splice(pageIndex,1);
    this.setState({
      dataSource:this.state.dataSource.cloneWithPages(this.state.pageData)
    })
  };
  onScroll(e) {
    if(e.nativeEvent.contentOffset.y==0){
      //滑动到了顶部
      this.props.scrollPosition&&this.props.scrollPosition(0);
    }
    if(e.nativeEvent.contentOffset.y>0&&this.state.AllData.length>3){
      //下滑
      this.props.scrollPosition&&this.props.scrollPosition(1);
    }
    this.state.hasMore=true;
  }
  onEndReached(actType){
    if (this.state.hasMore) {
      this.state.page++;
      firstLoad=false;
      this.setState({ishavedata:true});
          if(this.props.project){
        this.getProjectActivities();
      }else{
        switch (actType) {
          case 62:
            this.getActivities(62);
            break;
          case 64:
            this.getActivities(64);
            break;
          case 2:
            this.getActivities(2);
            break;
          case 4:
            this.getActivities(4);
            break;
          case 16:
            this.getActivities(16);
            break;
          case 128:
            this.getActivities(128);
            break;
        }
      }
    }
  };
  onRefresh(actType){
    firstLoad=false;
    oneData=[];
    this.setState({
      page:1,
      AllData:[],
      hasMore:true,
      isRefreshControl:true
    });
    this.state.page = 1;
      if(this.props.project){
      this.getProjectActivities();
    }else{
      switch(actType){
        case 62:
          this.getActivities(62);
          break;
        case 64:
          this.getActivities(64);
          break;
        case 2:
          this.getActivities(2);
          break;
        case 4:
          this.getActivities(4);
          break;
        case 16:
          this.getActivities(16);
          break;
        case 128:
          this.getActivities(128);
          break;
      }
    }

  }
  deleteActivity(activityid,index){
    if(activityid!=null&&index!=null){
      var tid=0;
      switch(index){
        case 62:
          tid=0;
          break;
        case 64:
          tid=1;
          break;
        case 2:
          tid=2;
          break;
        case 4:
          tid=3;
          break;
        case 16:
          tid=4;
          break;
      }
    api.Activity.removeActivity(activityid)
     .then((res)=>{
        if(res.Type==1){
          if(index==128){
            //我赞过的页面
            this.props.nav.immediatelyResetRouteStack([{id: 'MainTabView',selectedTab:'UserCenter'},{
              id: 'MyFavorite'
            }]);
          }
          if(index!=128){
          this.props.nav.immediatelyResetRouteStack([{
            id: 'MainTabView',selectedTab:'Activities'
          }]);}
        }
    })}

  }
  renderContent(){
    return(
        <View style={styles.Acontainer}>
            <ListView
            dataSource={this.state.allList}
            ref="list"
            renderRow={this.activityItem.bind(this)}
            removeClippedSubviews={false}
            enableEmptySections={true}
            onEndReached={this.onEndReached.bind(this,this.props.actType)}
            onEndReachedThreshold={5}
            onScroll={this.onScroll.bind(this)}
            renderFooter={this.renderFooter.bind(this)}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshControl}
                onRefresh={this.onRefresh.bind(this,this.props.actType)}
                title="Loading..."
                colors={['#ffaa66cc', '#ff00ddff', '#ffffbb33', '#ffff4444']}
              />
             }
            />
          {!this.state.hasActData?
            <View style={[styles.noDataView,{top:this.props.project?-100:Dimensions.get('window').height * 0.5 - 150}]}>
              <Icons
                name="exclamation-circle"
                size={50}
                color="#717171"
                />
              <Text style={styles.noruleViewText}>暂无相关数据</Text>
            </View>:null
          }
        </View>
    )
  }
  _renderPage(data,sectionID,index){
    return(
      <View>
        <View style={styles.bonnerView}>
          <View style={styles.Ncontainer}>
            <Icon
              name="volume-medium"
              size={35}
              color="#175898"
              style={styles.Nicon}
              />
            <View style={styles.NrightContainer}>
              <Text style={styles.Ntitle}>{data['Title']}</Text>
              <Text style={styles.Ndata}>{data.DateCreated}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={this.getActivitiesInfo.bind(this,data.Id)}>
            <View style={{padding:10}}>
              <Text numberOfLines={1} style={styles.Nbody}>{data.Body}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Icon name='ios-close' size={26} color='#757678' onPress={this.closeN.bind(this,index)} style={styles.closeIcon}/>
        </View>

    )
  }
  activityItem(item,sectionID, rowID){
    return(<Cell ref="cell" rowID={rowID} key={rowID} item={item} nav={this.props.nav} actType={this.props.actType}/>)
  }
  render() {
    return (
        <View style={{flex:1,backgroundColor:colorManager.getCurrentStyle().BGCOLOR}}>
          {this.renderContent()}
          <BusyIndicator color='#EFF3F5' loadType={1} loadSize={10} textFontSize={15} overlayColor='#4A4A4A' textColor='white' />
        </View>
    );
  }
};



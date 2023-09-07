import Taro from "@tarojs/taro";
import { Component } from "react";
import { View, Map, CoverView, Image } from "@tarojs/components";
import {
  AtTabBar,
  AtActionSheet,
  AtActionSheetItem,
  AtFloatLayout,
  AtCard,
  AtTag,
  AtButton
} from "taro-ui";
import "taro-ui/dist/style/components/tab-bar.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";

export default class Index extends Component {
  state = {
    latitude: null,
    longitude: null,
    speed: null,
    accuracy: null,
    currentTab: 0,
    markers: [],
    showLogin: false,
    token: null,
    groups: [],
    selectedGroup: null,
  };

  async componentDidMount() {
    this.setState({
      token: await Taro.getStorageSync("token"),
    });

    const response = await Taro.request({
      url: "http://localhost:1337/group",
      method: "GET",
      header: {
        "content-type": "application/json",
      },
    });
    const groups = response.data.map((group) => ({
      id: group.id,
      name: group.name,
      tags: JSON.parse(group.tags),
      images: JSON.parse(group.images),
      location: JSON.parse(group.location),
    }));

    console.log(response.data);

    this.setState({
      groups: groups,
    });

    const markers = groups.map((group) => ({
      id: group.id,
      latitude: group.location.latitude,
      longitude: group.location.longitude,
      width: 30,
      height: 40,
      callout: {
        content: group.name,
        color: "#000000",
        fontSize: 14,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#000000",
        padding: 5,
        display: "ALWAYS",
        textAlign: "center",
      },
    }));
    console.log(markers);
    Taro.getLocation({
      type: "wgs84",
      success: (res) => {
        this.setState({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy,
          markers: markers,
        });
      },
    });
  }

  handleTabClick = (value) => {
    this.setState({
      currentTab: value,
    });

    if (value === 1) {
      this.login();
      // create group
      // if (this.state.token) {
      //   Taro.navigateTo({ url: "/pages/newGroup/index" });
      // } else {
      // this.setState({
      //   showLogin: true,
      // });
      // }
    }
  };

  handleMarkerTap = (e) => {
    console.log("marker tap", e);

    const groupId = e.markerId;
    const group = this.state.groups.find((g) => g.id === groupId);
    this.setState({
      selectedGroup: group,
    });
  };

  login = () => {
    Taro.login({
      success: function (res) {
        if (res.code) {
          Taro.request({
            url: "http://localhost:1337/account/login-with-wechat",
            data: {
              code: res.code,
            },
          }).then((res) => {
            if (res.data.token || !this.verifyJWTFormat(res.data.token)) {
              Taro.setStorage({
                key: "token",
                data: res.data.token,
              });

              Taro.navigateTo({ url: "/pages/newGroup/index" });
            } else {
              console.log("登录失败！");
              console.log(res.data);
            }
          });
        } else {
          console.log("登录失败！" + res.errMsg);
        }
      },
    });
  };

  verifyJWTFormat = (jwt) => {
    // Regular expression pattern to match JWT format
    var jwtPattern = /^[\w-]+\.[\w-]+\.[\w-]+$/;

    // Check if the JWT matches the pattern
    var isValidFormat = jwtPattern.test(jwt);

    return isValidFormat;
  };

  handleMapClick = (e) => {
    console.log("map click", e);
    this.setState({
      selectedGroup: null
    })
  }

  render() {
    return (
      <View className='index'>
        <Map
          longitude={this.state.longitude}
          latitude={this.state.latitude}
          markers={this.state.markers}
          onmarkertap={this.handleMarkerTap}
          showLocation
        >
        </Map>
        {this.state.selectedGroup && (
          <View className='group-container'>
            <View className='at-row'>
              <View className='at-col'>
                <Image src='https://cdn.pixabay.com/photo/2023/08/26/17/49/dahlias-8215514_1280.jpg' />
              </View>
              <View className='at-col'>
                <View className='group-name'>{this.state.selectedGroup.name}</View>
                <View className='tags'>
                  {this.state.selectedGroup.tags.map((tag, index) => (
                    <View className='tag-container'>
                      <AtTag key={index} type='primary' circle>
                        {tag}
                      </AtTag>
                    </View>
                  ))}
                </View>
                <View className='member-count'>38</View> 位成员，
                <View className='member-count'>12</View> 场活动
                <View>📍 &nbsp;{this.state.selectedGroup.location.name}</View>
                <View>🧭 &nbsp;距您直线2.3公里</View>
                <View className='actions'><AtButton type='primary' size='small'>加入</AtButton></View>
              </View>
            </View>
          </View>
        )}
        <AtTabBar
          fixed
          current={this.state.currentTab}
          onClick={this.handleTabClick}
          tabList={[
            { title: "地图", iconType: "map-pin" },
            { title: "创建社区", iconType: "add" },
            { title: "捐赠", iconType: "money" },
          ]}
        />
        <AtActionSheet isOpened={this.state.showLogin} cancelText='取消'>
          <AtActionSheetItem onClick={this.login}>微信登录</AtActionSheetItem>
        </AtActionSheet>
      </View>
    );
  }
}

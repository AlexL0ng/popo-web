import Taro from "@tarojs/taro";
import { Component } from "react";
import { View, Map, Image } from "@tarojs/components";
import { AtTabBar, AtTag } from "taro-ui";
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
    token: null,
    groups: [],
    selectedGroup: null,
  };

  async componentDidShow() {
    this.setState({
      token: await Taro.getStorageSync("token"),
    });
  }

  async componentDidMount() {
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

    switch (value) {
      case 1:
        this.createGroup();
        break;
      case 2:
        this.goToProfile();
    }
  };

  goToProfile = () => {
    Taro.navigateTo({ url: "/pages/profile/index" });
  };

  createGroup = async () => {
    Taro.request({
      url: "http://localhost:1337/account/profile",
      method: "GET",
      header: {
        "content-type": "application/json",
        token: await Taro.getStorageSync("token"),
      },
    }).then((res) => {
      console.log(res);
      if (res.statusCode === 200) {
        Taro.navigateTo({ url: "/pages/newGroup/index" });
      } else {
        Taro.navigateTo({ url: "/pages/profile/index" });
      }
    });
  };

  handleMarkerTap = (e) => {
    console.log("marker tap", e);

    const groupId = e.markerId;
    const group = this.state.groups.find((g) => g.id === groupId);
    this.setState({
      selectedGroup: group,
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
      selectedGroup: null,
    });
  };

  getDistance = () => {
    let lat1 = this.state.latitude;
    let lon1 = this.state.longitude;

    let lat2 = this.state.selectedGroup.location.latitude;
    let lon2 = this.state.selectedGroup.location.longitude;

    var earthRadiusKm = 6371;

    var dLat = this.degreesToRadians(lat2 - lat1);
    var dLon = this.degreesToRadians(lon2 - lon1);

    lat1 = this.degreesToRadians(lat1);
    lat2 = this.degreesToRadians(lat2);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = earthRadiusKm * c * 1000;
    if (distance > 1000) {
      return (distance / 1000).toFixed(2) + "公里";
    } else {
      return Math.ceil(distance) + "米";
    }
  };

  degreesToRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  join = () => {
    Taro.request({
      url: "http://localhost:1337/group/join",
      method: "POST",
      header: {
        "content-type": "application/json",
        token: this.state.token,
      },
      data: {
        groupId: this.state.selectedGroup.id,
      },
    }).then((res) => {
      console.log(res);
      if (res.data.success) {
        Taro.atMessage({ message: "加入成功！", type: "success" });
      } else {
        Taro.atMessage({ message: "加入失败！", type: "error" });
      }
    });
  };

  viewGroup = () => {
    Taro.setStorage({
      key: "group",
      data: this.state.selectedGroup,
    }).then((res) => {
      console.log(res);
      Taro.navigateTo({
        url: "/pages/group/index",
      });
    });
  };

  render() {
    return (
      <View className="index">
        <Map
          longitude={this.state.longitude}
          latitude={this.state.latitude}
          markers={this.state.markers}
          onmarkertap={this.handleMarkerTap}
          showLocation
        ></Map>
        {this.state.selectedGroup && (
          <View className="group-container" onClick={this.viewGroup}>
            <View className="at-row">
              <View className="at-col-5">
                <Image src={this.state.selectedGroup.images[0]} />
              </View>
              <View className="at-col-7">
                <View className="group-name">
                  {this.state.selectedGroup.name}
                </View>
                <View className="tags">
                  {this.state.selectedGroup.tags.map((tag, index) => (
                    <View className="tag-container">
                      <AtTag key={index} type="primary" circle>
                        {tag}
                      </AtTag>
                    </View>
                  ))}
                </View>
                <View className="count">38</View> 位成员，
                <View className="count">12</View> 场活动
                <View className="address">
                  📍 &nbsp;{this.state.selectedGroup.location.name}
                </View>
                <View>🧭 &nbsp;距您直线距离{this.getDistance()}</View>
                <View className="coin">🪙 &nbsp;12000 Popo</View>
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
            { title: "我的", iconType: "user" },
          ]}
        />
      </View>
    );
  }
}

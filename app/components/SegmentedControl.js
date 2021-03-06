'use strict';

import React, {Component} from 'react';
import {
  SegmentedControlIOS,
  AsyncStorage,
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableOpacity,
  ScrollView,
  Navigator,
  Alert
} from 'react-native';

import API from '../api';
import store from '../store';
import CountDown from './CountDown';
import moment from 'moment-timezone';
import ReserveScene from '../scenes/ReserveScene';



var SegmentedControl = React.createClass({

  getInitialState: function() {
    const {navigator} = this.props;

    return {
      username: this.props.username,
      washingDS: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2 }),
      dryerDS: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
      reserveDS: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
      values: ['Washing', 'Dryer'],
      selectedTab: 'Washing'
    }
  },

  // Fetch data from api
  componentDidMount: function() {
    this.fetchData();
    // Fetch data every 10 sec
    // this.timer = setInterval(() => this.fetchData(), 60000);
    this.timer = setInterval(() => this.fetchData(), 1000);
    // <View>
    // <ScrollView style={styles.listContainer}>
    //   {this.renderListView()}
    // </ScrollView>
    // </View>

  },

  fetchData: async function() {
    API.getMachineData(this.state.username, "washing")
      .then((res) => {
        this.setState({
          washingDS: this.state.washingDS.cloneWithRows(res),
        });
      })
    .then(() => {
      API.getMachineData(this.state.username, "dryer") // to be changed to dryer
        .then((res) => {
          this.setState({
            dryerDS: this.state.dryerDS.cloneWithRows(res),
          })
        })
    })
    .done()
  },

  renderListView: function() {
    // Display washing machines
    if (this.state.selectedTab === 'Washing') {
      return (
        <View>
          {this.renderWashingStatusScene()}
        </View>
      )
    } else if (this.state.selectedTab === 'Dryer') {
    // Display dryers
      return (
        <View>
          {this.renderDryerStatusScene()}
        </View>
      )
    }
  },

  renderWashingStatusScene: function() {
    return (
      <ListView
        dataSource = {this.state.washingDS}
        renderRow = {this.renderRow} // auto bind
      />
    )
  },

  renderDryerStatusScene: function() {
    return (
      <ListView
        dataSource = {this.state.dryerDS}
        renderRow = {this.renderRow} // auto bind
      />
    )
  },

  quickReserveConfirm: async function(machine_id) {
    // const fake_access_code = '1001';
    console.log('Now in quickReserveConfirm');
    this.quickReserveSuccess(machine_id, function(res) {
      console.log("quickReserveConfirm", JSON.stringify(res));
      if (!res) {
        console.log("quickReserveConfirm", 'NULL');
        return;
      }
      // Raise another alert to confirm
      Alert.alert(
        'Reservation Code: ' + res,  // to be changed
        'You have reserved this machine successfully. Please note that this reservation will expire in 5 minutes.',
        [
          { text: 'OK' }
        ]
      );
    });
  },

  quickReserveSuccess: function(machine_id, callback) {
    // Call API to reserve this machine_id
    console.log('Now in quickReserveSuccess');
    API.quickReserve(this.state.username, machine_id).then(function(res) {
      console.log("quickReserveSuccess", res.access_code);
      if (res.message && res.message.toUpperCase() === 'SUCCESS') {
        // Update the DS state - fetch the data again
        console.log("quick reserve success feftch data");
        var access_code = res.access_code;
        // this.fetchData();
        console.log("access_code", access_code);
        return callback(access_code);
      } else {
        // Do nothing
        Alert.alert(res.message);
        return callback(null);
      }
    });
  },

  handleCountDown: function(newRemainTime, end_time, username) {
    // console.log("handleCountDown:\t" + end_time);
    const now = moment(new Date()).tz("America/New_York");
    if ( moment(now).isAfter(end_time) ) {
      // console.log("handleCountDown:\t timeout!");

      if (username === this.state.username) {
        Alert.alert("Your reservation just expired!");
      }

      this.fetchData();
    } else {
      console.log("handleCountDown:\t still waiting");
      return newRemainTime;
    }
  },

  renderRow(rowData) {
    var img = this.state.selectedTab === 'Washing' ? require('../img/status/Washing.png') : require('../img/status/Dryer.png');

    var raw_remainTime;

    var test = JSON.stringify(rowData);

    // console.log(raw_remainTime);

    if (rowData.end_time) {
      // Convert the end time to readable format
      var end_time = moment(rowData.end_time).tz("America/New_York").subtract(1, 'hours').format('hh:mm A');
      // console.log(`end_time: ${end_time}`);
      // Calculate the remain time in mmss
      raw_remainTime = moment(rowData.end_time).tz("America/New_York") - moment().tz("America/New_York");
      var remainTime = moment(raw_remainTime).format('mmss');
    } else {
      raw_remainTime = 0;
    }
    var displayTime = raw_remainTime;

    // console.log(`raw_remainTime: ${raw_remainTime}`);
    if (displayTime > 0) {
      return (
          <View style={styles.container}>
            <View style={styles.rowContainer}>
                <View style={styles.centerContainer}>
                    <Text style={[styles.text, styles.machine_id]}>{rowData.display_id}</Text>
                </View>
                <Image style={styles.thumb} source={img} />
                <View style={styles.textContainer}>
                  <CountDown
                  time = {remainTime}
                  end_time = {rowData.end_time}
                  username = {rowData.username}
                  displayTime = {rowData.displayTime}
                  onCountDown = {
                    remainTime = this.handleCountDown
                  }/>
                  <Text style={[styles.text, styles.end_time]}>{end_time}</Text>
                </View>
            </View>
            <View style={styles.separator}/>
          </View>
      );
    } else {
      // If the machine is available and the reservation belongs to the current user
      // if (rowData.username === this.state.username) {
      //   Alert.alert("Your reservation has just expired!");
      // };
      return (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.wrapper}
            onPress={() => Alert.alert(
              'Reservation',
              'Would you like to reserve this machine for 5 minutes?',
              [
                {text: 'Cancel'},
                {text: 'Confirm', onPress: (machine_id) => {
                  var machine_id = rowData.machine_id;
                  this.quickReserveConfirm(machine_id)} }
              ]
            )}>
            <View style={styles.container}>
              <View style={styles.rowContainer}>
                  <View style={styles.centerContainer}>
                      <Text style={[styles.text, styles.machine_id]}>{rowData.display_id}</Text>
                  </View>
                  <Image style={styles.thumb} source={img} />
                  <View style={[styles.textContainer, styles.centerContainer]}>
                    <Text style={[styles.text, styles.available]}>Available</Text>
                  </View>
              </View>
              <View style={styles.separator}/>
            </View>
          </TouchableOpacity>
        </View>
      );}
  },

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.scContainer}>
          <SegmentedControlIOS
            style={styles.segmentedControl}
            tintColor='#B0FFFE'
            values={this.state.values}
            selectedIndex={0}
            onValueChange={(val)=> {
              this.setState({
                selectedTab: val
              })
            }}/>
        </View>
        <ScrollView style={styles.listContainer}>
          {this.renderListView()}
        </ScrollView>
      </View>
    );
  },

}) // end class


var styles = StyleSheet.create({
  container: {
    flex: 1
  },

  scContainer: {
    backgroundColor: '#4AC3C0'
  },

  listContainer: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#fff'
  },

  segmentedControl: {
    margin: 10,
    marginLeft: 30,
    marginRight: 30
  },

  text: {
    color: '#929292',
    fontSize: 15
  },
  thumb: {
    width: 60,
    height: 60
  },
  separator: {
    height: 1,
    backgroundColor: '#dddddd'
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 15
  },
  centerContainer: {
    justifyContent: 'center'
  },
  machine_id: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 20
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end'
  },
  remainTime: {
    fontSize: 30
  },
  end_time: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  available: {
    fontSize: 25,
    fontWeight: 'bold',
    justifyContent: 'center'
  },
  wrapper: {
    backgroundColor: '#CCFFFF',
  }
});

module.exports = SegmentedControl;

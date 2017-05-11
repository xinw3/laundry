'use strict';

import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  WebView,
  View,
} from 'react-native';
import PrivacyPolicyHTML from '../PrivacyPolicy.html';
import Navbar from '../components/Navbar';
import Button from 'apsl-react-native-button';

export default class PrivacyPolicy extends Component {

  render() {
    console.log('PrivacyPolicy Scene', this.props);
    const {navigator} = this.props;
    return (
      <View style={styles.container}>
        <Navbar title={this.props.title} leftBtn='Back' navigator={navigator} />
          <View style={styles.inputContainer}>
            <WebView
              source={require('../PrivacyPolicy.html')}/>
          </View>
      </View>
    );
  };

};

var styles = StyleSheet.create({
  container: {
    flex: 1
  },
  default: {
    height: 26,
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  inputContainer: {
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  textArea: {
    alignSelf: 'center',
    width: 300,
    height: 250,
    fontSize: 17,
    padding: 15,
    backgroundColor: '#F6F6F6',
  },
  btn: {
    backgroundColor: '#4AC3C0',
    alignSelf: 'center',
    borderWidth: 0,
    margin: 15,
    width: 300
  },
});

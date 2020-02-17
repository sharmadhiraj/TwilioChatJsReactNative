/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from "react";
import {AppRegistry, Platform, TextInput, View} from "react-native";
import Login from "./js/components/Login";
import EventsLog from "./js/components/EventsLog";
import ChatClientHelper from "./js/chat-client-helper";
import Log from "./js/logging";
import FirebaseSupport from "./js/FirebaseSupportModule";
import ApnSupport from "./js/ApnsSupportModule";
import Container from "./js/components/Container";
import Button from "./js/components/Button";

const ngrokConfiguration = require('./configuration.json').ngrok;
// const tokenHost = 'https://' + ngrokConfiguration.subdomain + '.ngrok.io';
const tokenHost = 'http://192.168.1.66:3002';
const tokenBasicAuth = ngrokConfiguration.basicAuth;

export default class TwilioChatJsReactNative extends Component {

    state = {
        chatClientHelper: null,
        log: [],
        message: "Hello"
    };

    login(username, host) {
        let log = new Log(this.addNewLog.bind(this));
        let chatClientHelper = new ChatClientHelper(host, tokenBasicAuth, log);

        if (Platform.OS === 'ios') {
            chatClientHelper.login(
                username, 'apns', ApnSupport.registerForPushCallback, ApnSupport.showPushCallback);
        } else if (Platform.OS === 'android') {
            chatClientHelper.login(
                username, 'fcm', FirebaseSupport.registerForPushCallback, FirebaseSupport.showPushCallback);
        }
        this.setState({chatClientHelper});
    }

    addNewLog(string) {
        let log = this.state.log;
        log.push(string + "\n\n");
        this.setState({log});
    }

    render() {
        if (this.state.chatClientHelper === null) {
            return (
                <Login host={tokenHost} login={this.login.bind(this)}/>
            );
        } else {
            return (
                <View style={{flex: 1}}>
                    <EventsLog eventslog={this.state.log}/>

                    <Container>

                        <TextInput value={this.state.message} style={{borderWidth: 1.0, margin: 4.0}}
                                   onChangeText={(text) => this.setState({message: text})}/>

                        <Button
                            label="Send Message"
                            styles={{
                                button: {
                                    margin: 4.0,
                                    backgroundColor: '#043927'
                                }, label: {
                                    fontSize: 16,
                                    color: '#FFF',
                                }
                            }}
                            onPress={this.send.bind(this)} title="Send Message"/>

                    </Container>

                </View>);
        }
    }

    send() {
        if (this.state.message.length > 0) {
            this.state.chatClientHelper.sendMessage(this.state.message);
            this.setState({message: ""});
        }

    }
}


AppRegistry.registerComponent('TwilioChatJsReactNative', () => TwilioChatJsReactNative);

// if you want to send the raw push to the JS library to reparse
// (while app is not running), you can use this react native pattern to call static JS method
// AppRegistry.registerHeadlessTask('FCMParsePush', () => require('./js/FCMParsePush'));

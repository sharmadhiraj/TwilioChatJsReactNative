'use strict';

import {Client as TwilioChatClient} from "twilio-chat";
import {Buffer} from "buffer";
import "react-native";

export default class ChatClientHelper {
    host;
    basicAuthHeaders;
    log;
    client;
    channel;

    constructor(tokenAndConfigurationProviderHost, basicAuth, log) {
        this.host = tokenAndConfigurationProviderHost;
        if (basicAuth) {
            this.basicAuthHeaders =
                new Headers({
                    "Authorization":
                        `Basic ${Buffer.from(`${basicAuth.username}:${basicAuth.password}`).toString("base64")}`
                })
        }
        this.basicAuth = basicAuth;
        this.log = log;
        this.client = null;
    }

    login(identity, pushChannel, registerForPushCallback, showPushCallback) {
        this.log.message("Logging in ....");
        let that = this;
        return fetch(`${this.host}/chat-client-configuration.json`, {headers: this.basicAuthHeaders})
            .then((response) => {
                let chatClientConfig = response.json();
                that.log.info('login', 'Got Chat client configuration', chatClientConfig);
                return this.getToken(identity, pushChannel)
                    .then(function (token) {
                        that.log.info('ChatClientHelper', 'got chat token', token);
                        return TwilioChatClient.create(token, chatClientConfig.options || {}).then((chatClient) => {
                            that.client = chatClient;
                            that.client.on('tokenAboutToExpire', () => {
                                that.getToken(identity, pushChannel)
                                    .then(newData => that.client.updateToken(newData))
                                    .catch((err) => {
                                        that.log.error('login', 'can\'t get token', err);
                                    })
                            });
                            that.client.on('pushNotification', obj => {
                                if (obj && showPushCallback) {
                                    showPushCallback(that.log, obj);
                                }
                            });
                            // that.subscribeToAllChatClientEvents();
                            that.createChannel();
                            if (registerForPushCallback) {
                                registerForPushCallback(that.log, that.client);
                            }
                        });
                    })
                    .catch((err) => {
                        that.log.error('login', 'can\'t get token', err);
                    });
            })
            .catch((err) => {
                that.log.error('login', 'can\'t fetch Chat Client configuration', err);
            });
    }

    getToken(identity, pushChannel) {
        if (!pushChannel) {
            pushChannel = 'none';
        }
        return fetch(`${this.host}/token?identity=${identity}&pushChannel=${pushChannel}`,
            {headers: this.basicAuthHeaders})
            .then(response => {
                return response.text();
            });
    }

    subscribeToAllChatClientEvents() {
        this.client.on('tokenAboutToExpire',
            obj => this.log.event('ChatClientHelper.client', 'tokenAboutToExpire', obj));
        this.client.on('tokenExpired', obj => this.log.event('ChatClientHelper.client', 'tokenExpired', obj));

        this.client.on('userSubscribed', obj => this.log.event('ChatClientHelper.client', 'userSubscribed', obj));
        this.client.on('userUpdated', obj => this.log.event('ChatClientHelper.client', 'userUpdated', obj));
        this.client.on('userUnsubscribed', obj => this.log.event('ChatClientHelper.client', 'userUnsubscribed', obj));

        this.client.on('channelAdded', obj => this.log.event('ChatClientHelper.client', 'channelAdded', obj));
        this.client.on('channelRemoved', obj => this.log.event('ChatClientHelper.client', 'channelRemoved', obj));
        this.client.on('channelInvited', obj => this.log.event('ChatClientHelper.client', 'channelInvited', obj));
        this.client.on('channelJoined', obj => {
            this.log.event('ChatClientHelper.client', 'channelJoined', obj);
            obj.getMessages(1).then(messagesPaginator => {
                messagesPaginator.items.forEach(message => {
                    this.log.info('ChatClientHelper.client', obj.sid + ' last message sid ' + message.sid)
                })
            })
        });
        this.client.on('channelLeft', obj => this.log.event('ChatClientHelper.client', 'channelLeft', obj));
        this.client.on('channelUpdated', obj => this.log.event('ChatClientHelper.client', 'channelUpdated', obj));

        this.client.on('memberJoined', obj => this.log.event('ChatClientHelper.client', 'memberJoined', obj));
        this.client.on('memberLeft', obj => this.log.event('ChatClientHelper.client', 'memberLeft', obj));
        this.client.on('memberUpdated', obj => this.log.event('ChatClientHelper.client', 'memberUpdated', obj));

        this.client.on('messageAdded', obj => this.log.event('ChatClientHelper.client', 'messageAdded', obj));
        this.client.on('messageUpdated', obj => this.log.event('ChatClientHelper.client', 'messageUpdated', obj));
        this.client.on('messageRemoved', obj => this.log.event('ChatClientHelper.client', 'messageRemoved', obj));

        this.client.on('typingStarted', obj => this.log.event('ChatClientHelper.client', 'typingStarted', obj));
        this.client.on('typingEnded', obj => this.log.event('ChatClientHelper.client', 'typingEnded', obj));

        this.client.on('connectionStateChanged',
            obj => this.log.event('ChatClientHelper.client', 'connectionStateChanged', obj));

        this.client.on('pushNotification', obj => this.log.event('ChatClientHelper.client', 'onPushNotification', obj));


    }

    createChannel() {
        this.client.on('messageAdded', obj => this.log.message(obj.author + " says " + obj.body));
        const channelName = "demo-channel";
        this.client.getChannelByUniqueName(channelName)
            .then(channel => {
                this.joinChannel(channel);
            })
            .catch(e => {
                this.client
                    .createChannel({
                        uniqueName: channelName,
                        friendlyName: 'General Chat Channel',
                    })
                    .then((channel) => {
                        this.joinChannel(channel);
                    })
                    .catch((e) => this.log.error("Error on creating channel", e));

            })
    }

    joinChannel(channel) {
        channel.join()
            .then((channel) => {
                this.log.message("Successfully logged in ....");
                this.channel = channel;
            })
            .catch((e) => this.log.error('Error on joining channel', e));
    }

    sendMessage(message) {
        if (this.channel)
            this.channel.sendMessage(message)
                .then((s) => this.log.event('Message sent', s))
                .catch((e) => this.log.error('Error on sending message', e));
    }
};

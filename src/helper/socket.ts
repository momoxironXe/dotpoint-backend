"use strict"
import http from 'http'
import { Types } from 'mongoose';
import { meta_account_information_streaming } from './meta_trader_socket';
import { logger } from './winston_logger';

const ObjectId = Types.ObjectId
const connectedUsers: any = {};

export const socketServer = (app) => {
    const server = new http.Server(app);
    const io = require('socket.io')(server, { cors: true, })
    ioEvents(io);
    return server;
}

const ioEvents = (io) => {
    try {
        if (process.env.NODE_ENV === 'default') {
            meta_account_information_streaming(io)
        }
        if (process.env.NODE_ENV === 'production') {
            meta_account_information_streaming(io)
            setInterval(async () => {
                meta_account_information_streaming(io)
            }, (60 * 1000))
        }
        io.on('connection', (socket) => {
            logger.info('New connection is connected ' + socket.id);
            socket.on('statistics', async ({ type, accountId }) => {
                if (type == 'last_trade_list') {
                    socket.emit(`statistics_${type}`, { data: global.metaAccount?.[`${accountId}`]?.last_trade_list })
                }
                if (type == 'long_short_list') {
                    socket.emit(`statistics_${type}`, { data: global.metaAccount?.[`${accountId}`]?.long_short_list })
                }
                if (type == 'result_by_days') {
                    socket.emit(`statistics_${type}`, { data: global.metaAccount?.[`${accountId}`]?.result_by_days })
                }
                if (type == 'result_by_trade_duration') {
                    socket.emit(`statistics_${type}`, { data: global.metaAccount?.[`${accountId}`]?.result_by_trade_duration })
                }
                if (type == 'result_by_open_hour') {
                    socket.emit(`statistics_${type}`, { data: global.metaAccount?.[`${accountId}`]?.result_by_open_hour })
                }
            })

            socket.on('joinRoom', (roomId, userId) => {
                socket.join(roomId);
                connectedUsers[userId] = {
                    roomId,
                    lastSeen: Date.now(), // Timestamp when the user joined
                };

                // Listen for client heartbeat
                socket.on('heartbeat', () => {
                    // Update user's last seen time on heartbeat
                    if (connectedUsers[userId]) {
                        connectedUsers[userId].lastSeen = Date.now();
                    }
                });

                socket.on('disconnect', () => {
                    if (connectedUsers[userId] && connectedUsers[userId].roomId === roomId) {
                        delete connectedUsers[userId];
                        // Remove user from the room or perform necessary cleanup
                    }
                });
            });
        });
    } catch (error) {
        console.log(error);
    }
}

const HEARTBEAT_INTERVAL = 5000; // Interval to check for inactivity (5 seconds in this example)
setInterval(() => {
    const currentTime = Date.now();
    for (const [userId, userData] of Object.entries(connectedUsers) as any) {
        // Check the last time the user sent a heartbeat
        // If the user hasn't sent a heartbeat within the last X milliseconds, consider them offline
        const timeDiff = currentTime - userData.lastSeen;
        if (timeDiff > 2 * HEARTBEAT_INTERVAL) {
            // Remove user from the room or perform necessary cleanup
            delete connectedUsers[userId];
        }
    }
}, HEARTBEAT_INTERVAL);
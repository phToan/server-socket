const express = require ('express')
const app = express()
const server = require("http").Server(app)
const io = require("socket.io")(server)
server.listen(process.env.PORT)
let orders = [];
const axios = require('axios')
// const orders = new Map()
// const orders = new Set()

const CUSTOMER_ROOM = 'customerRoom';
const DRIVER_ROOM = 'driverRoom';

const updateSocket = async(socket, userId, type) => {
    await axios.put('https://delivery-server-s54c.onrender.com/socket', {
        user_id: userId,
        type: type,
        socket_id: socket.id
    })
    .then(res => {
        console.log(res.data)
    })
    .catch(err => {
        console.log(err)
    })
}

io.on("connection", async function (socket) {
    const userId = socket.handshake.query.id
    const type = socket.handshake.query.type
    await axios.post('https://delivery-server-s54c.onrender.com/socket', {
        user_id: userId,
        type: type,
        socket_id: socket.id
    })
    .then(res => {
        console.log(res.data)
        if(res.data.err == 1){
            updateSocket(socket, userId, type)
        }
    })
    .catch(err => {
        console.log(err)
    })
    console.log("Co nguoi vua ket noi " + socket.id);
    console.log(socket.adapter.rooms)
    socket.on('joinRoom', (role) => {
        if (role === 'customer') {
            socket.join(CUSTOMER_ROOM);
        } else if (role === 'driver') {
            socket.join(DRIVER_ROOM);
        }
    })

    socket.on("disconnect", () => {
        console.log(socket.id + "đã ngắt connect");
        // In ra danh sách các socket còn lại
        // const connectedSockets = Object.keys(io.sockets.connected);
        // console.log("Các socket còn lại: ", connectedSockets);
    });

    //KIỂU MẢNG

    socket.on('placeOrder', async (orderJson) => {
        io.to(DRIVER_ROOM).emit('newOrder', orderJson);
    })

    socket.on('takeOrder', async(object) => {
        console.log(object)
        io.to(object.socket_id).emit('orderTaken', object);
    })

    socket.on('takeSuccess', async(object) => {
        await axios.put('https://delivery-server-s54c.onrender.com/order/customer', {id: object.id, status: 2})
         .then(res => {
            if (res.data.err == 0) {
                io.to(object.socket_id).emit('orderTakenSuccess', object);
            }
         })
         .catch(err => {
            console.log(err)
         })
    })

    socket.on('deliverySuccess', async(object) => {
        await axios.put('https://delivery-server-s54c.onrender.com/order/customer', {id: object.id, status: 3})
         .then(res => {
            if (res.data.err == 0) {
                io.to(object.socket_id).emit('orderDeliverySuccess', object);
            }
         })
         .catch(err => {
            console.log(err)
         })
    })

    socket.on('customer-cancle-order', async(object) => {
        io.to(DRIVER_ROOM).emit('cancle-order', object);
    })

    socket.on('driver-cancle-order', async(object) => {
        //io.to(object.customerID).emit('driver-cancle-order', object); 
        io.to(object.socket_id).emit('cancle-order-driver', object);
        io.to(DRIVER_ROOM).emit('cancle-order-driver', object);
    })
})

    //KIỂU MAP 
    // socket.on('placeOrder', (orderJson) => {
    //     const order = JSON.parse(orderJson);
    //     order.customerID = socket.id;
    //     orders.set(order.id, order);
    //     io.to(DRIVER_ROOM).emit('newOrder', order);
    // });
    
    // socket.on('takeOrder', (object) => {
    //     const data = JSON.parse(object);
    //     console.log(data.id);
    //     const order = orders.get(data.id);
    //     if (order) {
    //         const customerSocketId = order.customerID;
    //         io.to(customerSocketId).emit('orderTaken', object);
    //         console.log(customerSocketId);
    //     }
    // });

    //KIỂU SET
    // socket.on('placeOrder', (orderJson) => {
    //     const order = JSON.parse(orderJson);
    //     order.customerID = socket.id;
    //     orders.add(order);
    //     io.to(DRIVER_ROOM).emit('newOrder', order);
    // });

    // socket.on('takeOrder', (object) => {
    //     const data = JSON.parse(object);
    //     console.log(data.id);
    //     for (const order of orders) {
    //         if (order.id === data.id) {
    //             const customerSocketId = order.customerID;
    //             io.to(customerSocketId).emit('orderTaken', object);
    //             console.log(customerSocketId);
    //             break;
    //         }
    //     }
    // });



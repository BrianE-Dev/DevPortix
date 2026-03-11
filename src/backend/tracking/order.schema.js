// const { required } = require("joi");
const mongoose = require ("mongoose");
const SCHEMA = mongoose.Schema; 

const orderSchema = new SCHEMA ({
    
    orderId: {
        type: String,
    },
    owner: {
        type: SCHEMA.Types.ObjectId,
        trim: true,
        ref: "user"
    },
    orderedItem: [
        {
            itemId: {type: SCHEMA.Types.ObjectId},
            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
            deliveryStatus: {
                type: String,
                enum: [
                    "pending",
                    "processing",
                    "ready",
                    "in-transit",
                    "delivered",
                    "cancelled"
                ], 
                default: "pending"
            },
            price: Number,
            totalItemPrice: Number,
        }
    ],
    totalPrice: Number,
    paymentMethod: {
        type: String,
        enum: ["card", "transfer",],
        default: "card",
    },
    deliveryAddress: {
        type: String,
        minLength: 10,
    },
    deliveryPhone: {
        type: String,
        minLength: 11,
        maxLength: 15,
        required: true,
    },
    paidAt: Date,
    isPaid: {
        type: Boolean,
        default: false,
    },
    paymentReference: {
        type: String
    },
    paystackAccessCode:{
        type: String
    },
    paymentStatus: {
        type: String,
        enum: [
            "unpaid", "paid", "failed", "cancelled"
        ]
    },
    
}, {timestamps: true})

module.exports = mongoose.model("order", orderSchema)

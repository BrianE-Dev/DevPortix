const Order = require('./order.schema');
const User = require('../modules/userSchema');
const Paystack = /** @type {any} */ (require('paystack-api')(
  process.env.PAYSTACK_SECRET_KEY || process.env.PSSECRET || ''
));

const buildOrderItems = (orderedItems = []) => {
  if (!Array.isArray(orderedItems) || orderedItems.length === 0) return [];

  return orderedItems
    .map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      if (!Number.isFinite(quantity) || quantity < 1) return null;
      if (!Number.isFinite(price) || price < 0) return null;

      return {
        itemId: item.itemId || undefined,
        quantity,
        price,
        totalItemPrice: quantity * price,
        deliveryStatus: 'pending',
      };
    })
    .filter(Boolean);
};

const createOrder = async (req, res) => {
  try {
    const owner = req.userId;
    const orderItems = buildOrderItems(req.body?.orderedItems || []);

    if (!owner) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderedItems is required and each item must include valid price and quantity',
      });
    }

    const totalPrice = orderItems.reduce((sum, item) => sum + item.totalItemPrice, 0);

    const customerOrder = await Order.create({
      owner,
      orderedItem: orderItems,
      totalPrice,
      paymentStatus: 'unpaid',
    });

    return res.status(201).json({
      success: true,
      message: 'Order created',
      data: customerOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const initializePayment = async (req, res) => {
  try {
    const owner = req.userId;
    if (!owner) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(owner).lean();
    if (!user?.email) {
      return res.status(404).json({ success: false, message: 'User with valid email not found' });
    }

    const { orderId, deliveryAddress, deliveryPhone } = req.body || {};
    if (!orderId || !deliveryPhone) {
      return res.status(400).json({
        success: false,
        message: 'orderId and deliveryPhone are required',
      });
    }

    const order = await Order.findOne({ _id: orderId, owner });
    if (!order || !Array.isArray(order.orderedItem) || order.orderedItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const reference = `devport_order_${order._id}_${Date.now()}`;

    const paymentData = {
      email: user.email,
      amount: Math.round(Number(order.totalPrice || 0) * 100),
      currency: 'NGN',
      reference,
      metadata: {
        owner: String(order.owner),
        orderId: String(order._id),
      },
      callback_url: req.body?.callbackUrl || undefined,
    };

    const paystackResponse = await Paystack.transaction.initialize(paymentData);
    if (!paystackResponse?.status || !paystackResponse?.data?.authorization_url) {
      return res.status(400).json({
        success: false,
        message: 'Payment initialization failed',
        error: paystackResponse?.message || 'Unable to initialize payment',
      });
    }

    order.deliveryAddress = deliveryAddress || order.deliveryAddress;
    order.deliveryPhone = deliveryPhone;
    order.paymentReference = reference;
    order.paystackAccessCode = paystackResponse.data.access_code;
    order.paymentStatus = 'unpaid';
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference,
        amount: order.totalPrice,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const owner = req.userId;
    const reference = String(req.params.reference || '').trim();

    if (!owner) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!reference) {
      return res.status(400).json({ success: false, message: 'reference is required' });
    }

    const paystackResponse = await Paystack.transaction.verify({ reference });
    const transaction = paystackResponse?.data;

    if (!paystackResponse?.status || !transaction) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: paystackResponse?.message || 'Unable to verify payment',
      });
    }

    const order = await Order.findOne({ owner, paymentReference: reference });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order for this reference not found' });
    }

    if (transaction.status === 'success') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentStatus = 'paid';
    } else if (transaction.status === 'failed') {
      order.paymentStatus = 'failed';
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verification completed',
      data: {
        orderId: String(order._id),
        paymentStatus: order.paymentStatus,
        reference: order.paymentReference,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = { createOrder, initializePayment, verifyPayment };

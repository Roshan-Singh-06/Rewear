const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
    },
    orderType: {
      type: String,
      enum: ['swap', 'pointsRedemption'],
      required: true,
    },
    // Verification codes for completing orders
    requesterCode: {
      type: String,
      required: true,
    },
    responderCode: {
      type: String,
      required: function() { return this.orderType === 'swap'; }
    },
    // For swap orders
    itemOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: function() { return this.orderType === 'swap'; }
    },
    itemRequested: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: function() { return this.orderType === 'swap'; }
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() { return this.orderType === 'swap'; }
    },
    // For point redemption orders
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: function() { return this.orderType === 'pointsRedemption'; }
    },
    pointsUsed: {
      type: Number,
      required: function() { return this.orderType === 'pointsRedemption'; }
    },
    // Common fields
    status: {
      type: String,
      enum: ['accepted', 'completed', 'cancelled'],
      default: 'accepted',
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    // For tracking which user marked the order as complete
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Generate unique order code and verification codes before saving
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    console.log('Order pre-save middleware triggered for new order');
    
    const generateOrderCode = () => {
      const prefix = this.orderType === 'swap' ? 'SW' : 'PR';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}${timestamp}${random}`;
    };

    const generateVerificationCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    };

    try {
      // Generate unique order code
      let isUnique = false;
      while (!isUnique) {
        this.orderCode = generateOrderCode();
        console.log('Generated order code:', this.orderCode);
        const existingOrder = await this.constructor.findOne({ orderCode: this.orderCode });
        if (!existingOrder) {
          isUnique = true;
        }
      }

      // Generate verification codes
      this.requesterCode = generateVerificationCode();
      console.log('Generated requester code:', this.requesterCode);
      
      if (this.orderType === 'swap') {
        this.responderCode = generateVerificationCode();
        console.log('Generated responder code:', this.responderCode);
      }
      
      console.log('Order codes generated successfully');
    } catch (error) {
      console.error('Error in Order pre-save middleware:', error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);

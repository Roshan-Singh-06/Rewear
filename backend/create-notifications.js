const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./src/models/Notification.model.js');
const Swap = require('./src/models/Swap.model.js');
const User = require('./src/models/User.model.js');
const Item = require('./src/models/Item.model.js');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for testing'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createNotificationsForExistingSwaps() {
  try {
    console.log('Finding accepted swaps without notifications...');
    
    // Find all accepted swaps
    const acceptedSwaps = await Swap.find({ status: 'accepted' })
      .populate('requester responder itemOffered itemRequested');
    
    console.log(`Found ${acceptedSwaps.length} accepted swaps`);
    
    for (const swap of acceptedSwaps) {
      // Check if notification already exists for this swap
      const existingNotification = await Notification.findOne({
        swapId: swap._id,
        type: 'swap_accepted'
      });
      
      if (existingNotification) {
        console.log(`Notification already exists for swap ${swap._id}`);
        continue;
      }
      
      console.log(`Creating notification for swap ${swap._id}`);
      console.log(`  Requester: ${swap.requester.username}`);
      console.log(`  Responder: ${swap.responder.username}`);
      console.log(`  Item: ${swap.itemRequested.title}`);
      
      // Create notification for swap acceptance
      const notification = await Notification.create({
        recipient: swap.requester._id,
        sender: swap.responder._id,
        type: 'swap_accepted',
        title: 'Swap Request Accepted!',
        message: `${swap.responder.username || swap.responder.fullName || 'Someone'} accepted your swap request for "${swap.itemRequested.title}"`,
        swapId: swap._id,
        itemOffered: swap.itemOffered._id,
        itemRequested: swap.itemRequested._id,
        isRead: false
      });
      
      console.log(`  ✅ Notification created: ${notification._id}`);
    }
    
    console.log('✅ All notifications created successfully!');
    
    // Show all notifications for debugging
    const allNotifications = await Notification.find({})
      .populate('recipient sender itemOffered itemRequested swapId');
    
    console.log(`\nTotal notifications in database: ${allNotifications.length}`);
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type} - ${notif.title}`);
      console.log(`   To: ${notif.recipient.username}`);
      console.log(`   From: ${notif.sender.username}`);
      console.log(`   Read: ${notif.isRead}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating notifications:', error);
    process.exit(1);
  }
}

createNotificationsForExistingSwaps();

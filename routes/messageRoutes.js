const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { sendMessage, allMessage, likeMessage } = require('../controllers/messageControllers')

const router = express.Router()

router.route('/').post(protect, sendMessage)
router.route('/:chatId').get(protect, allMessage)
router.route('/:messageId/like').post(protect, likeMessage); // Like a message

module.exports = router
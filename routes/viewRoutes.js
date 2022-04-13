const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('../controllers/authControllers');

const router = express.Router();

// router.use(authController.isLoggedIn);

// router.get('/tour/:slug', (req, res) => {
//   res.send('HEYY BRO THI IS LUF');
// });
router.get('/', viewsController.getOverview);

router.get('/login', viewsController.getLoginForm);
router.get('/tour/:slug', viewsController.getTour);
router.get('/me', viewsController.getAccount);

router.post('/submit-user-data', viewsController.updateUserData);

module.exports = router;

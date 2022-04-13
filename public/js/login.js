/* eslint-disable */
// import axios from 'axios';

// import { showAlert } from './alerts';
// const showAlert = require('./alerts');

// hideAlert = () => {
//   const el = document.querySelector('.alert');
//   if (el) el.parentElement.removeChild(el);
// };

// const showAlert = (type, msg) => {
//   hideAlert();
//   const markup = `<div class="alert alert--${type}">${msg}</div>`;
//   document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
//   window.setTimeout(hideAlert, 5000);
// };
const login = async (email, password) => {
  try {
    const resData = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const res = await resData.json();

    console.log('🙄 =>', res);

    if (res.status === 'success') {
      // showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        // location.assign('/');
        console.log('Ha hai gya ');
      }, 1500);
    }
  } catch (err) {
    console.log('🙄', err);
    // showAlert('error', err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
  // console.log(email, password);
});

// export const logout = async () => {
//   try {
//     const res = await axios({
//       method: 'GET',
//       url: 'http://127.0.0.1:3000/api/v1/users/logout'
//     });
//     if ((res.data.status = 'success')) location.reload(true);
//   } catch (err) {
//     console.log(err.response);
//     showAlert('error', 'Error logging out! Try again.');
//   }
// };

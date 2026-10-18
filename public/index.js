const showError = (id, err) => {
  const box = document.getElementById(id)
  box.textContent = err.response?.data?.error || 'Something went wrong, please try again'
  box.style.display = 'block'
}

//modal for signUp button
document.getElementById('signUpPage').addEventListener('click', event => {
  event.preventDefault()
  $('.ui.modal').modal('show')
})

// create an account; the server logs the new user in and rejects duplicate emails
document.getElementById('signUp').addEventListener('click', event => {
  event.preventDefault()
  axios.post('/api/auth/register', {
    name: document.getElementById('newName').value,
    email: document.getElementById('newEmail').value,
    password: document.getElementById('newPassword').value
  })
    .then(() => { window.location = '/deals.html' })
    .catch(err => showError('signUpError', err))
})

// sign in; the session lives in an httpOnly cookie, nothing is stored in the browser
const signIn = event => {
  event.preventDefault()
  axios.post('/api/auth/login', {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  })
    .then(() => { window.location = '/deals.html' })
    .catch(err => showError('signInError', err))
}
document.getElementById('signIn').addEventListener('click', signIn)
document.getElementById('signInForm').addEventListener('submit', signIn)

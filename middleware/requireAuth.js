// API guard: reject requests without a logged-in session
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' })
  next()
}

// page guard: send logged-out visitors to the sign-in page
const requirePage = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/')
  next()
}

module.exports = { requireAuth, requirePage }

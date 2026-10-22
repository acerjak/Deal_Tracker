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

// sign-in page guard: logged-in visitors go straight to their deals
const skipIfSignedIn = (req, res, next) => {
  if (req.session.userId) return res.redirect('/deals.html')
  next()
}

module.exports = { requireAuth, requirePage, skipIfSignedIn }

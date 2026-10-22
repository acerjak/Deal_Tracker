// all API calls go through one axios instance
const api = axios.create({ baseURL: '/api' })

// a 401 anywhere means the session ended; go back to sign in
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) window.location = '/'
  return Promise.reject(err)
})

const $id = id => document.getElementById(id)
const show = (el, visible) => { el.style.display = visible ? '' : 'none' }
const fail = err => {
  if (err.response?.status !== 401) alert(err.response?.data?.error || 'Something went wrong, please try again')
}

// deal property -> id of its form input; the single place that knows the form's fields
const FIELDS = {
  dealName: 'dealName',
  value: 'dealValue',
  organization: 'dealOrg',
  contact: 'dealContact',
  phone: 'dealPhone',
  email: 'dealEmail',
  notes: 'dealNotes',
  stage: 'dealStage'
}
const readForm = () => Object.fromEntries(Object.entries(FIELDS).map(([key, id]) => [key, $id(id).value]))
const fillForm = deal => {
  Object.entries(FIELDS).forEach(([key, id]) => { $id(id).value = deal[key] ?? '' })
  // the stage input is managed by the dropdown widget, so keep its label in sync
  $('.selection.dropdown').dropdown(deal.stage ? 'set selected' : 'clear', deal.stage)
}

// escape user-provided text before inserting into HTML
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cardSelector = id => `.card[data-id="${id}"]`

// build a deal card in its stage column, or replace the existing card in place
function renderDeal(deal) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `
    <div class="ui raised card" draggable="true" data-id="${Number(deal.id)}">
      <div class="content">
        <div class="header">${esc(deal.dealName)}</div>
        <div class="description">
          <h5>Value: ${esc(deal.value)}</h5>
        </div>
      </div>
      <div class="extra content">
        <button class="mini ui primary button" data-edit="${Number(deal.id)}">Edit Deal</button>
      </div>
    </div>`
  const existing = document.querySelector(cardSelector(deal.id))?.parentElement
  if (existing) existing.replaceWith(wrapper)
  else $id(deal.stage).append(wrapper)
}

// ----- deal form modal -----
const modal = $('.ui.modal')
// the action buttons manage closing themselves, so a failed save or invalid form keeps the modal open
modal.modal({ onApprove: () => false, onDeny: button => !button.is('#deleteDeal') })
$('.selection.dropdown').dropdown()

let current = null // the deal being edited, or null when adding

function openForm(deal) {
  current = deal || null
  const editing = Boolean(deal)
  show($id('submitDeal'), !editing)
  show($id('updateDeal'), editing)
  show($id('deleteDeal'), editing)
  show($id('stageDiv'), !editing)
  fillForm(deal || { stage: 'Lead' })
  modal.modal('show')
}

$id('addDealButton').addEventListener('click', () => openForm())

// edit buttons live inside cards that are rendered later, so listen on the document
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-edit]')
  if (!button) return
  try {
    const { data } = await api.get(`/deal/${button.dataset.edit}`)
    openForm(data)
  } catch (err) { fail(err) }
})

$id('submitDeal').addEventListener('click', async () => {
  if (!document.forms.DealForm.reportValidity()) return
  try {
    const { data } = await api.post('/deals', readForm())
    renderDeal(data)
    modal.modal('hide')
  } catch (err) { fail(err) }
})

$id('updateDeal').addEventListener('click', async () => {
  if (!document.forms.DealForm.reportValidity()) return
  // stage changes happen by dragging, not in the edit form
  const { stage, ...fields } = readForm()
  try {
    await api.put(`/deal/${current.id}`, fields)
    renderDeal({ ...current, ...fields })
    modal.modal('hide')
  } catch (err) { fail(err) }
})

$id('deleteDeal').addEventListener('click', async () => {
  try {
    await api.delete(`/deal/${current.id}`)
    document.querySelector(cardSelector(current.id))?.parentElement.remove()
    modal.modal('hide')
  } catch (err) { fail(err) }
})

$id('signOut').addEventListener('click', event => {
  event.preventDefault()
  api.post('/auth/logout').finally(() => { window.location = '/' })
})

// ----- drag and drop between stages -----
document.addEventListener('dragstart', event => {
  if (event.target.dataset?.id) event.dataTransfer.setData('text', event.target.dataset.id)
})

document.querySelectorAll('.stageBackground, .stageBackgroundEnd').forEach(column => {
  column.addEventListener('dragover', event => event.preventDefault())
  column.addEventListener('drop', async event => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text')
    // the dragged text could come from anywhere, so only accept a numeric deal id
    const card = /^\d+$/.test(id) && document.querySelector(cardSelector(id))
    if (!card) return
    const wrapper = card.parentElement
    const from = wrapper.parentElement
    if (from === column) return
    column.append(wrapper)
    try {
      await api.put(`/deals/${id}/${column.id}`)
    } catch (err) {
      from.append(wrapper) // put it back if the server refused
      fail(err)
    }
  })
})

// ----- load the signed-in user's deals -----
api.get('/deals').then(({ data }) => data.forEach(renderDeal)).catch(fail)

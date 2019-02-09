import dateFormat from 'dateformat'

const state = {
  messages: [
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'ksadjfsladkfljkasdf asdkfsadklf sadfasdf sdaf' },
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'ksadjfsladkfljkasdf asdkfsadklf sadfasdf sdaf' },
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'ksadjfsladkfljkasdf asdkfsadklf sadfasdf sdaf' },
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'ksadjfsladkfljkasdf asdkfsadklf sadfasdf sdaf' },
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'ksadjfsladkfljkasdf asdkfsadklf sadfasdf sdaf' }
  ]
}

const getters = {
  messages () { return state.messages }
}

const mutations = {
  messages (_state, payload) {
    _state.messages = payload
  },
  addMessage (_state, payload) {
    let message = payload
    let newArray = _state.messages.slice()
    newArray.shift()
    newArray.push(message)
    _state.messages = newArray
  }
}

const actions = {
  sendMessage (context, payload) {
    let email = payload.email
    let text = payload.text
    let message = { email, text, time: dateFormat(Date.now(), 'hh:MM:ss') }
    context.commit('addMessage', message)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

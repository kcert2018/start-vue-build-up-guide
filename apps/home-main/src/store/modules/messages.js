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
  messages (_state) { return _state.messages }
}

const mutations = {
  messages (_state, payload) {
    _state.messages = payload
  }
}

const actions = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

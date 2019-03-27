const state = {
  email: ''
}

const getters = {
  email (_state) { return _state.email }
}

const mutations = {
  email (_state, payload) {
    _state.email = payload
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

import { expect } from 'chai' // eslint-disable-line no-unused-vars
import { shallowMount, createLocalVue } from '@vue/test-utils'
import sinon from 'sinon'

import Vuex from 'vuex'
import Vuetify from 'vuetify'

import MainView from '@/views/home-main.vue'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(Vuetify)

/* eslint-disable no-unused-expressions */
describe('home-main 시험', () => {
  it('mainViem 생성 시험', () => {
    let mainView = shallowMount(MainView, {
      localVue
    })
    expect(mainView.exists()).to.be.true // 뷰 체크
    expect(mainView.name()).to.be.equal('home-main') // 뷰 이름 체크
    expect(mainView.contains('#home-main')).to.be.true // 뷰 id 체크
  })

  it('email 필드 연동 시험', async () => {
    let mainView = shallowMount(MainView, {
      localVue,
      stubs: {
        'v-text-field': { template: '<div>{{ value }}</div>', props: ['value'] }
      }
    })

    expect(mainView.vm.email).to.be.empty // email 데이터 체크

    const inEmail = mainView.find('#inEmail')
    expect(inEmail.exists()).to.be.true // 입력 필드 체크
    expect(inEmail.text()).to.be.empty // 이메일 입력 필드 체크

    let checkInput = 'frog@falinux.com'
    mainView.setData({ email: checkInput })
    expect(mainView.vm.email).to.be.equal(checkInput) // email 데이터 체크
    expect(inEmail.text()).to.be.equal(checkInput) // 이메일 입력 필드 체크
  })

  it('mapMutations 시험', (done) => {
    const callParam = 'frog@falinux.com'

    let mainView = shallowMount(MainView, {
      localVue,
      store: new Vuex.Store({
        mutations: {
          'users/email': (state, payload) => {
            expect(payload).to.be.equal(callParam)
            done()
          }
        }
      })
    })

    mainView.vm.loginEmail(callParam)
  })

  it('login 버튼 연동 시험', async () => {
    const clickHandler = sinon.stub()

    let mainView = shallowMount(MainView, {
      localVue,
      methods: { 'clickLogin': clickHandler },
      stubs: {
        'v-btn': { template: '<button></button>' }
      }
    })

    const btnLogin = mainView.find('#btnLogin')
    expect(btnLogin.exists()).to.be.true // 입력 필드 체크

    btnLogin.vm.$emit('click')
    expect(clickHandler.called).to.equal(true)
  })
})

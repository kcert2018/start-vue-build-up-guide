import { expect } from 'chai' // eslint-disable-line no-unused-vars
import { shallowMount, createLocalVue } from '@vue/test-utils'
import sinon from 'sinon'

import Vuex from 'vuex'
import Vuetify from 'vuetify'

import MessagesView from '@/views/messages-main.vue'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(Vuetify)

/* eslint-disable no-unused-expressions */
describe('messages-main 시험', () => {
  it('messages main 생성 시험', () => {
    let messagesView = shallowMount(MessagesView, {
      localVue,
      store: new Vuex.Store({
        getters: {
          'messages/messages': () => [],
          'users/email': () => ''
        }
      })
    })
    expect(messagesView.exists()).to.be.true // 뷰 체크
    expect(messagesView.name()).to.be.equal('messages-main') // 뷰 이름 체크
    expect(messagesView.contains('#messages-main')).to.be.true // 뷰 id 체크
  })

  it('Home 버튼 연동 시험', async () => {
    const clickHandler = sinon.stub()

    let messagesView = shallowMount(MessagesView, {
      localVue,
      store: new Vuex.Store({
        getters: {
          'messages/messages': () => [],
          'users/email': () => ''
        }
      }),
      methods: { 'clickHome': clickHandler },
      stubs: {
        'v-icon': { template: '<button></button>' }
      }
    })

    const btnHome = messagesView.find('#btnHome')
    expect(btnHome.exists()).to.be.true // 입력 필드 체크

    btnHome.vm.$emit('click')
    expect(clickHandler.called).to.equal(true)
  })

  it('mapGetters 시험', () => {
    const mockMessages = [
      { email: 'user1@www.okmail.com', time: '01:02:03', text: 'message1' },
      { email: 'user2@www.okmail.com', time: '12:13:14', text: 'message2' },
      { email: 'user3@www.okmail.com', time: '23:59:59', text: 'message3' }
    ]
    const mockloginEmail = 'frog@falinux.com'

    let messagesView = shallowMount(MessagesView, {
      localVue,
      store: new Vuex.Store({
        getters: {
          'messages/messages': () => mockMessages,
          'users/email': () => mockloginEmail
        }
      })
    })
    expect(messagesView.vm.messages).to.be.equal(mockMessages) // messages 연동 체크
    expect(messagesView.vm.loginEmail).to.be.equal(mockloginEmail) // loginEmail 연동 체크

    mockMessages.forEach((message, idx) => {
      const lstMessages = messagesView.find('#message-' + idx)
      expect(lstMessages.exists()).to.be.true // 메세지 출력 체크
      expect(lstMessages.text()).to.not.be.empty // 이메일 입력 필드 체크
      expect(lstMessages.text().includes(message.email)).to.be.true // 메세지 email 출력 체크
      expect(lstMessages.text().includes(message.time)).to.be.true // 메세지 time 출력 체크
      expect(lstMessages.text().includes(message.text)).to.be.true // 메세지 text 출력 체크
    })
  })

  it('messageText 시험', () => {
    let messagesView = shallowMount(MessagesView, {
      localVue,
      store: new Vuex.Store({
        getters: {
          'messages/messages': () => [],
          'users/email': () => ''
        }
      }),
      stubs: {
        'v-text-field': { template: '<div>{{ value }}</div>', props: ['value'] }
      }
    })
    expect(messagesView.vm.messageText).to.be.empty // messageText 데이터 체크
    const inMessageText = messagesView.find('#inMessageText')
    expect(inMessageText.exists()).to.be.true // 입력 필드 체크
    expect(inMessageText.text()).to.be.empty // messageText 입력 필드 체크

    let checkInput = 'This is test message'
    messagesView.setData({ messageText: checkInput })
    expect(messagesView.vm.messageText).to.be.equal(checkInput) // messageText 데이터 체크
    expect(inMessageText.text()).to.be.equal(checkInput) // messageText 입력 필드 체크
  })

  it('mapActions 시험', (done) => {
    const callParam = { email: 'frog@falinux.com', text: 'you youngchang' }

    let messagesView = shallowMount(MessagesView, {
      localVue,
      store: new Vuex.Store({
        getters: {
          'messages/messages': () => [],
          'users/email': () => ''
        },
        actions: {
          'messages/sendMessage': (content, payload) => {
            expect(payload).to.be.equal(callParam)
            done()
          }
        }
      })
    })

    messagesView.vm.sendMessage(callParam)
  })
})

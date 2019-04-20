import { expect } from 'chai'
import messages from '@/store/modules/messages'

describe('store messages 시험', () => {
  let testMessages = [
    { email: 'aaa@www.okmail.com', time: '23:37:00', text: 'this is text1' },
    { email: 'bbb@www.okmail.com', time: '23:50:32', text: 'this is text2' }
  ]

  it('getters messages() 시험', () => {
    const _state = { messages: testMessages }
    let result = messages.getters.messages(_state)
    expect(result).to.deep.equal(testMessages)
  })

  it('mutations messages() 시험', () => {
    const _state = {}
    messages.mutations.messages(_state, testMessages)
    expect(_state.messages).to.deep.equal(testMessages)
  })

  it('mutations addMessage() 시험', () => {
    const _state = { messages: testMessages }
    const newMessage = { email: 'ccc@www.okmail.com', text: 'this is text3' }
    messages.mutations.addMessage(_state, newMessage)

    expect(_state.messages.length).to.equal(2)
    expect(_state.messages[0]).to.deep.equal({ email: 'bbb@www.okmail.com', time: '23:50:32', text: 'this is text2' })
    expect(_state.messages[1].email).to.equal(newMessage.email)
    expect(_state.messages[1].text).to.equal(newMessage.text)
  })

  it('actions sendMessage() 시험', (done) => {
    const _state = { messages: testMessages }
    const newMessage = { email: 'ccc@www.okmail.com', text: 'this is text3' }
    const commit = (type, payload) => {
      try {
        expect(type).to.equal('addMessage')
        if (payload) {
          expect(payload.email).to.equal(newMessage.email)
          expect(payload.text).to.equal(newMessage.text)
        }
      } catch (error) {
        done(error)
        return
      }
      done()
    }

    messages.actions.sendMessage({ commit, _state }, newMessage)
  })
})

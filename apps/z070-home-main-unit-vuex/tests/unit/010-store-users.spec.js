import { expect } from 'chai'
import users from '@/store/modules/users'

describe('store users 시험', () => {
  it('getters email() 시험', () => {
    const _state = { email: 'test@test.com' }
    let email = users.getters.email(_state)
    expect(email).to.equal('test@test.com')
  })

  it('mutations email() 시험', () => {
    const _state = { email: '' }
    users.mutations.email(_state, 'frog@falinux.com')
    expect(_state.email).to.equal('frog@falinux.com')
  })
})

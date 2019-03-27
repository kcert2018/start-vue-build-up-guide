// https://docs.cypress.io/api/introduction/api.html
// https://mochajs.org/api/mocha
// https://www.chaijs.com/api/

describe('메세지 페이지', () => {

  it('준비...', () => {
    cy.visit('/')
    cy.get('#inEmail').type('frog@falinux.com')
    cy.get('#btnLogin').click()
    cy.screenshot('020-messages')
  })

  it('메세지 화면 검사', () => {

    // 홈 아이콘이 나올 것을 기대한다. 
    cy.contains('i','home').then(($el) => {   
      expect($el).to.exist
    })

    // Messages 가 나올 것을 기대한다. 
    cy.contains('div','Messages').then(($el) => {   
      expect($el).to.exist
    })

    // 메세지 목록이 나올 것을 기대한다. 
    for (let i = 0; i < 5; i++) {
      cy.get('#message-' + i).then(($el) => {
        expect($el).to.exist
      })
    }

    // 트리 스틱 아이콘이 나올 것을 기대한다. 
    cy.contains('i','menu').then(($el) => {   
      expect($el).to.exist
    })

    // Send messages 가 나올 것을 기대한다. 
    cy.contains('div','Send messages').then(($el) => {   
      expect($el).to.exist
    })

    // Message text 입력 필드가 있을 것을 기대한다. 
    cy.get('#inMessageText').then(($el) => {
      expect($el).to.exist
    })

  })

  it('메세지 화면 검사', () => {

    // 메세지를 입력하고 엔터를 입력하면 해당 메세지가 리스트 마지막 줄에 나올 것을 기대한다. 
    cy.get('#inMessageText').type('First Message')
    cy.get('#inMessageText').type('{enter}')

    cy.contains('#message-4 > div > div:nth-child(2)','First Message').then(($el) => {
      expect($el).to.exist
    })

    // 두 번째 메세지를 입력하고 엔터를 입력하면 해당 메세지가 리스트 마지막 줄에 나올 것을 기대한다. 
    cy.get('#inMessageText').type('Second Message')
    cy.get('#inMessageText').type('{enter}')

    cy.contains('#message-4 > div > div:nth-child(2)','Second Message').then(($el) => {
      expect($el).to.exist
    })

    // 리스트 마지막 줄 이전 줄에 이전에 입력할 메세지가 나올 것을 기대한다.     
    cy.contains('#message-3 > div > div:nth-child(2)','First Message').then(($el) => {
      expect($el).to.exist
    })

  })

})

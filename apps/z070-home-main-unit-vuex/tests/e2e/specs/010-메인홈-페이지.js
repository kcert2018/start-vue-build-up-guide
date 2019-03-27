// https://docs.cypress.io/api/introduction/api.html
// https://mochajs.org/api/mocha
// https://www.chaijs.com/api/

describe('메인 홈페이지', () => {

  it('메인 홈페이지 표현 확인', () => {

    // 브라우저에 localhost:8080/ 으로 접속한다.
    cy.visit('/')
    cy.screenshot('110-home')

    // Messages ! 가 나올 것을 기대한다. 
    cy.contains('Messages !').then(($el) => {   
      expect($el).to.exist
    })

    // Send your message to the world! 가 나올 것을 기대한다.
    cy.contains('Send your message to the world !').then(($el) => {
      expect($el).to.exist
    })

    // E-mail 입력 필드가 있을 것을 기대한다. 
    cy.get('#inEmail').then(($el) => {
      expect($el).to.exist
    })

    // Login 버튼이 있을 것을 기대한다. 
    cy.get('#btnLogin').then(($el) => {
      expect($el).to.exist
    })

  })

  it('로그인 처리 확인', () => {

    // E-mail 입력 필드에 'frog@falinux.com' 을 입력하고 
    cy.get('#inEmail').type('frog@falinux.com')
      
    // Login 버튼을 클릭하면 http://localhost:8080/#/messages 로 이동할 것을 기대한다.
    cy.get('#btnLogin').click()
    cy.screenshot('112-after-login')

    cy.location().should((loc) => {
      // cy.task('console', ['location = ', loc])
      // cy.task('console', ['loc.href = ', loc.href])
      expect(loc.pathname + loc.hash).to.eq('/#/messages')
    })
  })

})


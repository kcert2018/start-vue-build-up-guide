# 테스트 UNIT - vuex

Vue로 개발하려는 초보자들을 위한 가이드 문서입니다.  
이 장은 테스트 중 vuex 의 유닛(단위) 테스트에 대하여 설명합니다.

> 유영창 : frog@falinux.com

## 페이지 이동

* [전체 목차](../README.md) 
* [이전 단계](./A008-테스트-e2e.md)
* [다음 단계](./A010-테스트-unit-vue.md)

## UNIT 태스트?

UNIT 테스트 또는 단위 테스트라고 합니다. 이 문장에서는 말 빨을 살리기 위해서 단위 테스트라고 쓰겠습니다.
단위 테스트는 역사가 무척 오래 되었습니다. 소프트웨어 품질 관리를 이야기 할 때 반드시 나오는 이야기 입니다. 

단위 테스트에 대해 말하기 전에 고수 프로그래머들에 대한 이야기 하나 할 까 합니다. 

보통 초보 프로그래머와 고수 프로그래머의  프로그램 작성 과정을 비교해 보면,
공통적으로 차이가 나는 점이 하나 있습니다. 

초보 프로그래머들은 항상 뭐가 그리 급한지 한꺼번에 합니다. 
소스를 작성할 때, 한번에 전체 코드를 만들고 나서 컴파일 합니다. 
새로운 기능 시험도 하고 있던 소스 코드에 구현하면서 시험합니다. 

이런 습관은 처음에는 빠르게 작성해 가는 것 같지만 결국 무지 무지 무지 개발이 느려 집니다. 

반면에 고수 프로그래머들은 느립니다. 뭐 하나 작성할 때 보면 하나 짜고 시험해 보고 또 하나 짜고 시험해 보고
새로운 기능 하면 아예 새로운 기능 시험용 코드를 별도로 작성하고 시험 합니다. 

이런 습관은 처음에는 무지 무지 무지 느린데, 나중에 보면 어느새 프로그램 작성이 빠르게 끝나 버립니다. 
처음에 진행 속도는 거북이 인데 나중에 개발해 가는 속도는 거의 전광석화 입니다. 
프로그램 수정도 순식간에 뚝딱 뚝딱 해 버립니다.

문제가 생기면 하 세월인 초보 프로그래머와는 천지 차이를 느낍니다. 슈퍼 개발자는 더 합니다. 

### 진실 게임

어떻게 고수는 이럴까요? 

처음에 고수도 초보자 였을 겁니다. 하지만 프로그램에는 왕도가 없다는 것을 깨닫는 것이 고수 입니다. 

확실한 디딤돌이 없다면 징검다리를 건널 수 없다는 이치를 깨달은 이들이지요

예를 들어 봅시다. 

A 가 있다고 합시다. 이 A 가 문제가 있다면 바로 들어 납니다. 왜? 문제를 일으킬 원인이 A 하나 밖에 없기 때문입니다.

여기에 B 를 추가 해 봅시다. 이 두개는 서로 연관되어 있습니다. 

이때 A 와 B 에 문제가 있다고 한다면 우리는 문제의 원인을 찾기 위해서 다음과 같은 행위를 해야 합니다. 

1. A 가 문제인가?
2. B 가 문제인가?
3. A 의 문제가 B 때문에 생긴 문제인가?
4. B 의 문제가 A 때문에 생긴 문제인가?

오 맙소사!

단지 B 가 하나 추가했는데 검토해야 할 것이 4 개나 되었습니다. 

그러면 C 가 하나 추가 되면?

흠 대략  N! (N 팩토리)의 검토 수가 늘어 나는 군요..

그런데 만약 A 는 문제가 없다는 확신이 있다면 ?

예 모든 문제는 B 에 문제가 됩니다. 

자... 제가 뭘 말하려는 지 아시겠습니까?

문제가 N 팩토리 로 늘어나지 않으려면 하나를 추가 할 때 마다 추가 전 상황에 문제가 없도록 만들어야 합니다. 

즉 새로운 것을 추가 하기 전에 이전에 내용에 문제가 없도록 만들어야만 검토해야 할 문제가 줄어 든다는 겁니다. 

초보자들은 현재 내용에 문제가 없는 지 확인 없이 새로운 내용을 추가 하기 때문에 문제 점들이 기하 급수적으로 늘어 납니다. 

고수들은 한 단계 한 단계를 문제가 없는지 충분한 확인을 해 가며, 다음 단계를 진행해 가기 때문에
일정한 속도로 개발해 갈 수 있는 겁니다. 

자 이렇게 각 단계에 문제가 없는지 검토 하는 것!

그게 단위 테스트 입니다. 

정시 퇴근을 하려면, 프로젝트 끝 물에 날 밤까지 않으려면 단위 테스트를 작성해야 합니다. 

### 단위 테스트 는 단위 테스트 답게!

저도 그랬지만 초보분들은 단위 테스트 와 그냥 테스트를 구별하지 못합니다. 

초보 여러분이 단위 테스트를 작성한다고 합시다. 

가장 먼저 각 함수들의 호출을 유닛 테스트로 작성할 겁니다. 

그 다음에?

아마도 여러 함수들의 처리 흐름에 따라서 호출이 되었을 때 문제가 없는가를 테스트 할 겁니다. 

바로 여기에 함정이 있는 겁니다. 

UNIT 테스트는 단위 테스트라고 합니다. 통합 테스트가 아니죠..

그래서 단위 테스트는 각 단위에 집중해야 합니다. 

그냥 함수에 대한 시험이 끝나면 거기서 끝내야 합니다. 

더 하게 되면 함수의 처리 흐름에 다양한 케이스를 만들어 가야 하기 때문에 끝도 없게 됩니다. 
그러다 안 하지요 ㅠㅠ

그레서 단위 테스트는 너무 많은 것을 하려 하지 말고 그냥 함수 하나만 시험한다고 작성하셔야 합니다. 

물론 고수들은 세밀하게 시험 과정을 만들어 갑니다. 

하지만 여러분은 고수가 아니고 초보자잖아요 ? 그냥 맘 편히 함수 하나만 시험해도 됩니다. 

어? 그러면 사전에 호출한 함수 때문에 내용이 바뀌고 처리 과정이 바뀌면 그런건 어떻게 하죠?

이런 질문 나오실 줄 알았습니다. 

그래서 목업이라는 것이 필요한 겁니다. 가짜 데이터요..

그냥 시험용이 아니고 각 함수를 시험 할 때는 미리 가정을 하는 거지요

이런 사전 상황에서는 이 함수는 이런 동작을 해야 한다. 

당연히 여러분도 함수를 구현할 때는 이런 생각을 하고 작성하잖아요?

그리고 예상된 상황에 맞추어 동작하는지 여러분들도 수동으로 검사 하잖아요?

앞에다 값 넣어 보고 처리되는 지 찍어 보고....

프로그램 작성할 때 시험은 이렇게 하고 테스트 루틴은 다르게 짜고..

앞에서 이야기 했지요.. A 에 문제가 없다면 모든 문제는 새로 작성하는 B의 문제다. 

이전에 호출한 함수가 문제가 없다면 다음 새로 작성한 함수의 문제 지요...

그래서 각 함수에 집중하는 것이 중요한 겁니다. 

괜히 A 호출해 보고 B 호출해 보고 이상 없는지 살펴 보느는 것은 E2E 나 integration 에서 하는 것이 낫습니다. 

그리고... 중요한 것인데... 

믿기지 않겠지만 UNIT 테스트로 거의 대부분의 버그는 잡힙니다. 

안 잡히는 버그들은 대부분 비즈니스 로직의 문제로 단순 프로그램 구현 버그는 아닙니다. 

그리고 비즈니스 로직은 E2E 나 통합 테스트에서 충분히 잡혀 갑니다. 

그러니 UNIT 테스트 즉 단위 테스트에서는 해당 함수의 검사만 신경 쓰면 됩니다.

어휴... 설명충이 또 실제 코딩은 보여 주지도 않고 말만 늘어 놓았습니다. 

자 이제 실제로 해 보지요

### VUE 에서의 단위 테스트 

하지만 먼저...

VUE 에서 단위 테스트는 단순히 함수의 실행 상태 검사만 하는 것이 아니고 보여주는 부분도 검사해야 합니다. 

이 부분이 백엔드나 일반 어플리케이션 단위 테스트와 다른 점이죠.

VUE 를 사용한다면 크게 두 부분으로 나누어 질 수 있습니다. 

VUE 확장자로 끝나는 것과 JS 확장자로 끝나는 것!

보통 컴포넌트인 *.vue 와 vuex 인 *.js 또는 class 또는 모듈인 *.js 로 나눌 수 있습니다. 

이 중 복잡하지 않은 vuex 부터 단위 테스트 루틴을 작성해 가 봅시다. 

## vuex 단위 테스트 

현재까지 작성된 vuex 모듈은 다음 세가지 입니다. 

* app.js
* messages.js
* users.js 

이 중 app.js 는 내부에 아무런 함수가 없습니다. 비어 있지요
그리고 다행스럽게 users.js 는 뮤테이션만 있고 messages.js 액션과 뮤테이션이 모두 있습니다.

고수는 쉬운 것 부터 합니다. 당연히 users.js 부터 단위 테스트 루틴을 작성해 봅시다. 

단위 테스트 루틴은 다음 위치에 구현 합니다. 

> tests/unit/

VUE 가이드에도 vuex 의 시험을 어떻게 하는 지 잘 나와 있습니다. 꼭 참조 하세요...

> https://vuex.vuejs.org/guide/testing.html

## vuex getters, mutations 단위 테스트 

users.js 에는 getters 와 mutations 의 시험을 어떻게 하는지 알 수 있는 간단한 단위 테스트를 만들 수 있습니다. 

getters 와 mutations 에 구현하는 함수는 비동기 함수 입니다. 

users 단위 테스트 예제를 통해서 어떻게 동기 함수 인 getters 와 mutations 에 선언된 함수를 시험 하는지 알 수 있습니다. 

users.js 를 시험하기 위해서 다음과 같은 단위 테스트 루틴을 만듭니다. 

> tests/unit/010-store-users.spec.js

이름은 유닛 테스트 진행 순서를 맞추기 위해서 번호를 가장 앞에 놓았고 그 다음에 vuex 의 파일임을 나타내기 위해서 store 를 붙인 후 최종 모듈 이름을 넣었습니다. 

여러분은 그냥 이 샘플처럼 이름을 맞추세요. 그게 맘 편히 사는 길입니다. ^^;

내부적 팀 룰이 없으면 이렇게 이름 짓는 것을 규칙화 하세요

이제 다음과 같이 시험 내용을 만듭니다. 

> [apps/home-main/tests/unit/010-store-users.spec.js](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/apps/home-main/tests/unit/010-store-users.spec.js)

~~~ javascript
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
~~~

단위 시험 루틴 작성은 진짜 쉽습니다. 

시험하고자 하는 email() 함수에서 필요한 조건을 준비하고, 
여기서는 첫번째 매개변수인 _state 를 준비합니다. 
그리고 email() 함수를 호출하고 email()함수가 처리한 결과를 
expect() 루틴으로 검사 합니다. 

초보분들은 정상적인 상황만 작성하세요. 원래는 비정상 상태 즉 고의로 에러 입력 값들을 만들어 이에 대한
스트레스 테스트도 하는데, 이건 만들 루틴의 양이 생각보다 많아서 테스트 작성이 몸에 베이시면 그때 부터 하시면 됩니다.
처음부터 스트레스 받아서 테스트 작성을 그만두는 것보다 간단하게나마 작성하는 것이 백배 낫습니다. 

./run-unit.sh 를 실행하여 단위 테스트를 진행합니다. 

~~~ bash
$ ./run-unit.sh
 WEBPACK  Compiled successfully in 1180ms

 MOCHA  Testing...

  store users 시험
    ✓ getters email() 시험
    ✓ mutations email() 시험

  2 passing (4ms)

 MOCHA  Tests completed successfully

Done in 3.00s.
~~~

워낙 소스가 간단해서 이해하는데 별 무리가 없을 겁니다. 

## vuex actions 단위 테스트 

messages.js 단위 테스트는 actions 에 대한 것을 처리하는 부분이 추가됩니다. 

actions 의 단위 테스트 구현은 많이 복잡한니다. 왜냐하면?

1. 일반적으로 서버와의 비동기 통신 처리 
2. commit 함수의 내부적 호출 

대부분 이 두 가지가 일어나기 떄문입니다. 

이 부분에 대한 유닛 테스트를 구현하고 검증하는 것은 초보자 분들에게 조금 무리이니
쪼오금 뒤, 즉 내부적 서버와 연동이 되었을 때 한번 더 다루도록 합니다. 

다행이 sendMessage action 함수는 아직까지 서버와 통신도 구현하지 않고 단순히 commit 만 
하고 있으므로 commit 만 처리하는 것을 구현하도록 하겠습니다. 

이제 다음과 같이 시험 내용을 만듭니다. 

> [apps/home-main/tests/unit/010-store-messages.spec.js](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/apps/home-main/tests/unit/020-store-messages.spec.js)

~~~ javascript
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
~~~

여기서 sendMessage() action 에 대한 단위 테스트를 어떻게 구현했는가를 검토해 보겠습니다. 

구현 루틴을 이해하려면 먼저 처음 이야기 했던 부분 즉 단위 테스트는 해당 함수가 동작하는 갸에 
집중한다는 원칙을 다시 한번 상기 해야 합니다. 

sendMessage() 함수가 호출했을 때 내부적으로 addMessage() 를 호출합니다. 

특별히 다른 처리는 없지요.. addMessage() 뮤테이션은 이미 앞에서 검증하고 있고요

그래서 sendMessage() 는 commit() 처리가 제대로 이루어 졌는가만을 검증합니다. 

당연히 이 처리에 문제가 없으면 state.messages 는 제대로 변경될 것이기 때문입니다. 

그래서 가짜 commit 함수를 만들어서 실제 commit 가 이루어질 때 필요한 것들이 정상적으로 
이루어져 있는가 만을 검증합니다. 

그외의 내용은 불필요한 것이지요.. 이미 구현된 addMessage 을 믿는 겁니다. 왜 addMessage 도 단위 테스트가 되었을 것이고 
만약 단위 테스트를 통과 했다면 addMessage() 함수가 처리한 부분은 검증할 필요가 없는 겁니다. 

한가지 기억해야 하는 것은 action 함수에서 또다른 함수를 호출하여 처리가 끝나것을 알려 주기 위해서 

~~~ javascript
it('actions sendMessage() 시험', (done) => {
   :
}
~~~
이런식으로 done 이라는 콜백 함수를 선언하고 

에러가 나면 

~~~ javascript
  } catch (error) {
    done(error)
    return
  }
~~~

이런식으로 에러를 처리하여 단위 테스트 에러 처리가 되도록 해 주어야 합니다. 

정상적으로 끝나면 done() 를 호출하고 함수를 복귀하면 됩니다. 

~~~ javascript
  done()
~~~

자 간단하게 vuex 의 단위 테스트 부분을 살펴 보았습니다. 

./run-unit.sh 를 실행하여 단위 테스트를 진행합니다. 

~~~ bash
 WEBPACK  Compiled successfully in 1261ms

 MOCHA  Testing...

  store users 시험
    ✓ getters email() 시험
    ✓ mutations email() 시험

  store messages 시험
    ✓ getters messages() 시험
    ✓ mutations messages() 시험
    ✓ mutations addMessage() 시험
    ✓ actions sendMessage() 시험

  6 passing (7ms)

 MOCHA  Tests completed successfully

Done in 3.08s.
~~~

항상 말씀 드리지만 단위 테스트 검사 구현은 조기 퇴근을 필수 셋트 입니다. 

반드시 합시당.

## 페이지 이동

* [전체 목차](../README.md) 
* [이전 단계](./A008-테스트-e2e.md)
* [다음 단계](./A010-테스트-unit-vue.md)

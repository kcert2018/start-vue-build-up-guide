# 테스트 UNIT - vue

Vue로 개발하려는 초보자들을 위한 가이드 문서입니다.  
이 장은 테스트 중 vue 의 유닛(단위) 테스트에 대하여 설명합니다.

> 유영창 : frog@falinux.com

## 페이지 이동

* [전체 목차](../README.md) 
* [이전 단계](./A009-테스트-unit-vuex.md)
* [다음 단계](./A000-준비중.md)

## vue 단위 테스트 

vue 에 대한 단위 테스트는 어떻게 해야 할까요?

아! 정확히는 싱글 파일 컴포넌트 형식의 VUE 단위 테스트일 경우 입니다. 

힌트를 드리면

제가 왜 E2E 테스트를 먼저 설명하고 그리고 vuex 단위 테스트를 설명한 후에 

마지막으로 vue 단위 테스트를 설명해 가고 있을까요?

다시 한번 말씀 드리자면 우린 통합 테스트를 작성하고 있는 것이 아니고 

vue 단위 테스트를 하려고 하는 겁니다. 

하나의 싱글 파일 컴포넌트 vue 는 그 내부에 또 다른 컴포넌트들을 포함 할 수 있습니다.

또한 앱 어플리케이션을 구성하는 컴포넌트는 vuex 와 연결되어 있습니다. API 호출도 연결됩니다. 

제가 초보분들이 이런 경우 단위 테스트를 작성하는 것을 보면 통합 테스트 처럼 단위 테스트를 작성해 가시더라구요

거의 90% 로 ....

여러분은 무의식 중에 E2E 테스트와 통합 테스트에서 해야 하는 것들을 단위 테스트에 구현합니다.

아..니..죠...

우린 단위 테스트를 작성하는 겁니다. 

사용자의 입력에 의해서 변경되는 것을 테스트 하는 것은 E2E 에서 하면 됩니다. 

사용자가 버튼을 클릭하여 로직이 동작하여 라우팅 화면 이동은 E2E 에서 검사 하면 됩니다. 

사용자 클릭으로 인하여 vuex 액션 함수를 호출하는 것은 vuex 단위 테스트에서 검사하고 

E2E 또는 통합 테스트에서 처리되는 지 검사 하면 됩니다. 

단위 테스트에서는 이런 검사를 할 필요가 없는 거지요. 중복 검사 입니다. 

자신이 작성한 다른 검사 루틴을 믿지 못하고 또 하나의 테스트 루틴을 작성하는 겁니다. 

자.. 우리.. 정신 차립시다. 

단위 테스트는 순수하게 해당 소스에 대한 검사만 하면 됩니다. 

그 나머지는 다른 테스트에서 충분히 하면 됩니다. 

### vue 단위 테스트 검사 항목들

그럼 vue 단위 테스트에서는 무슨 검사를 해야 할까요?

저는 다음과 같은 검사를 제안을 합니다. 

* 사용되는 컴포넌트의 생성 유무
* data, props, computed 등의 데이터와 컴포넌트의 연결 검사
* 사용된 엘레먼트의 이벤트와 컴포넌트의 이벤트 발생 및 함수 연결 관계
* 다른 곳에 연동되지 있지 않고 자체 함수의 기능에만 충실한 함수의 수행 검사

이 정도면 충분합니다. 

그 외에는 초보 수준을 넘어 서신 후 하셔도 충분 합니다. 

별거 없죠?

## Vue Test Utils

vue 는 구현 구조상 Vue 인스턴스 형태로 동작하기 때문에 시험을 하려면 원칙적으로 
main.js 에 구현하고 있는 Vue 인스턴스 생성과 사용되는 각종 모듈을 등록하는 Vue.use() 처리등이 필요합니다. 

그렇게 되면 전체 앱의 동작을 그대로 재현하게 되는데...

이건 단위 테스트에서 불 필요한 처리를 하게 되어 단위 테스트란 의미가 퇴색됩니다.

해당 단위 테스트 대상만 검사해야 하는데 산으로 가버리는 거죠

그래서 vue/test-utils 가 등장합니다. 

이 모듈은 순수하게 단위 테스트에 집중할 수 있도록 필요한 기능을 제공합니다. 

이 모듈은 Vue CLI 3.0 로 구축하면서 테스트를 선택했다면  자동 설치 되기 때문에 

여러분은 따로 설치할 필요는 없습니다. 그저 다음과 같은 형태로 포함하면 됩니다.

~~~ javascript
import { mount } from '@vue/test-utils'
~~~

## shallowMount, createLocalVue

vue test util 에서 가장 중요한 컴포넌트는 shallowMount, createLocalVue 입니다. 

원래 Vue 는 Vue 인스턴스를 댜음과 같이 시작함으로써 동작이 됩니다. 

~~~ javascript
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
~~~

이것과 대신해 주는 것이 createLocalVue 입니다. 

인스턴스가 생성된 후 각 컴포넌트들은 마운트가 되면서 초기화와 렌더링을 하는데 

자식 컴포넌트들은 랜더링을 하지 않고 지정된 컴포넌트만 렌더링하는 것이 shallowMount 입니다. 

이 두가지를 조합해서 다음과 같이 시험전에 준비합니다. 

~~~ javascript
import { expect } from 'chai' // eslint-disable-line no-unused-vars
import { shallowMount, createLocalVue } from '@vue/test-utils' // eslint-disable-line no-unused-vars

import TestTargetVueComponent from '@/views/home-main.vue'

const localVue = createLocalVue()

  :
describe('home-main 시험', () => {
  it('mainViem 생성 시험', () => {
    const mainView = shallowMount(TestTargetVueComponent, {
      localVue
    })
       : 
  })
})
~~~

아! 모든 이벤트나 기타 등등의 처리가 비동기 처리되지 않고 동기 처리가 된다는 점! 기억해 주세요

## 딘위 테스트 대상

일단 맛 만 보여 주는 따라하기 이므로 여기서는 아주 단순한 단위 테스트 코드를 만들어 보겠습니다. 

현재까지 작성된 vue 모듈은 다음 세가지 입니다. 

* App.vue
* home-main.vue
* messages-main.vue

이 중 App.vue 는 내부에 라우팅 이외에는 특별히 검사할 만한 것이 없습니다. 비어 있지요

그래서 우리는 home-main.vue 와 messages-main.vue 만 검사하면 됩니다. 

## 이번 강좌의 변명

잠깐 여러분께 변명하나 하고 진행하겠습니다. 

단위 테스트를 하는 방법은 꼭 이렇게 하는 거다 라는 정석이 없습니다. 

프로그램 스타일이 사람마다 다 다르기 때문입니다. 

단지 단위 테스트는 검사 하고자 하는 소스에 집중하는 것만 기억하면 됩니다. 

제가 따라하기에 보여 주는 예제 역시 제 스타일입니다. 

그래서 꼭! 이렇게 할 필요는 없습니다. 

의외로 인터넷에서 공유되는 다른 고수들의 처리 과정을 보면 다양한 방법으로 자신만의 단위 태스트를 구현합니다. 

초보분들은 일단 이 강좌를 통해서 이렇게 하는 구나 하고 감을 잡으신 후에 자신만의 스타일을 가지시기 바랍니다. 

아 물론 팀 단위로 할때는 팀의 리더 스타일을 따라가게 되어 있습니다. 

그때는 자신의 개성을 좀 죽이셔야 겠죠?

그리고 제가 가장 골치 아픈 개념만 설명하고 그 외는 설명을 하지 않겠습니다 .

소스를 보시고 이해하려고 노력하셨으면 합니다. 

절.대.로..  강좌 쓰기 싫어서 그런거 아닙니다.

## home-main.vue 단위 테스트

먼저 home-main.vue 에 대한 단위 테스트를 합시다. 

여기서 우리가 단위 테스트 해 볼 만 한 것은 딱! 두가지 입니다. 

이메일 입력과 로그인 버튼 입니다. 

이메일 입력은 email 데이터와 <v-text-field> 간에 상호 연동되는 검사를 수행합니다. 

email 에 데이터가 수정되면 표출되는 내용이 바뀌어야 하고 반대로 사용자가 입력하면 해당 
데이터가 email 에 적용되어야 합니다. 

로그인 버튼은 클릭하면 clickLogin() 함수가 호출 되어야 합니다. 

이 정도가 단위 테스트 범위 입니다. 

정상적인 경우와 비 정상적인 경우 두 가지를 하면 좋겠지만 
우린 그냥 정상적인 것만 하시죠.. 편하게 삽시당..

## email 연동 시험

단위 테스트의 첫번째 시험은 email 데이터가 <v-text-field> 에 정상적으로 연동되는가를 시험합니다. 

email 은 다음과 같이 data 에 선언됩니다. 

~~~
export default {
        :
  data () {
    return {
      email: ''
    }
  },
~~~

이 변수는 다음과 같이 <v-text-field> 컴포넌트에 연동됩니다. 

~~~
 <v-text-field
    id="inEmail"
    v-model="email"
    label="E-mail"
  ></v-text-field>
~~~

이 두 요소의 연동 관계를 시험하기 위해서 다음과 같은 테스트 루틴을 작성합니다. 

~~~
it('email 필드 시험', async () => {
  let mainView = shallowMount(MainView, {
    localVue,
    stubs: {
      'v-text-field': { template: '<div>{{ value }}</div>', props: ['value'] }
    }
  })

  expect(mainView.vm.email).to.be.empty // email 데이터 체크

  const inEmail = mainView.find('#inEmail')
  // console.log('inEmail.html()) =', inEmail.html())
  expect(inEmail.exists()).to.be.true // 입력 필드 체크
  expect(inEmail.text()).to.be.empty // 이메일 입력 필드 체크

  let checkInput = 'frog@falinux.com'
  mainView.setData({ email: checkInput })
  expect(mainView.vm.email).to.be.equal(checkInput) // email 데이터 체크
  expect(inEmail.text()).to.be.equal(checkInput) // 이메일 입력 필드 체크
})
~~~

헉! 복잡하죠?

여기서 stub 의 개념을 이해할 필요가 있습니다. 

단위 테스트를 할때 vue 의 마운트 과정을 가짜로 구현하기 위해서 

shallowMount() 함수를 사용한다고 하였습니다. 

이 함수는 자식 컴포넌트들은 모두 stub 로 대치된다고 앞에서 설명하였습니다. 

즉 shallowMount() 를 사용하여 마운트를 처리하면 모든 자식 컴포넌트들은 실제 렌더링이 되지 않고 

다음과 같은 형태로 렌더링 됩니다. 

~~~
 <v-text-field-stub data-v-2de9b1bd="" id="inEmail" label="E-mail"></v-text-field-stub>
~~~

원래 태그 이름 뒤에 "-stub" 라는 접미사가 붙어서 만들어 집니다. 
id 나 label 과 같은 속성은 그대로 유지 됩니다.

그런데 가장 핵심적인 v-model 은 연동되지 않습니다. 

우리가 원하는 테스트는 email 과 v-text-field id="inEmail" 의 연동이죠

그래서 이런 시험이 가능하게 v-text-field 필드의 stub 형태를 우리가 지정할 수 있도록 합니다. 

다음 처럼요

~~~
  let mainView = shallowMount(MainView, {
    localVue,
    stubs: {
      'v-text-field': { template: '<div>{{ value }}</div>', props: ['value'] }
    }
  })
~~~

여러분이 vue 를 이해하고 계신다면 v-model 은 사실 다음과 같은 형태의 다른 표현임을 알고 계실 겁니다. 

모르셨다면 지금 다시 이해하시고 뷰에 대한 가이드 문서를 다시 한번 꼼꼼히 읽어 주세요

> v-model 선언
~~~
<input v-model="something">
~~~

> v-model 실제 구현 
~~~
<input v-bind:value="something" v-on:input="something = $event.target.value">
~~~

하지만 단위 테스트에서는 연동 관계만 확인하므로 복잡한 시험 구현 문제를 해결하기 위해서 

~~~
v-text-field 
~~~

를 

~~~
<div>{{ value }}</div>
~~~

로 대치하고 value 를 props 로 선언합니다. 

그리고 다음과 같은 형태로 값이 연동되는지 검사합니다. 

~~~
    const inEmail = mainView.find('#inEmail')
    // console.log('inEmail.html()) =', inEmail.html())

    let checkInput = 'frog@falinux.com'
    mainView.setData({ email: checkInput })
    expect(inEmail.text()).to.be.equal(checkInput) // 이메일 입력 필드 체크
~~~

이 검사를 통과혀면 우리는 email 변수와 id 가 inEmail 인 v-text-field 컴토넌트가 연동되도록 
처리 되었음을 검사 할 수 있는 거죠 

이렇게 단위 테스는 검사 대상에만 집중하도록 작성해야 합니다. 

흠 어렵나요?

하지만 조기 퇴근하려면 이해하고 적용하고 단위 검사를 습관화 해야 합니다. 

자 이제 사용자 입력 이벤트에 대한 것을 검사해 보도록 해야 합니다.

이때 여러분은 vue test utils 말고 또 다른 패키지를 하나 설치 해야 합니다. 

그게 뭐냐? 

그 유명한 sinon (발음: 사히논[sahy-non] 입니다) 입니다. 

sinon을 이용해 mock, spy, stub 을 쉽게 작성하여 테스트를 도와 줍니다 .

mock spy stub 의 개념은 설명히 너무 길어지니 그냥 stub 에만 신경 쓰십시오

stub 는 가짜 또는 대신 이라는 의미로 이해하시면 됩니다. 

이벤트가 발생하면 원래 동작해야 할 이벤트 처리 함수 대신에
sinon 을 이용하여 가짜 함수를 하나 만듭니다. 
그리고 이 함수를 이용하여 호출이 발생했는가를 검사 합니다. 

먼저 다음과 같이 sinon 패키지를 설치 합시다. 

~~~ bash
$ ./run-bash.sh 
$ cd home-main/
$ yarn add -D sinon
~~~

우리가 검사할 대상은 다음입니다. 

~~~ javascript
<v-btn
  id="btnLogin"
  color="warning"
  @click="clickLogin"
>Login</v-btn>
~~~

버튼을 누르면 clickLogin() 함수가 호출되는가를 검사합니다. 

다음과 같이 테스트 루틴을 작성하면 됩니다. 

~~~ javascript
import sinon from 'sinon'

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
~~~

email 을 작성한 것과 유사 합니다. 
단지 사용자 마우스 클릭을 흉내 내기 위한 처리를 

btnLogin.vm.$emit('click') 

롤 하는 것과 

클릭이 호출되었을 때 이를 검사 하기 위한  stub 구현 처리 

~~~ javascript 
const clickHandler = sinon.stub()
     :
  methods: { 'clickLogin': clickHandler },
  stubs: {
    'v-btn': { template: '<button></button>' }
  }
    :
~~~

그리고 호출 결과를 검사 하는 

~~~ javascript 
expect(clickHandler.called).to.equal(true)
~~~

이 다른 점입니다. 

자 이제 대략적인 동작 원리를 파악 했으므로

* home-main.vue
* messages-main.vue

에 대한 단위테스트 를 다음과 같이 만듭니다. 

소스를 보면서 나름 분석하시면서 아 이렇게 단위 테스트를 작성하는 구나 하고 느끼시고 

직접 자신만의 단위 테스트를 만들었으면 합니다. 

> [apps/home-main/tests/unit/030-home-main.spec.js](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/apps/home-main/tests/unit/030-home-main.spec.js)
~~~ javascript
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
~~~

> [apps/home-main/tests/unit/040-messages-main.spec.js](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/apps/home-main/tests/unit/040-messages-main.spec.js)
~~~ javascript
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

~~~

./run-unit.sh 를 실행하여 단위 테스트를 진행합니다. 

~~~ bash
$ ./run-unit.sh
~~~

항상 말씀 드리지만 단위 테스트 검사 구현은 조기 퇴근을 필수 셋트 입니다. 

반드시 합시당.

## 페이지 이동

* [전체 목차](../README.md) 
* [이전 단계](./A009-테스트-unit-vuex.md)
* [다음 단계](./A000-준비중.md)

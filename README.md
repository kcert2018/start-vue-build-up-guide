# Vue 프로젝트 시작 안내서

Vue로 개발하려는 초보자들을 위한 가이드 문서입니다.  

> 유영창 : frog@falinux.com

## 들어가며

Vue 와 관련 소개글을 읽으면, 쉽다는 생각이 듭니다. 도전 의지도 마구 마구 생깁니다.  

맞습니다. 남들이 하는 거 보면 쉽습니다!  

내가 하며? 어렵습니다. 

> 왜?  
> 처음에 어떻게 시작해야 할지 막막하기 때문입니다.  

그래서 처음 하시는 분들이 따라 하도록 문서를 만들어 봤습니다. 그동안 최신 트랜드에 따라가기 위해 제가 했던 삽질을 여러분이 하면 안되잖아요?

그리고 생각보다 초기 개발 환경 빌드 과정은 쉽습니다!

### 최소 필요 지식

이 글을 읽고 따라하시려면 우분투와 도커는 아셔야 합니다. 

* ubuntu(mint 포함) 명령 사용법
* docker 와 docker-compose 사용법
* git 사용법

전문가 수준이 필요한 것이 아닙니다. 필요할 때 구글 검색하면서 배워 가실 정도면 됩니다.

### 개발 환경

개인적으로 저는 민트를 씁니다. 우분투 기반이라 우분투와 호환되면서 GUI 환경이 좋습니다. 윈도우를 쓰시는 분들은 말리고 싶습니다. 맥은? 부럽습니다. 

이 후에 실행될 명령들은 모두 리눅스 명령입니다. 

### 도커를 알아야 하는 이유 

프런트 앤드 개발자로 사시려면 도커를 학습할 것을 강력하게 권장합니다.  

그 이유는 자신의 PC 를 보호하기 하기 위한 것이고, 개발 과정에서 필수적으로 요구 되기 때문입니다. 

프런트앤드 개발을 하시면 다양한 공개 소프트웨어와 툴들을 사용하실 겁니다. 공개 소프트는 반드시 필요한 패키지가 있습니다. 각 요구 버전도 다릅니다.

그래서 여러분의 개발 PC 는 언젠가는 너덜 너덜 해 집니다. 결국 PC 초기화를 하시는 자신의 모습을 보시게 될 겁니다. 이런것이 싫으면 도커 컨테이너로 개발 환경을 구축하는 것이 수명 연장의 지름길입니다. 

프런트엔드 개발자지만 필수적으로 백 엔드도 다루게 됩니다. 개발 단계를 따라가거나 자동화를 쫒다보면 반드시 도커 컨테이너를 알아야 할 것이고 결국 쿠버네티스를 만나 큐브를 만지작 거리는 자신을 발견하게 되실 겁니다.

반드시! 도커 공부하십시오!

## 개발 환경 구축

가장 처음 해야 할 일은 개발 환경을 구축 하는 것입니다. 

최소한의 개발 환경은 다음과 같습니다. 

* 우분투가 설치된 개발 PC 1 대 
* docker 및 docker-compose
* 에디터 : Visual Studio Code 권장
* 크롬브라우저 

위에 나열된 개발 환경 설명은 언젠가(?) 쓰도록 하겠습니다. 

### project 폴더 생성 

오랬동안 삽질한 결과, 항상 project 폴더를 홈디렉토리 밑에 만듭니다. 
초보자시라면 당분간 그냥 project 폴더를 홈디렉토리 밑에 만드십시오

여기서는 start-study 라는 폴더로 만들고 이후에는 이 폴더명을 따로 언급하지 않을 겁니다. 

다음과 같이 만들기 바랍니다. 

~~~ bash
$ cd ~
$ mkdir start-study
$ cd start-study
~~~

github 의 문서로 이글을 보시고 계시다면 이 프로젝트 자체가 위 폴더명으로 clone 된 것입니다. 

### project 폴더 구성 

이제 폴더 하부에 다음 폴더들를 만드십시오

* apps - 프런트 앤드 개발 소스들 넣을 곳
* doc - 프로젝트 관련 문서들 넣을 곳
* docker - 도커 및 명령들 넣을 곳
* kube - 쿠버네티스 관리에 필요한 환경 파일 및 스크립트들 넣을 곳

왜 이렇게 만드는지를 설명하지 않겠습니다. 앞으로 진행하다보면 다 필요한 폴더들입니다. 
물론 나중에 고수가 되시면 자신만의 방법으로 하시면 됩니다. 

초보자님들은 그냥 묻지도 따지지도 마시고 따라 오십시오.

다음 명령을 사용하시면 됩니다. 

~~~ bash
$ cd ~/start-study
$ mkdir apps
$ mkdir doc
$ mkdir docker
$ mkdir kube
~~~

### docker-compose.yml 작성

개발 환경을 도커 환경을 만들기 위해서 docker-compose 를 사용합니다. 
이때 필요한 파일이 docker-compose.yml 입니다. 

docker 폴더 밑에 docker-compose.yml을 다음과 같이 작성합니다. 

> [docker/docker-compose.yml](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/docker/docker-compose.yml)

~~~ yaml
#
# 이 파일은 도커를 관리하는 파일입니다. 
#
version: '2'
services:
  start-home-main-ds:
    image: start/home-main-ds:0.1
    container_name: start-home-main-ds
    volumes:
      - ../apps/:/apps
    network_mode: "host"
    privileged: true
    environment:
      NODE_ENV: development
      CYPRESS_CACHE_FOLDER: /apps/.cypress-cache
    command: bash

  start-vue-cli-3-ds:
    build:
      context: ./development
      dockerfile: Dockerfile
    image: start/home-main-ds:0.1

# end of file
~~~

따라하는 과정에서 이 파일을 당장 이해할 필요는 없습니다. 여기서는 어떤 것을 정의 하는지 간단하게만 정리합니다. 

도커 이미지 생성 관련된 것은 vue-cli-3-ds 섹션에서 정의합니다.

* development/Dockerfile 을 이용하여 start/home-main-ds:0.1 라는 이름으로 아미지가 만들어집니다. 

개발 환경 컨네이너는 start-home-main-ds 섹션에서 정의 합니다. 

* 개발 환경 컨테이너는 호스트 PC와 포트를 공유하고 root 권한으로 실행됩니다. 
* "apps" 폴더를 컨테이너 내부에 "/apps" 로 연결합니다. 
* 개발 환경임을 알리기 위해서 환경 변수 NODE_ENV 를 development 로 설정합니다. 
* E2E 테스트를 위한 캐쉬 폴더를 /apps/.cypress-cache 로 사용하기 위해 CYPRESS_CACHE_FOLDER 환경 변수를 설정합니다.

### Dockerfile 작성

개발 환경 컨네이너 이미지를 생성하기 위해서는 Dockerfile이 필요합니다.

docker/development 폴더를 만들고 Dockerfile를 다음과 같이 작성합니다. 

> [docker/development/Dockerfile](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/docker/development/Dockerfile)

~~~ dockerfile
FROM node:8.12.0

MAINTAINER David You <frog@falinux.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

RUN apt-get install -y locales
RUN dpkg-reconfigure locales 
RUN locale-gen C.UTF-8 
RUN /usr/sbin/update-locale LANG=C.UTF-8
  
# Install needed default locale for Makefly
RUN echo 'ko_KR.UTF-8 UTF-8' | tee --append /etc/locale.gen
RUN locale-gen

# Set default locale for the environment
ENV LC_ALL C.UTF-8
ENV LANG ko_KR.UTF-8
ENV LANGUAGE ko_KR.UTF-8

RUN apt-get update && apt-get install -y apt-utils

RUN apt-get update && \
    apt-get install -y \
    libgtk2.0-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb

RUN apt-get update && apt-get install -y fonts-nanum

RUN echo "force new chrome here"

# install Chromebrowser
RUN \
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
apt-get update && \
apt-get install -y dbus-x11 google-chrome-stable && \
rm -rf /var/lib/apt/lists/*

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

# Add zip utility - it comes in very handy
RUN apt-get update && apt-get install -y zip

# RUN npm install -g npm@6.4.1
RUN yarn global add @vue/cli

# versions of local tools
RUN node -v
RUN npm -v
RUN yarn -v
RUN vue --version
RUN google-chrome --version
RUN zip --version
RUN git --version

# good colors for most applications
ENV TERM xterm
# avoid million NPM install messages
ENV npm_config_loglevel warn
# allow installing when the main user is root
ENV npm_config_unsafe_perm true

WORKDIR /apps
CMD bash
~~~

이 파일은 나중에(?) 따로 설명하는 문서를 작성하도록 하겠습니다. 

이 파일에 의해서 작성된 이미지는 다음과 같은 내용을 포함하게 됩니다. 

* 한글과 관련된 패키지
* node 8.12.0
* npm 
* yarn
* vue cli 3.0
* cypesss E2E 테스트를 위한 크롬 브라우저
 
### 빌드 스크립트 - build-dev.sh

docker 또는 docker-compose 명령을 사용해서 직접 이미지를 생성할 수 있지만 나중을 위해서 스크립트를 만들어 두는 것이 머리털 안 빠지는 삶의 지혜입니다. 

build-dev.sh 이름으로 다음과 같이 작성합니다. 

> [docker/build-dev.sh](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/docker/build-dev.sh)

~~~ bash
#!/bin/bash
docker rmi start/home-main-ds:0.1
docker-compose build start-vue-cli-3-ds 
~~~

이 스크립트는 기존에 작성된 이미지를 지우고 docker-compose build 명령을 이용하여 새로운 이미지를 만듭니다. 

### 이미지 생성

start/home-main-ds:0.1 란 이름의 도커 이미지를 생성하기 위해서 build-dev.sh 을 다음과 같이 실행하여 생성합니다. 

~~~ bash
$ cd ~/start-study/docker
$ ./build-dev.sh 
~~~

생성이 끝난 후 docker images 명령을 사용하여 정상적으로 생성된 것을 확인 합니다. 

~~~ bash
$ docker images
REPOSITORY           TAG   IMAGE ID            CREATED             SIZE
  :
start/home-main-ds   0.1   eea14f3fade5        6 hours ago         1.35GB
~~~

### 개발 환경 컨테이너 실행 스크립트 - run-bash.sh 

제대로 이미지가 만들어 졌는지 실험도 할겸, 이 후에 개발 작업들을 하기 위해서 컨테이너 실행 스크립트를 만들어야 합니다. 

run-bash.sh 이름으로 다음과 같이 작성합니다. 

> [docker/run-bash.sh](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/docker/run-bash.sh)

~~~ bash
#!/bin/bash
echo -e "\\033]2;start home main bash\\007"
docker-compose run --name start-home-main-ds-bash \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/ \
  start-home-main-ds \
  bash
~~~

이 스크립트는 새로운 vue 개발을 위한 플러그인이나 패키지 기타 쉘에서 수행해야 하는 작업을 위한 스크립트 입니다. 초기 구축 때 자주 사용됩니다. 

스크립트를 실행하는 타이틀에 실행된 컨테이너의 용도를 표시하기 위해서 다음 문장을 포함합니다. 

    echo -e "\\033]2;start home main bash\\007"

컨테이너를 실행하면서 사용되는 옵션의 용도는 다음과 같습니다. 

* docker-compose run : 컨테이너를 실행하기 위한 명령입니다. 
* --name start-home-main-ds-bash : "start-home-main-ds-bash" 란 이름으로 컨테이너가 실행되도록 합니다. 
* --rm : 컨테이너가 종료되면 삭제 되도록 합니다. 
* -u $(id -u ${USER}):$(id -g ${USER}) : 현재 수행중인 사용자의 id 가 내부에 사용되도록 만듭니다. 
* --workdir /apps/ : 컨테이너가 시작된 후 컨테이너 내부의 현재 디렉토리를 /apps 로 이동합니다. 
* start-home-main-ds : docker-compose.yml 에 선언된 실행될 컨테이너의 서비스 이름입니다. 
* bash : 실행될 명령으로 bash 를 실행합니다. 

이제 이 스크립틀 다음과 같이 수행하여 개발 환경 컨테이너 안으로 진입합니다. 

~~~ bash
$ cd ~/start-study/docker
$ ./run-bash.sh 
node@main-desk:/apps$ 
~~~

컨테이너에서 나가려면 exit 명령을 입력하고 엔터를 치면 됩니다.

자! 개발 할 준비가 모두 끝났습니다. 쉽쥬 ?

## Vue 프로그램 기본 구축

개발 환경이 끝났다면 바로 동작하는 vue 프로그램을 만들어 보아야 합니다. 

이 과정 역시 따라하시면 바로 끝납니다. 

### 개발 환경 컨테이너 진입

앞에서 설명한 run-bash.sh 을 실행 하여 개발 환경 컨테니너로 진입합니다. 

~~~ bash
$ cd ~/start-study/docker
$ ./run-bash.sh 
~~~

이 후 설명은 개발 환경 컨테이너로 진입한 후 수행한다는 것을 가정합니다. 

### 새로운 vue 프로젝트 생성

가장 먼저 하는 일은 vue cli 3.0 을 사용하여 새로운 vue 프로젝트를 생성하는 겁니다. 

초보자라면 모르는 내용이 대부분이겠지만 그냥 저를 믿고 따라 오시기 바랍니다. 

보통 최근 트랜드에 맞게 프론트앤드를 Vue로 개발한다면 다음과 같은 내용이 포함됩니다. 

* Babel : 자바스크립트 최신 문법을 사용할 수 있도록 해 줍니다. 
* Router : 웹앱을 작성하기 위해서 필수적인 Vue 패키지 입니다. 
* Vuex : vue 의 데이터를 다루기 위한 필수적인 Vue 패키지 입니다. 
* Linter / Formatter : 자바의 문법 검사 및 자동 수정 패키지 입니다.
* Unit Testing : Vue 의 단위 테스트를 수행하는 기능입니다. 
* E2E Testing : 사람 대신 프로그램으로 브라우저 동작을 검증하는 기능입니다. 

* apollo : REST API 를 대신하는 최신 서버 API 기능입니다. 
* vuetify : 개발자가 자신없는 예쁜 홈페이지를 만들수 있도록 도와주는 라이브러리입니다.

이 모든 기능을 포함하는 초기 프로그램을 Vue CLI 3.0 으로 쉽게 만들 수 있습니다. 

새로운 프로젝트는 vue create 만들 수 있는데 개발 환경 컨테이너에 진입한 후 다음 명령을 수행합니다.

새로운 프로젝트를 만들때는 다음과 같은 형식의 명령을 수행합니다. 

> vue create 프로젝트이름

프로젝트 이름은 저는 보통 home-main 같은 형식으로 만듭니다. 

home 은 프런트앤드란 의미이고 main 은 "/" 즉 메인 페이지란 의미가 됩니다. 
REST API 라면 api-main 이런 식으로 이름짓습니다. 

보통 프런트앤드 개발시에는 홈페이지와 각 기능을 담당하는 앱으로 나누어 볼수 있는데 
마이크로 서비스 개발을 할 경우에는 링크만 연결될 뿐 서로 다른 역활을 하므로 
분리해 주는 방식으로 개발합니다. 

지금 만드는 것은 그 중 메인 홈페이지를 만들겠다는 의미입니다.
하지만 이 문서에서 진행하는 따라하기는 학습용이므로 분리해서 개발해 가지는 않을 겁니다. 

다음과 같은 명령으로 만듭니다. 

~~~ bash
$ cd /apps
$ vue create home-main
~~~

이렇게 실행하면 다음과 같이 빠른 설치가 가능한 https://registry.npm.taobao.org 저장소를 사용할 것인지를 묻습니다. 당근 빠른게 좋으니 Y 를 입력하고 엔터를 치거나 디폴트 선택인 엔터를 입력합니다.

~~~ plantext
?  Your connection to the default npm registry seems to be slow.
   Use https://registry.npm.taobao.org for faster installation? (Y/n) 
~~~ 

이렇게 실행하면 다음과 같이 Vue CLI는 초기 프로젝트를 디폴트로 만들것 인지, 매뉴얼로 진행할 지를 물어 봅니다.

경험상 매뉴얼로 하는 것이 정신 건강상 이롭습니다. 따라하기는 매뉴얼로 진행합니다. 
화살표 위 아래 키로 이동하여 Manual 을 선택하고 엔터를 치면 ❯ 가 있는 메뉴가 선택됩니다. 

~~~
Vue CLI v3.0.5
? Please pick a preset: 
  default (babel, eslint) 
❯ Manually select features 
~~~

이렇게 매뉴얼로 선택하면 선택 사항이 아래와 같이 나열됩니다.  
위 아래 화살표 키를 이용하여 ❯ 를 원하는 선택 라인으로 이동하고 스페이스를 이용하여 선택을 하거나 해제 합니다.  
선택은 ◉ 로 표시되고 해제는 ◯ 로 표시됩니다.

~~~
Vue CLI v3.3.0
? Please pick a preset: Manually select features
? Check the features needed for your project: 
❯◉ Babel
 ◯ TypeScript
 ◯ Progressive Web App (PWA) Support
 ◉ Router
 ◉ Vuex
 ◯ CSS Pre-processors
 ◉ Linter / Formatter
 ◉ Unit Testing
 ◉ E2E Testing
~~~~

엎애서 설명했듯이 위에 선택된 형태로 만드신 후 엔터를 치면 다음으로 진행합니다. 

앤터를 치면 선택한 항목마다 다음 선택이 필요한 내용을 물어 보면서 진행됩니다. 

~~~
? Use history mode for router? (Requires proper server setup for index fallback in production) (Y/n) 
~~~

위 항목은 Router 선택에 대한 질문인데, 웹페이지 이동시 라우터에 히스토리 기능을 지원할 것인가에 대한 질문입니다. Y 를 선택합니다.

~~~
? Pick a linter / formatter config: 
  ESLint with error prevention only 
  ESLint + Airbnb config 
❯ ESLint + Standard config 
  ESLint + Prettier 
~~~

eslint 문법 검사기를 어떤 것을 사용할 것인가를 묻는데 Standard 를 선택하는 것이 가장 무난합니다. 
다른 것들은 너무 엄격해서 스트레스 만탕을 하루 하루 느끼게 되거나 아예 안하면 나중에 프로그램이 동작 하다가 뒷통수 칩니다. 

~~~
? Pick additional lint features: 
 ◉ Lint on save
❯◉ Lint and fix on commit
~~~

~~~
? Pick a unit testing solution: (Use arrow keys)
❯ Mocha + Chai 
  Jest 
~~~

단위 테스팅 방법을 질문하는데 저는 Mocha 방식을 좋아 합니다. 이후 cypress 도 Mocha 베이스고  
보통 백엔드도 Mocha 방식을 즐겨 하므로 Mocha 선택을 권장 합니다. 
공부 좋아 하시는 분들은 다른 방식을 선택하셔도 괜찮지만 이 따라 하기 부분에서는 다루지 않습니다. 

~~~
? Pick a E2E testing solution: (Use arrow keys)
❯ Cypress (Chrome only) 
  Nightwatch (Selenium-based) 
~~~

E2E 테스팅 방법을 질문하는데 Cypress 를 선택합니다. 
저는 이전에는 Nightwatch 를 사용했었는데 Cypress 가 빠르다는 소식을 듣고 변심 중입니다. 
대신 공부하는 고생길이 다시 시작되었습니다(흑흑)

~~~
? Where do you prefer placing config for Babel, PostCSS, ESLint, etc.? (Use arrow keys)
❯ In dedicated config files 
  In package.json 
~~~

Vue CLI 에 의해서 설치되는 다양한 패키지들은 환경 설정 파일을 가지고 있는 것들이 있습니다. 
이 환경 설정 파일을 어디에 둘 것인가를 질문하는데
각 패키지별 전용 파일로 관리할 것을 지정합니다. 
package.json 을 건드리는 것을 저 개인적으로 싫어하기 때문입니다. 

~~~
? Save this as a preset for future projects? (y/N) N 
~~~

현재까지 설정된 내용을 다른 프로젝트 생성시에 쓰기 위해 저장할 것인가를 묻는데
전 귀찮지만 매번 선택하여 생성합니다. 그래서 아니오를 선택합니다. 

~~~
? Pick the package manager to use when installing dependencies: (Use arrow keys)
❯ Use Yarn 
  Use NPM 
~~~

패키지 인스톨시에 사용할 명령으로 Yarn 을 쓸건지 NPM 을 쓸건지 묻는데 
전 최근에는 Yarn 을 선호합니다. 

이렇게 선택이 끝나면 바로 프로젝트를 생성하고 패키지들을 인스톨 합니다. 

생성과 패키지 설치가 성공적으로 끝나면 다음과 같은 출력을 볼 수 있습니다. 

~~~ plantext
success Saved lockfile.
Done in 8.67s.
⚓  Running completion hooks...

📄  Generating README.md...

🎉  Successfully created project home-main.
👉  Get started with the following commands:

 $ cd home-main
 $ yarn serve

 WARN  Skipped git commit due to missing username and email in git config.
You will need to perform the initial commit yourself.
~~~

마지막에 경고가 있읍니다.
이것은 깃 자동 커밋에 대한 처리가 유저명, 이메일이 설정되어 있지 않아서 안되어서,
"너 스스로 해!" 하는 말이므로 이 문서의 따라하기에서는 무시합니다. 

저는 상위 프로젝트 폴더로 전체 깃 관리를 합니다.
생성된 프로젝트의 git 관련 디렉토리를 제거 합니다. 

~~~
$ cd home-maim
$ rm -rf .git
~~~

이제 초기 home-main 을 구축 했으므로 컨테이너를 나갑니다. 

~~~
$ exit
~~~

### lint 시험 스크립트 - run-lint.sh

Vue clie 로 구축된 후 개발하면 소스 수정이 실시간으로 웹 페이지에 반영됩니다. 
이때 웹 페이지에도 잘못된 내용이 표시되지만 생각보다 잘 안 보입니다. 
그래서 명령행 문법 검사인 lint 를 실행해서 보는 것이 좋습니다. 

lint 문법 검사를 하는 run-lint.sh 스크립트를 만들어서 사용하는 것이 좋습니다. 



## apollo 패키지 추가 

~~~
$ cd home-main
$ vue add apollo
  ? Add example code (y/N) Y
  ? Add a GraphQL API Server? (y/N) Y
  ? Enable automatic mocking? (y/N) Y 
  ? Add Apollo Engine? (y/N) N

~~~

## vuetify 패키지 추가 

~~~
$ vue add vuetify
~~~

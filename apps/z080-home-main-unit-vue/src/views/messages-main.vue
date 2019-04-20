<template>
  <v-container id="messages-main" fluid fill-height>
      <v-layout
        align-center
        column
      >

        <v-card width=600>
          <v-toolbar color="cyan" dark>
            <v-icon id="btnHome" @click="clickHome">home</v-icon>
            <v-toolbar-title>Messages</v-toolbar-title>
          </v-toolbar>

          <v-list two-line>
            <template v-for="(message, index) in messages">

              <v-list-tile :key="(index+'tl')" :id="('message-' + index)" class="pt-0 pb-0">
                <v-list-tile-content>
                  <v-list-tile-title>{{message.email}} <span class="caption cyan--text">- {{message.time}}</span></v-list-tile-title>
                  <v-list-tile-sub-title>{{message.text}}</v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-divider :key="index"></v-divider>

            </template>
          </v-list>
        </v-card>

        <v-card width=600 class="mt-2">
          <v-toolbar color="amber" dark>
            <v-toolbar-side-icon></v-toolbar-side-icon>
            <v-toolbar-title class="black--text"> Send messages
            </v-toolbar-title>
          </v-toolbar>

          <v-text-field
            id="inMessageText"
            label="Message text"
            placeholder="please typing text"
            outline
            class="pa-3"
            v-model="messageText"
            @keypress="keypressMessageText"
          ></v-text-field>

        </v-card>

      </v-layout>
  </v-container>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  name: 'messages-main',

  data () {
    return {
      messageText: ''
    }
  },

  computed: {
    ...mapGetters({
      messages: 'messages/messages',
      loginEmail: 'users/email'
    }),

    sample: {
      get () { return '' },
      set (newValue) {}
    }
  },

  components: {
  },

  methods: {
    ...mapMutations({
    }),
    ...mapActions({
      sendMessage: 'messages/sendMessage'
    }),
    clickHome () {
      this.$router.push({ name: 'home-main' })
    },
    async keypressMessageText (e) {
      if (e.key === 'Enter') {
        console.log('messageText = ', this.messageText)
        await this.sendMessage({ email: this.loginEmail, text: this.messageText })
      }
    }
  }

  // created () { console.log('CALL created()') },
  // mounted () { console.log('CALL mounted()') },
  // activated () { console.log('CALL activated()') },
  // deactivated () { console.log('CALL deactivated()') },
  // destroyed () { console.log('CALL destroyed()') }
}
</script>

<style>
</style>
<style scoped>
</style>

<template>
  <v-container id="home-main" fluid class="ma-0 pa-0">
    <v-parallax
      dark
      height=400
      src="https://img-s2.onedio.com/id-56ddb4ad606fe1702c52c2b9/rev-0/raw/s-b980e3a17a58f7b7e1021f2df2ddf4c918ca0401.jpg"
    >
      <v-layout
        align-center
        column
        justify-center
      >
        <h1 class="display-2 mb-3 yellow--text">Messages !</h1>
        <h4 class="subheading">Send your message to the world !</h4>
      </v-layout>
    </v-parallax>
    <v-container>
      <v-layout
        align-center
        column
      >
        <v-text-field
          id="lbEmail"
          v-model="email"
          label="E-mail"
        ></v-text-field>

        <v-btn
          id="btnLogin"
          color="warning"
          @click="clickLogin"
        >Login</v-btn>

      </v-layout>
    </v-container>
  </v-container>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  name: 'home-main',

  data () {
    return {
      email: ''
    }
  },

  computed: {
    ...mapGetters({
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
      loginEmail: 'users/email'
    }),
    ...mapActions({
    }),
    clickLogin () {
      if (this.email) {
        this.loginEmail(this.email)
        this.$router.push({ name: 'messages-main' })
      }
    }
  },

  created () { console.log('CALL created()') },
  mounted () { console.log('CALL mounted()') },
  activated () { console.log('CALL activated()') },
  deactivated () { console.log('CALL deactivated()') },
  destroyed () { console.log('CALL destroyed()') }
}
</script>

<style>
</style>
<style scoped>
</style>
